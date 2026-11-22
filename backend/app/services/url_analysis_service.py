"""
URL analysis orchestrator shared by the URL scanner, bulk scanner and QR scanner.

Pipeline (the target URL is never fetched):
  1. static feature extraction + rule engine + Random Forest / Logistic Regression
  2. network-safety verdict on the host (SSRF guard); unsafe hosts are never contacted
     and their URL is never sent to a third party
  3. parallel reputation lookups: VirusTotal, Google Web Risk, URLhaus, urlscan.io (existing results)
  4. short links: expanded hop-by-hop at the shortener only; the destination is analysed, not contacted
  5. optional TLS certificate inspection (handshake only, no HTTP request)
  6. unified engine -> score / verdict / confidence, then the AI analyst explains it
"""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any, Dict, Optional
from urllib.parse import urlparse, urlunparse

from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.database.models import ScanRecord
from backend.app.services import ai_analyst, intel_clients, net_safety
from backend.app.services.intel_common import MALICIOUS, OK, SUSPICIOUS, make_result, ERROR
from backend.app.services.ml_service import MLService
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.scorer import ScorerService
from backend.app.services.ssl_inspector import SSLInspectorService
from backend.app.services.threat_engine import LEGACY_CLASSIFICATION, evaluate
from ml.features.extractor import extract_features

logger = logging.getLogger(__name__)

SOURCE_NAMES = ["VirusTotal", "Google Web Risk", "URLhaus", "urlscan.io"]
VERDICT_LABEL = {
    "SAFE": "Safe (Low Risk)", "SUSPICIOUS": "Suspicious (Exercise Caution)",
    "DANGEROUS": "Dangerous (Probable Threat)", "UNVERIFIED": "Unverified (Low Risk, Unconfirmed)",
}


def lookup_url(raw: str) -> str:
    """URL as it is sent to third-party lookups: scheme added, credentials and fragment removed."""
    u = raw if "://" in raw else "http://" + raw
    try:
        p = urlparse(u)
        host = p.hostname or ""
        if ":" in host:  # IPv6 literal
            host = f"[{host}]"
        netloc = host + (f":{p.port}" if p.port else "")
        return urlunparse((p.scheme, netloc, p.path, p.params, p.query, ""))
    except ValueError:
        return u


class UrlAnalysisService:
    @classmethod
    def _gather_intel(cls, url: str, domain: str, external: bool, allowed: bool, why_not: str) -> Dict[str, Dict[str, Any]]:
        if not external or not allowed:
            reason = "External lookups are disabled for this request (bulk scan protects API quotas)." if not external else why_not
            return {n: intel_clients.skipped(n, reason) for n in SOURCE_NAMES}
        jobs = {
            "VirusTotal": lambda: intel_clients.check_virustotal(url),
            "Google Web Risk": lambda: intel_clients.check_web_risk(url),
            "URLhaus": lambda: intel_clients.check_urlhaus(url, domain),
            "urlscan.io": lambda: intel_clients.check_urlscan(url, domain),
        }
        results: Dict[str, Dict[str, Any]] = {}
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = {pool.submit(fn): name for name, fn in jobs.items()}
            try:
                for fut in as_completed(futures, timeout=settings.INTEL_TIMEOUT_SECONDS * 2 + 4):
                    name = futures[fut]
                    try:
                        results[name] = fut.result()
                    except Exception as e:  # noqa: BLE001
                        results[name] = make_result(name, ERROR, note=f"{name} lookup failed: {type(e).__name__}.")
            except Exception:  # overall deadline
                pass
        for name in SOURCE_NAMES:
            results.setdefault(name, make_result(name, ERROR, note=f"{name} did not answer in time."))
        return {n: results[n] for n in SOURCE_NAMES}

    @classmethod
    def analyze(
        cls,
        raw_url: str,
        db: Optional[Session],
        *,
        external: bool = True,
        persist: bool = True,
        is_qr: bool = False,
        _depth: int = 0,
    ) -> Dict[str, Any]:
        extracted = extract_features(raw_url)
        features, details = extracted["features"], extracted["details"]
        domain = details["domain"]

        threats, safe_indicators, rule_score = RuleEngineService.evaluate(features, details)
        host_text = urlparse(raw_url if "://" in raw_url else "http://" + raw_url).hostname or ""
        hidden_ip = net_safety.numeric_ip(host_text)
        if hidden_ip:
            threats.append({
                "id": "obfuscated_ip_host", "title": "Obfuscated IP Address in URL", "severity": "HIGH",
                "category": "Network & Host",
                "what_was_detected": f"The host '{host_text}' is a disguised numeric IP address that browsers read as {hidden_ip}.",
                "why_it_matters": "Decimal, hex or octal IP spellings are used to hide the real destination and dodge blocklists and filters.",
                "how_attackers_use_it": "Phishers and malware droppers write IPs as single numbers so the link does not look like an address.",
                "what_to_do": "Do not open this link. Legitimate sites never use numbers like this.",
            })
            rule_score = min(100.0, rule_score + 30.0)
        ml = MLService.predict_all(features)

        api_url = lookup_url(raw_url)
        target = net_safety.inspect_target(api_url)
        # A URL pointing at a private network (or using credentials/odd schemes/ports) is never sent to
        # third parties. A host that simply does not resolve (dead phishing domain) still is: it may be listed.
        allow_lookups = bool(target["lookup_ok"])
        intel = cls._gather_intel(api_url, domain, external, allow_lookups,
                                  f"Not sent to third parties: {target['reason']}" if target["reason"] else "Not queried.")

        flagged = any(s["status"] == OK and s["verdict"] in (MALICIOUS, SUSPICIOUS) for s in intel.values())

        # ---- short link expansion (shortener only; destination never contacted)
        redirect: Optional[Dict[str, Any]] = None
        destination: Optional[Dict[str, Any]] = None
        if features.get("is_shortener"):
            if external and target["safe"] and not flagged:
                redirect = net_safety.expand_shortener(api_url)
                final_url = redirect.get("final_url")
                if final_url and redirect.get("expanded") and _depth == 0 and not net_safety.is_shortener_url(final_url):
                    try:
                        sub = cls.analyze(final_url, db, external=external, persist=False, is_qr=is_qr, _depth=1)
                        destination = {
                            "url": final_url, "host": sub["domain"], "score": sub["risk_score"],
                            "verdict": sub["verdict"], "reasons": sub["engine"]["reasons"][:3],
                        }
                    except Exception:  # noqa: BLE001
                        logger.exception("Destination analysis failed")
            else:
                redirect = {"is_shortener": True, "expanded": False, "chain": [], "final_url": None, "error": None,
                            "stopped_reason": "Not expanded: " + ("already flagged by threat intelligence." if flagged else
                                              "external lookups disabled." if not external else (target["reason"] or "blocked."))}

        # ---- TLS certificate (handshake only) when it is safe and worthwhile
        ssl_info = None
        if external and features.get("has_https") and target["safe"] and not flagged and _depth == 0:
            pre = ScorerService.calculate_risk(ml["ensemble"], rule_score, 0.0, threats, domain)["final_score"]
            if pre < 61:
                try:
                    host = urlparse(api_url).hostname or domain
                    ssl_info = SSLInspectorService.inspect(host, ip_address=target["ips"][0])
                except Exception:  # noqa: BLE001
                    ssl_info = None

        built = evaluate(
            url=raw_url, domain=domain, features=features, details=details, threats=threats,
            rule_score=rule_score, ml=ml, intel=intel, redirect=redirect, ssl_info=ssl_info,
            destination=destination, is_qr=is_qr, target=target,
        )
        report = built["report"]
        all_threats = threats + built["extra_threats"]

        # ---- clean confirmations become visible trust signals
        for s in intel.values():
            if s["status"] == OK and s["verdict"] == "clean":
                safe_indicators.append({
                    "id": "intel_clean_" + s["source"].lower().replace(" ", "_").replace(".", ""),
                    "title": f"{s['source']}: no malicious verdict",
                    "severity": "INFORMATIONAL", "category": "Threat Intelligence",
                    "what_was_detected": s["note"], "why_it_matters": "An independent source has no malicious record for this URL.",
                    "how_attackers_use_it": "New phishing pages are often unlisted for hours, so this is supporting evidence only.",
                    "what_to_do": "Still verify the address before entering credentials.",
                })

        # ---- AI analyst (explains; never scores)
        if external and _depth == 0:
            ai = ai_analyst.analyze(report)
        else:
            ai = None
        report["ai_analysis"] = ai

        verdict = report["verdict"]
        final_score = report["score"]
        classification = LEGACY_CLASSIFICATION[verdict]
        summary = (ai or {}).get("headline") or (ai or {}).get("summary") or f"Risk score {final_score}/100 ({verdict})."
        breakdown = {
            "final_score": final_score,
            "ml_score": ml["ensemble"],
            "rule_score": built["effective_rule_score"],
            "threat_intel_score": report["intel_score"],
            "classification": classification,
            "classification_label": VERDICT_LABEL[verdict],
            "summary_explanation": summary,
            "risk_tier": {"SAFE": "LOW", "UNVERIFIED": "UNVERIFIED", "SUSPICIOUS": "MODERATE", "DANGEROUS": "HIGH"}[verdict],
        }

        record_id = None
        created_at = datetime.utcnow()
        if persist and db is not None:
            rec = ScanRecord(
                url=raw_url, domain=domain, risk_score=final_score, classification=classification,
                ml_score=ml["ensemble"], rule_score=built["effective_rule_score"],
                threat_intel_score=report["intel_score"], detected_threats=all_threats, features=features,
                detection_method=("QR Code OpenCV + " if is_qr else "") + "ML (RF + LR) + Rules + Threat Intel",
                verdict=verdict, scan_type="QR" if is_qr else "URL", engine_report=report, created_at=created_at,
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            record_id, created_at = rec.id, rec.created_at

        return {
            "id": record_id, "url": raw_url, "domain": domain, "risk_score": final_score,
            "classification": classification, "verdict": verdict, "breakdown": breakdown,
            "threats_detected": all_threats, "safe_indicators": safe_indicators,
            "features": features, "details": details, "engine": report, "intelligence": intel,
            "redirect": redirect, "ai_analysis": ai, "ml": ml, "target": target,
            "scan_type": "QR" if is_qr else "URL",
            "detection_method": "ML (RF + LR) + Rules + Threat Intel", "created_at": created_at,
        }
