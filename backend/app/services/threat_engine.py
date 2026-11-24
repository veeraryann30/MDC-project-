"""
Unified Threat Detection Engine.

Combines local analysis (ML + rules) with external reputation sources into ONE explainable
0-100 risk score, a verdict and a confidence level.

Design principles (so the number means something):

* Sources are NOT equal. Curated blocklists (Google Web Risk, URLhaus) are high precision;
  a single VirusTotal engine flag is weak, many are strong; local ML/rules cover everything
  but are probabilistic.
* No double counting. VirusTotal aggregates engines that themselves ingest Safe Browsing and
  URLhaus feeds, so reputation sources are combined by taking the STRONGEST signal, plus a
  small capped corroboration bonus. Random Forest and Logistic Regression read the same
  features as the rule engine, so they are blended into one "local" score, not summed.
* Conflicts are surfaced, not hidden. "Reputation clean but heuristics high" is typical of a
  brand-new phishing page; the higher-risk local evidence is kept and confidence is reduced.
* Missing data is never "clean". Unconfigured/failed sources are listed as limitations and a
  low-risk URL with no independent confirmation is reported as UNVERIFIED, not SAFE.
* The AI analyst explains the result and never scores. A separate AI review agent (ai_agent.py) may nudge the
  score by a bounded amount afterwards; it can never lower a reputation-flagged score, and every adjustment is
  recorded in ``agent_review`` (``ai_influences_score`` is True only when one was applied).
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.app.services.intel_common import CLEAN, MALICIOUS, NO_DATA, OK, SUSPICIOUS
from backend.app.services.scorer import ScorerService
from ml.features.extractor import LEGITIMATE_BRAND_DOMAINS

SAFE_MAX = 30.0
SUSPICIOUS_MAX = 60.0

# Share of the confidence budget each source can provide when it answers.
COVERAGE_WEIGHTS = {"VirusTotal": 0.25, "Google Web Risk": 0.25, "URLhaus": 0.10, "urlscan.io": 0.10}
LOCAL_COVERAGE = 0.30  # ML + rules always run

OFFICIAL_DOMAINS = {d for ds in LEGITIMATE_BRAND_DOMAINS.values() for d in ds}


def _is_official_domain(domain: str) -> bool:
    d = (domain or "").lower().lstrip(".")
    return any(d == o or d.endswith("." + o) for o in OFFICIAL_DOMAINS)


def band(score: float) -> str:
    if score <= SAFE_MAX:
        return "SAFE"
    if score <= SUSPICIOUS_MAX:
        return "SUSPICIOUS"
    return "DANGEROUS"


LEGACY_CLASSIFICATION = {
    "SAFE": "SAFE", "SUSPICIOUS": "SUSPICIOUS", "DANGEROUS": "PHISHING", "UNVERIFIED": "UNVERIFIED",
}


def _cert_age_days(valid_from: Optional[str]) -> Optional[int]:
    if not valid_from:
        return None
    try:
        return (datetime.utcnow() - datetime.strptime(valid_from, "%b %d %H:%M:%S %Y %Z")).days
    except Exception:
        return None


def _intel_threat(src: Dict[str, Any]) -> Dict[str, Any]:
    name = src["source"]
    sev = "HIGH" if src["score"] >= 70 else "MEDIUM"
    return {
        "id": "intel_" + name.lower().replace(" ", "_").replace(".", ""),
        "title": f"{name}: flagged by threat intelligence",
        "severity": sev,
        "category": "Threat Intelligence",
        "what_was_detected": src["note"],
        "why_it_matters": "Independent security feeds are built from confirmed reports and automated detection of live attacks.",
        "how_attackers_use_it": "Listed URLs are typically active phishing kits, malware droppers or credential harvesters.",
        "what_to_do": "Do not open the link or enter any information. Report it if it reached you by message or QR code.",
    }


def evaluate(
    *,
    url: str,
    domain: str,
    features: Dict[str, Any],
    details: Dict[str, Any],
    threats: List[Dict[str, Any]],
    rule_score: float,
    ml: Dict[str, Any],
    intel: Dict[str, Dict[str, Any]],
    redirect: Optional[Dict[str, Any]] = None,
    ssl_info: Optional[Dict[str, Any]] = None,
    destination: Optional[Dict[str, Any]] = None,
    is_qr: bool = False,
    target: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    extra_threats: List[Dict[str, Any]] = []
    reasons: List[str] = []
    conflicts: List[str] = []
    limitations: List[str] = []

    # ---------------------------------------------------------------- local analysis
    ssl_penalty = 0.0
    if ssl_info and features.get("has_https"):
        status = str(ssl_info.get("status", ""))
        err = str(ssl_info.get("error") or "").lower()
        # Only definite problems are penalised. "unable to get local issuer" is usually a server that omits
        # its intermediate certificate (browsers repair this, Python does not), so it proves nothing.
        definite = ssl_info.get("is_expired") or any(k in err for k in ("self-signed", "self signed", "hostname mismatch", "has expired"))
        if definite:
            ssl_penalty += 12.0
            extra_threats.append({
                "id": "tls_certificate_invalid",
                "title": "Invalid or untrusted TLS certificate",
                "severity": "MEDIUM", "category": "Transport Security",
                "what_was_detected": f"The server's certificate check reported: {status}.",
                "why_it_matters": "Legitimate sites present a valid certificate from a trusted authority.",
                "how_attackers_use_it": "Throwaway phishing servers often use self-signed, expired or mismatched certificates.",
                "what_to_do": "Do not proceed past a browser certificate warning.",
            })
        age = _cert_age_days(ssl_info.get("valid_from"))
        if age is not None and age < 7 and (details.get("matched_keywords") or (details.get("brand_analysis") or {}).get("impersonation_detected")):
            ssl_penalty += 5.0
            reasons.append(f"The TLS certificate was issued only {age} day(s) ago on a domain with login or brand keywords.")
    elif not ssl_info and features.get("has_https"):
        limitations.append("TLS certificate was not inspected (skipped to avoid contacting a possibly hostile host).")

    eff_rule = min(100.0, round(rule_score + ssl_penalty, 1))
    ml_score = float(ml.get("ensemble", 0.0))
    local = ScorerService.calculate_risk(
        ml_score=ml_score, rule_score=eff_rule, threat_intel_score=0.0,
        threats_detected=threats + extra_threats, domain=domain,
    )
    local_score = float(local["final_score"])

    # ---------------------------------------------------------------- reputation sources
    flagged = [s for s in intel.values() if s["status"] == OK and s["verdict"] in (MALICIOUS, SUSPICIOUS)]
    clean_confirmations = [s for s in intel.values() if s["status"] == OK and s["verdict"] == CLEAN]

    intel_score = 0.0
    if flagged:
        flagged_sorted = sorted(flagged, key=lambda s: s["score"], reverse=True)
        intel_score = flagged_sorted[0]["score"]
        # Corroboration from *independent* sources only; a lone weak VirusTotal flag does not corroborate.
        extras = 0
        for s in flagged_sorted[1:]:
            if s["source"] == "VirusTotal" and (s.get("details") or {}).get("malicious", 0) < 2:
                continue
            extras += 1
        intel_score = min(100.0, intel_score + min(8.0, 4.0 * extras))
        for s in flagged_sorted:
            extra_threats.append(_intel_threat(s))
            reasons.append(f"{s['source']}: {s['note']}")

    final = max(local_score, intel_score)

    # ---------------------------------------------------------------- short-link destination
    dest_verified = True
    if destination:
        d_score = float(destination.get("score", 0.0))
        dest_verified = destination.get("verdict") in ("SAFE",)
        if d_score > final:
            final = d_score
        reasons.append(
            f"The short link expands to {destination.get('host') or 'another site'}, which was analysed separately and scored "
            f"{round(d_score)}/100 ({destination.get('verdict')})."
        )
        for r in (destination.get("reasons") or [])[:3]:
            reasons.append(f"Destination: {r}")

    # ---------------------------------------------------------------- conflicts
    if clean_confirmations and local_score >= 61 and not flagged:
        names = ", ".join(s["source"] for s in clean_confirmations)
        conflicts.append(
            f"{names} did not flag this URL, but local analysis rates it {round(local_score)}/100. "
            "Brand-new phishing pages are often not listed yet, so the higher-risk local evidence is kept."
        )
    if flagged and local_score < 31:
        conflicts.append(
            "Threat intelligence flags this URL although its structure looks ordinary. This usually means a "
            "legitimate-looking or compromised site; the reputation signal takes precedence."
        )
    if ml.get("models_disagree"):
        conflicts.append(f"The two ML models disagree (Random Forest {ml.get('rf')}% vs Logistic Regression {ml.get('lr')}%).")
    if destination and destination.get("verdict") == "DANGEROUS" and local_score < 31:
        conflicts.append("The short link itself looks harmless but its destination is dangerous.")

    final = round(min(100.0, max(0.0, final)), 1)

    # ---------------------------------------------------------------- reasons from local analysis
    for t in sorted(threats + [x for x in extra_threats if not x["id"].startswith("intel_")],
                    key=lambda t: {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}.get(t.get("severity"), 4))[:5]:
        reasons.append(f"{t['title']}: {t.get('what_was_detected', '')}".strip())
    if ml.get("rf") is not None:
        reasons.append(f"Random Forest estimates {ml['rf']}% phishing probability"
                       + (f"; Logistic Regression {ml['lr']}%." if ml.get("lr") is not None else "."))
    if redirect and redirect.get("is_shortener"):
        hosts = [h["host"] for h in redirect.get("chain", []) if h.get("host")]
        if redirect.get("expanded"):
            reasons.append("Short link redirect chain: " + " -> ".join(hosts) + " (destination not contacted).")
        elif redirect.get("error"):
            limitations.append(f"Short link could not be expanded: {redirect['error']}")

    # ---------------------------------------------------------------- verification & verdict
    verified_by = [s["source"] for s in clean_confirmations]
    if _is_official_domain(domain) and not any(t.get("severity") in ("HIGH", "CRITICAL") for t in threats):
        verified_by.append("Official brand domain")
    verified = bool(verified_by) and dest_verified

    verdict = band(final)
    if verdict == "SAFE" and not verified:
        verdict = "UNVERIFIED"

    # ---------------------------------------------------------------- honest limitations
    for name, s in intel.items():
        if s["status"] not in (OK, NO_DATA):
            limitations.append(f"{name}: {s['note'] or s['status']}")
        elif s["status"] == NO_DATA:
            limitations.append(f"{name}: {s['note']}")
    if target and not target.get("safe") and target.get("reason"):
        limitations.append(f"Network checks skipped: {target['reason']}")
    if verdict == "UNVERIFIED":
        limitations.append("No reputation source confirmed this URL; low risk indicators alone do not make a URL safe.")

    # ---------------------------------------------------------------- confidence
    pct = LOCAL_COVERAGE * 100
    for name, w in COVERAGE_WEIGHTS.items():
        s = intel.get(name)
        if not s:
            continue
        if s["status"] == OK:
            pct += w * 100
        elif s["status"] == NO_DATA:
            pct += w * 50
    if verdict == "DANGEROUS" and flagged:
        pct += 10
    if ml_score >= 70 and eff_rule >= 50 and local_score >= 61:
        pct += 8  # two partly independent local methods agree
    pct -= 12 * len(conflicts)
    pct = int(max(10, min(97, round(pct))))
    label = "HIGH" if pct >= 75 else "MEDIUM" if pct >= 50 else "LOW"

    # ---------------------------------------------------------------- components for the UI
    def comp(cid, name, group, status, score=None, verdict_=None, note="", reference=None):
        return {"id": cid, "name": name, "group": group, "status": status, "score": score,
                "verdict": verdict_, "note": note, "reference": reference}

    components = [
        comp("rf", "Random Forest", "Machine learning", "ok", ml.get("rf"), None,
             "Primary classifier; carries 70% of the ML estimate."),
        comp("lr", "Logistic Regression", "Machine learning", "ok" if ml.get("lr") is not None else "unavailable",
             ml.get("lr"), None, "Linear baseline; carries 30% of the ML estimate." if ml.get("lr") is not None else "Model file not available."),
        comp("rules", "Heuristic rules", "Local analysis", "ok", eff_rule, None,
             "Brand impersonation, typosquatting, keywords, shorteners, TLS and structure checks."),
    ]
    for name, s in intel.items():
        components.append(comp(
            "src_" + name.lower().replace(" ", "_").replace(".", ""), name, "Reputation source", s["status"],
            s["score"] if s["verdict"] in (MALICIOUS, SUSPICIOUS) else None, s["verdict"], s["note"], s.get("reference"),
        ))

    score_path = [
        {"step": "Local analysis (ML 50% + rules 50%, with high-severity floors)", "value": round(local_score, 1)},
        {"step": "Strongest reputation signal (+ small corroboration bonus)", "value": round(intel_score, 1) if flagged else None},
    ]
    if destination:
        score_path.append({"step": "Short-link destination analysis", "value": round(float(destination.get("score", 0)), 1)})
    score_path.append({"step": "Final score (highest of the above - signals are not summed)", "value": final})

    model_scores = {"random_forest": ml.get("rf"), "logistic_regression": ml.get("lr"), "ml_ensemble": ml.get("ensemble")}

    report = {
        "url": url,
        "domain": domain,
        "score": final,
        "verdict": verdict,
        "legacy_classification": LEGACY_CLASSIFICATION[verdict],
        "confidence": {"label": label, "pct": pct},
        "verified": verified,
        "verified_by": verified_by,
        "local_score": round(local_score, 1),
        "intel_score": round(intel_score, 1),
        "model_scores": model_scores,
        "components": components,
        "score_path": score_path,
        "reasons": reasons[:12],
        "conflicts": conflicts,
        "limitations": limitations,
        "sources": intel,
        "redirect": redirect,
        "ssl": ssl_info,
        "destination": destination,
        "is_qr": is_qr,
        "ai_influences_score": False,
        "sources_answered": sum(1 for s in intel.values() if s["status"] in (OK, NO_DATA)),
        "sources_total": len(intel),
    }
    return {"report": report, "extra_threats": extra_threats, "effective_rule_score": eff_rule, "local": local}


def apply_agent_review(report: Dict[str, Any], review: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fold an already-guarded AI agent review (see ai_agent.decide) into the report.
    The review is always attached for auditing; the score, verdict and score path change only when it was applied.
    """
    report["agent_review"] = review
    if not review.get("applied"):
        return report

    report["engine_score"] = report["score"]
    report["score"] = review["final_score"]
    verdict = band(report["score"])
    if verdict == "SAFE" and not report.get("verified"):
        verdict = "UNVERIFIED"
    report["verdict"] = verdict
    report["legacy_classification"] = LEGACY_CLASSIFICATION[verdict]
    report["ai_influences_score"] = True

    direction = "raised" if review["adjustment"] > 0 else "lowered"
    path = report["score_path"]
    path.append({"step": f"AI review agent {direction} the score by {abs(review['adjustment'])} (bounded, evidence-checked)",
                 "value": report["score"]})
    report["reasons"] = (report["reasons"] + [f"AI review agent: {review['reasoning']}"] if review.get("reasoning") else report["reasons"])[:13]
    return report
