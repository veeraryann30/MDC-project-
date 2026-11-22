"""
Detection-engine status and on-demand urlscan.io deep scan.

* GET  /engines/status         honest per-engine state (configured? last real call result, latency, counters)
* POST /urlscan/submit         user-initiated behavioural scan (urlscan.io visits the page, unlisted)
* GET  /urlscan/result/{uuid}  poll the scan result

API keys are never returned; only whether each is configured.
"""

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from backend.app.core.config import settings
from backend.app.services import intel_clients, net_safety
from backend.app.services.intel_common import health
from backend.app.services.ml_service import MLService, MODEL_PATH
from backend.app.services.url_analysis_service import lookup_url

router = APIRouter()


def _external(pid: str, name: str, role: str, configured: bool) -> dict:
    snap = health.snapshot(pid)
    if not configured:
        state = "not_configured"
    elif not snap:
        state = "idle"            # configured but not yet exercised by a scan
    elif snap.get("last_status") in ("ok", "no_data"):
        state = "online"
    else:
        state = "degraded"
    return {
        "id": pid, "name": name, "role": role, "kind": "external", "configured": configured, "state": state,
        "last_checked": snap.get("last_checked"), "last_latency_ms": snap.get("last_latency_ms"),
        "last_error": snap.get("last_error"), "ok_count": snap.get("ok", 0),
        "failed_count": snap.get("failed", 0), "rate_limited_count": snap.get("rate_limited", 0),
    }


def _local(pid: str, name: str, role: str, available: bool, detail: str = "") -> dict:
    return {"id": pid, "name": name, "role": role, "kind": "local", "configured": True,
            "state": "online" if available else "degraded", "detail": detail,
            "last_checked": None, "last_latency_ms": None, "last_error": None,
            "ok_count": 0, "failed_count": 0, "rate_limited_count": 0}


@router.get("/engines/status")
def engines_status():
    try:
        import cv2
        cv_ver = cv2.__version__
        qr_ok = hasattr(cv2, "QRCodeDetector")
    except Exception:
        cv_ver, qr_ok = "", False
    rf_ok = os.path.exists(MODEL_PATH)
    engines = [
        _local("random_forest", "Random Forest", "URL phishing classifier", rf_ok, "ml/models/phishing_rf_model.joblib"),
        _local("logistic_regression", "Logistic Regression", "Linear baseline classifier", MLService.lr_available()),
        _local("rules", "Heuristic rule engine", "Brand impersonation, typosquatting, keywords, shorteners", True),
        _local("qr_decoder", "QR decoder (OpenCV)", "Image and PDF QR extraction", qr_ok, f"OpenCV {cv_ver}" if cv_ver else ""),
        _external("virustotal", "VirusTotal", "Multi-engine URL reputation", bool(settings.VIRUSTOTAL_API_KEY)),
        _external("webrisk", "Google Web Risk", "Phishing / malware / unwanted software lists", bool(settings.GOOGLE_WEB_RISK_API_KEY)),
        _external("urlhaus", "URLhaus", "Malware-distribution URL and host database", bool(settings.URLHAUS_AUTH_KEY)),
        _external("urlscan", "urlscan.io", "Website behaviour and redirect analysis", bool(settings.URLSCAN_API_KEY)),
        _external("groq", "Groq AI analyst", f"Explains evidence ({settings.GROQ_MODEL})", bool(settings.GROQ_API_KEY)),
    ]
    external = [e for e in engines if e["kind"] == "external"]
    return {
        "engines": engines,
        "configured_external": sum(1 for e in external if e["configured"]),
        "total_external": len(external),
        "note": "'idle' means the key is set but no scan has called the service yet; state reflects real calls only.",
    }


class UrlscanSubmit(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def _v(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 2048 or any(c in v for c in "\r\n\t"):
            raise ValueError("Invalid URL.")
        return v


@router.post("/urlscan/submit")
def urlscan_submit(payload: UrlscanSubmit):
    url = lookup_url(payload.url)
    target = net_safety.inspect_target(url)
    if target["blocked_private"] or not target["lookup_ok"]:
        raise HTTPException(status_code=400, detail=f"This URL cannot be submitted: {target['reason'] or 'not a public web address.'}")
    res = intel_clients.urlscan_submit(url)
    if not res["ok"]:
        code = 503 if res["status"] == "not_configured" else 429 if res["status"] == "rate_limited" else 502
        raise HTTPException(status_code=code, detail=res["message"])
    return res


@router.get("/urlscan/result/{uuid}")
def urlscan_result(uuid: str):
    res = intel_clients.urlscan_result(uuid)
    if res["state"] == "error" and res.get("message") == "Invalid scan id.":
        raise HTTPException(status_code=400, detail=res["message"])
    return res
