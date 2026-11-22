"""
Threat-intelligence provider clients (all server-side; API keys never reach the browser).

VirusTotal, Google Web Risk, URLhaus and urlscan.io all return the same result shape
(see ``intel_common.make_result``). A provider that is not configured, rate limited or failing
reports exactly that: it is never converted into a "clean" verdict.

Privacy note: looking a URL up sends that URL to the provider. VirusTotal / Web Risk / URLhaus
lookups are read-only. urlscan.io lookups only SEARCH existing public results; a new scan
(which makes urlscan's infrastructure visit the page) happens only when the user explicitly
requests the deep behavioural scan.
"""

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from backend.app.core.config import settings
from backend.app.services import intel_common as ic
from backend.app.services.intel_common import (
    CLEAN, ERROR, MALICIOUS, NO_DATA, NOT_CONFIGURED, OK, RATE_LIMITED, SKIPPED, SUSPICIOUS, UNKNOWN,
    RateBudget, TTLCache, health, make_result,
)
from backend.app.services.threat_intel import ThreatIntelService

USER_AGENT = "CatchThePhish-ThreatIntelligence/2.0"
MAX_BODY = 5 * 1024 * 1024
UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")

_ttl = float(settings.INTEL_CACHE_TTL_SECONDS)
_cache_webrisk = TTLCache(_ttl)
_cache_urlhaus = TTLCache(min(_ttl, 1800))
_cache_urlscan = TTLCache(_ttl)

budget_webrisk = RateBudget(settings.WEB_RISK_REQUESTS_PER_MINUTE)
budget_urlhaus = RateBudget(settings.URLHAUS_REQUESTS_PER_MINUTE)
budget_urlscan_search = RateBudget(settings.URLSCAN_SEARCH_PER_MINUTE)
budget_urlscan_submit = RateBudget(settings.URLSCAN_SUBMIT_PER_MINUTE)


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Provider APIs never legitimately redirect; refusing keeps API keys from leaking to other hosts."""

    def redirect_request(self, *a, **k):  # noqa: D401
        return None


_opener = urllib.request.build_opener(_NoRedirect)


def _http_json(req: urllib.request.Request, timeout: Optional[float] = None) -> Any:
    with _opener.open(req, timeout=timeout or settings.INTEL_TIMEOUT_SECONDS) as resp:
        raw = resp.read(MAX_BODY + 1)
    if len(raw) > MAX_BODY:
        raise ValueError("response too large")
    return json.loads(raw.decode("utf-8")) if raw else {}


def _elapsed(t0: float) -> int:
    return int((time.monotonic() - t0) * 1000)


def _finish(provider: str, result: Dict[str, Any], error: Optional[str] = None) -> Dict[str, Any]:
    health.record(provider, result["status"], result.get("latency_ms"), error)
    return result


def _http_error_result(source: str, e: urllib.error.HTTPError, t0: float) -> Dict[str, Any]:
    if e.code == 429:
        return make_result(source, RATE_LIMITED, note=f"{source} rate limit reached (HTTP 429); try again later.", latency_ms=_elapsed(t0))
    if e.code in (401, 403):
        return make_result(source, ERROR, note=f"{source} rejected the API key (HTTP {e.code}). Check the configured key.", latency_ms=_elapsed(t0))
    return make_result(source, ERROR, note=f"{source} API returned HTTP {e.code}.", latency_ms=_elapsed(t0))


# --------------------------------------------------------------------------- VirusTotal
def check_virustotal(url: str) -> Dict[str, Any]:
    src = "VirusTotal"
    if not settings.VIRUSTOTAL_API_KEY:
        return make_result(src, NOT_CONFIGURED, note="Not configured. Set VIRUSTOTAL_API_KEY on the server.")
    t0 = time.monotonic()
    vt = ThreatIntelService.query_virustotal_url(url)
    ms = _elapsed(t0)
    note = vt.get("note", "")
    if vt.get("rate_limited"):
        return _finish("virustotal", make_result(src, RATE_LIMITED, note=note, latency_ms=ms))
    status_key = vt.get("status")
    if not vt.get("available"):
        return _finish("virustotal", make_result(src, ERROR, note=note, latency_ms=ms), note)
    if status_key == "unknown":  # 404: VirusTotal has never seen this URL
        return _finish("virustotal", make_result(src, NO_DATA, UNKNOWN, 0, note, latency_ms=ms))
    verdict = {"malicious": MALICIOUS, "suspicious": SUSPICIOUS, "clean": CLEAN}.get(status_key, UNKNOWN)
    details = {"malicious": vt.get("malicious_count", 0), "suspicious": vt.get("suspicious_count", 0)}
    return _finish("virustotal", make_result(src, OK, verdict, vt.get("threat_score", 0.0), note, details, ms))


# --------------------------------------------------------------------------- Google Web Risk
_WEBRISK_SEVERITY = {"SOCIAL_ENGINEERING": 92.0, "MALWARE": 92.0, "UNWANTED_SOFTWARE": 70.0}
_WEBRISK_LABEL = {"SOCIAL_ENGINEERING": "phishing / social engineering", "MALWARE": "malware", "UNWANTED_SOFTWARE": "unwanted software"}


def check_web_risk(url: str) -> Dict[str, Any]:
    src = "Google Web Risk"
    if not settings.GOOGLE_WEB_RISK_API_KEY:
        return make_result(src, NOT_CONFIGURED, note="Not configured. Set GOOGLE_WEB_RISK_API_KEY on the server.")
    cached = _cache_webrisk.get(url)
    if cached:
        return dict(cached)
    if not budget_webrisk.allow():
        return _finish("webrisk", make_result(src, RATE_LIMITED, note="Local Web Risk call budget reached; retry shortly."))
    t0 = time.monotonic()
    q = urllib.parse.urlencode(
        [("threatTypes", t) for t in ("MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE")] + [("uri", url)]
    )
    req = urllib.request.Request(
        f"https://webrisk.googleapis.com/v1/uris:search?{q}",
        headers={"X-Goog-Api-Key": settings.GOOGLE_WEB_RISK_API_KEY, "Accept": "application/json", "User-Agent": USER_AGENT},
    )
    try:
        data = _http_json(req)
        threat = (data or {}).get("threat") or {}
        types: List[str] = [t for t in threat.get("threatTypes", []) if t in _WEBRISK_SEVERITY]
        ms = _elapsed(t0)
        if types:
            score = max(_WEBRISK_SEVERITY[t] for t in types)
            labels = ", ".join(_WEBRISK_LABEL[t] for t in types)
            res = make_result(src, OK, MALICIOUS, score, f"Google Web Risk lists this URL as: {labels}.", {"threat_types": types}, ms)
        else:
            res = make_result(src, OK, CLEAN, 0, "Not on Google Web Risk's current phishing/malware/unwanted-software lists (this does not prove the site is safe).", {"threat_types": []}, ms)
        _cache_webrisk.set(url, res)
        return _finish("webrisk", res)
    except urllib.error.HTTPError as e:
        r = _http_error_result(src, e, t0)
        return _finish("webrisk", r, r["note"])
    except Exception as e:  # noqa: BLE001
        return _finish("webrisk", make_result(src, ERROR, note=f"Web Risk query failed: {type(e).__name__}.", latency_ms=_elapsed(t0)), str(e))


# --------------------------------------------------------------------------- URLhaus (abuse.ch)
def _urlhaus_post(endpoint: str, field: str, value: str) -> Dict[str, Any]:
    body = urllib.parse.urlencode({field: value}).encode()
    req = urllib.request.Request(
        f"https://urlhaus-api.abuse.ch/v1/{endpoint}/", data=body, method="POST",
        headers={"Auth-Key": settings.URLHAUS_AUTH_KEY, "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT},
    )
    return _http_json(req)


def check_urlhaus(url: str, host: str) -> Dict[str, Any]:
    src = "URLhaus"
    if not settings.URLHAUS_AUTH_KEY:
        return make_result(src, NOT_CONFIGURED, note="Not configured. Set URLHAUS_AUTH_KEY (free abuse.ch Auth-Key) on the server.")
    key = f"{url}|{host}"
    cached = _cache_urlhaus.get(key)
    if cached:
        return dict(cached)
    if not budget_urlhaus.allow():
        return _finish("urlhaus", make_result(src, RATE_LIMITED, note="Local URLhaus call budget reached; retry shortly."))
    t0 = time.monotonic()
    try:
        data = _urlhaus_post("url", "url", url)
        qs = data.get("query_status")
        if qs == "ok":
            online = str(data.get("url_status", "")).lower() == "online"
            tags = [str(t) for t in (data.get("tags") or [])][:6]
            threat = str(data.get("threat") or "malware_download")
            score = 95.0 if online else 80.0
            state = "currently ONLINE" if online else "listed (now offline)"
            res = make_result(
                src, OK, MALICIOUS, score,
                f"URLhaus lists this exact URL as {threat.replace('_', ' ')}; it is {state}.",
                {"match": "url", "url_status": data.get("url_status"), "threat": threat, "tags": tags, "date_added": data.get("date_added")},
                _elapsed(t0), data.get("urlhaus_reference"),
            )
        elif qs in ("no_results", "invalid_url"):
            # Not listed by URL: also check whether the whole host is a known malware-distribution host.
            hdata = _urlhaus_post("host", "host", host) if host and budget_urlhaus.allow() else {"query_status": "skipped"}
            if hdata.get("query_status") == "ok":
                urls = hdata.get("urls") or []
                online_n = sum(1 for u in urls if str(u.get("url_status", "")).lower() == "online")
                total = len(urls) or int(hdata.get("url_count") or 0)
                score = 70.0 if online_n else 50.0
                res = make_result(
                    src, OK, SUSPICIOUS if not online_n else MALICIOUS, score,
                    f"The host {host} appears in URLhaus with {total} malware URL(s) ({online_n} online); this specific URL is not listed.",
                    {"match": "host", "url_count": total, "online_count": online_n}, _elapsed(t0), hdata.get("urlhaus_reference"),
                )
            else:
                res = make_result(src, OK, CLEAN, 0, "Neither this URL nor its host is listed in URLhaus (this does not prove the site is safe).", {"match": None}, _elapsed(t0))
        else:
            res = make_result(src, ERROR, note=f"URLhaus returned query_status '{qs}'.", latency_ms=_elapsed(t0))
            return _finish("urlhaus", res, str(qs))
        _cache_urlhaus.set(key, res)
        return _finish("urlhaus", res)
    except urllib.error.HTTPError as e:
        r = _http_error_result(src, e, t0)
        return _finish("urlhaus", r, r["note"])
    except Exception as e:  # noqa: BLE001
        return _finish("urlhaus", make_result(src, ERROR, note=f"URLhaus query failed: {type(e).__name__}.", latency_ms=_elapsed(t0)), str(e))


# --------------------------------------------------------------------------- urlscan.io
def _urlscan_headers(json_body: bool = False) -> Dict[str, str]:
    h = {"API-Key": settings.URLSCAN_API_KEY, "Accept": "application/json", "User-Agent": USER_AGENT}
    if json_body:
        h["Content-Type"] = "application/json"
    return h


def _summarize_urlscan_result(data: Dict[str, Any], uuid: str) -> Dict[str, Any]:
    """Pull only well-defined fields from a urlscan result document."""
    verdicts = (data.get("verdicts") or {})
    overall = verdicts.get("overall") or {}
    us = verdicts.get("urlscan") or {}
    page = data.get("page") or {}
    task = data.get("task") or {}
    stats = data.get("stats") or {}
    requests = (data.get("data") or {}).get("requests") or []
    redirects = sum(1 for r in requests if (r.get("request") or {}).get("redirectResponse"))
    task_host = urllib.parse.urlparse(str(task.get("url", ""))).hostname
    page_host = page.get("domain") or urllib.parse.urlparse(str(page.get("url", ""))).hostname
    cross_domain_redirect = bool(task_host and page_host and task_host.lower() != str(page_host).lower())
    return {
        "uuid": uuid,
        "report_url": f"https://urlscan.io/result/{uuid}/",
        "scanned_at": task.get("time"),
        "malicious": bool(overall.get("malicious") or us.get("malicious")),
        "score": int(overall.get("score") or 0),
        "categories": [str(c) for c in (overall.get("categories") or us.get("categories") or [])][:6],
        "brands": [str(b.get("name") if isinstance(b, dict) else b) for b in (overall.get("brands") or us.get("brands") or [])][:5],
        "page_url": str(page.get("url", ""))[:300],
        "page_ip": page.get("ip"),
        "page_country": page.get("country"),
        "server": page.get("server"),
        "tls_issuer": page.get("tlsIssuer"),
        "redirect_count": redirects,
        "cross_domain_redirect": cross_domain_redirect,
        "final_host": page_host,
        "requests": len(requests),
        "unique_ips": stats.get("uniqIPs"),
        "unique_countries": stats.get("uniqCountries"),
    }


def _urlscan_get(path: str) -> Any:
    req = urllib.request.Request(f"https://urlscan.io{path}", headers=_urlscan_headers())
    return _http_json(req, timeout=max(settings.INTEL_TIMEOUT_SECONDS, 8))


def _lucene_quote(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def check_urlscan(url: str, domain: str) -> Dict[str, Any]:
    """Look up EXISTING urlscan.io results (no new scan, no visit)."""
    src = "urlscan.io"
    if not settings.URLSCAN_API_KEY:
        return make_result(src, NOT_CONFIGURED, note="Not configured. Set URLSCAN_API_KEY on the server.")
    cached = _cache_urlscan.get(url)
    if cached:
        return dict(cached)
    if not budget_urlscan_search.allow():
        return _finish("urlscan", make_result(src, RATE_LIMITED, note="Local urlscan.io call budget reached; retry shortly."))
    t0 = time.monotonic()
    try:
        match = "exact_url"
        search = _urlscan_get("/api/v1/search/?size=3&q=" + urllib.parse.quote(f"page.url:{_lucene_quote(url)}"))
        results = search.get("results") or []
        if not results and domain:
            match = "domain"
            search = _urlscan_get("/api/v1/search/?size=3&q=" + urllib.parse.quote(f"page.domain:{_lucene_quote(domain)}"))
            results = search.get("results") or []
        if not results:
            res = make_result(src, NO_DATA, UNKNOWN, 0, "urlscan.io has no existing scan for this URL or domain (use the deep scan to create one).", latency_ms=_elapsed(t0))
            _cache_urlscan.set(url, res)
            return _finish("urlscan", res)
        uuid = str((results[0].get("task") or {}).get("uuid") or results[0].get("_id") or "")
        if not UUID_RE.match(uuid):
            return _finish("urlscan", make_result(src, ERROR, note="urlscan.io returned an unexpected result id.", latency_ms=_elapsed(t0)))
        summary = _summarize_urlscan_result(_urlscan_get(f"/api/v1/result/{uuid}/"), uuid)
        summary["match"] = match
        ms = _elapsed(t0)
        scope = "this URL" if match == "exact_url" else f"another page on {domain}"
        if summary["malicious"]:
            score = max(80.0, float(summary["score"])) if match == "exact_url" else 60.0
            cats = ", ".join(summary["categories"]) or "malicious"
            res = make_result(src, OK, MALICIOUS if match == "exact_url" else SUSPICIOUS, score, f"urlscan.io previously scanned {scope} and flagged it ({cats}).", summary, ms, summary["report_url"])
        elif summary["score"] > 0:
            res = make_result(src, OK, SUSPICIOUS, min(60.0, 25.0 + summary["score"]), f"urlscan.io scanned {scope} and rated it mildly suspicious (score {summary['score']}).", summary, ms, summary["report_url"])
        elif match == "exact_url":
            res = make_result(src, OK, CLEAN, 0, "urlscan.io scanned this URL earlier and found no malicious verdict (a past scan does not prove it is safe today).", summary, ms, summary["report_url"])
        else:
            res = make_result(src, NO_DATA, UNKNOWN, 0, f"urlscan.io has scans for {domain} but none for this exact URL; no malicious verdict on those.", summary, ms, summary["report_url"])
        _cache_urlscan.set(url, res)
        return _finish("urlscan", res)
    except urllib.error.HTTPError as e:
        r = _http_error_result(src, e, t0)
        return _finish("urlscan", r, r["note"])
    except Exception as e:  # noqa: BLE001
        return _finish("urlscan", make_result(src, ERROR, note=f"urlscan.io query failed: {type(e).__name__}.", latency_ms=_elapsed(t0)), str(e))


def urlscan_submit(url: str) -> Dict[str, Any]:
    """User-initiated deep scan: urlscan.io's own infrastructure visits the page (unlisted visibility)."""
    if not settings.URLSCAN_API_KEY:
        return {"ok": False, "status": NOT_CONFIGURED, "message": "urlscan.io is not configured. Set URLSCAN_API_KEY on the server."}
    if not budget_urlscan_submit.allow():
        return {"ok": False, "status": RATE_LIMITED, "message": "Deep-scan budget reached. Please wait a minute and try again."}
    t0 = time.monotonic()
    body = json.dumps({"url": url, "visibility": "unlisted"}).encode()
    req = urllib.request.Request("https://urlscan.io/api/v1/scan/", data=body, method="POST", headers=_urlscan_headers(True))
    try:
        data = _http_json(req)
        uuid = str(data.get("uuid", ""))
        if not UUID_RE.match(uuid):
            return {"ok": False, "status": ERROR, "message": "urlscan.io returned an unexpected response."}
        health.record("urlscan", OK, _elapsed(t0))
        return {"ok": True, "status": OK, "uuid": uuid, "report_url": f"https://urlscan.io/result/{uuid}/", "message": "Deep scan submitted (unlisted)."}
    except urllib.error.HTTPError as e:
        msg = {400: "urlscan.io refused this URL (it may be unresolvable or blocked).", 429: "urlscan.io rate limit reached."}.get(e.code, f"urlscan.io returned HTTP {e.code}.")
        health.record("urlscan", RATE_LIMITED if e.code == 429 else ERROR, _elapsed(t0), msg)
        return {"ok": False, "status": RATE_LIMITED if e.code == 429 else ERROR, "message": msg}
    except Exception as e:  # noqa: BLE001
        health.record("urlscan", ERROR, _elapsed(t0), str(e))
        return {"ok": False, "status": ERROR, "message": f"urlscan.io submission failed: {type(e).__name__}."}


def urlscan_result(uuid: str) -> Dict[str, Any]:
    if not UUID_RE.match(uuid or ""):
        return {"state": "error", "message": "Invalid scan id."}
    if not settings.URLSCAN_API_KEY:
        return {"state": "error", "message": "urlscan.io is not configured."}
    try:
        data = _urlscan_get(f"/api/v1/result/{uuid}/")
        return {"state": "done", "summary": _summarize_urlscan_result(data, uuid)}
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return {"state": "pending", "message": "Scan still running."}
        if e.code == 410:
            return {"state": "error", "message": "This scan was deleted."}
        return {"state": "error", "message": f"urlscan.io returned HTTP {e.code}."}
    except Exception as e:  # noqa: BLE001
        return {"state": "error", "message": f"urlscan.io query failed: {type(e).__name__}."}


def skipped(source: str, why: str) -> Dict[str, Any]:
    return make_result(source, SKIPPED, note=why)
