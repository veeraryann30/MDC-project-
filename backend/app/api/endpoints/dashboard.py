"""
Dashboard Analytics Endpoints for Catch the Phish
Calculates real-time statistics, threat indicator frequencies, multi-channel distributions,
and scan activity trends across both URL scans and Multi-Channel Scam analyses.
"""

from collections import Counter
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database.session import get_db
from backend.app.database.models import ScanRecord, ScamAnalysisRecord
from backend.app.schemas.history import DashboardStats

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. URL Scan metrics
    url_total = db.query(func.count(ScanRecord.id)).scalar() or 0
    url_safe = db.query(func.count(ScanRecord.id)).filter(ScanRecord.classification == "SAFE").scalar() or 0
    url_susp = db.query(func.count(ScanRecord.id)).filter(ScanRecord.classification == "SUSPICIOUS").scalar() or 0
    url_phish = db.query(func.count(ScanRecord.id)).filter(ScanRecord.classification == "PHISHING").scalar() or 0
    url_unverified = db.query(func.count(ScanRecord.id)).filter(ScanRecord.classification == "UNVERIFIED").scalar() or 0

    # 2. Multi-channel scam analysis metrics
    scam_total = db.query(func.count(ScamAnalysisRecord.id)).scalar() or 0
    msg_count = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.analysis_type == "MESSAGE").scalar() or 0
    job_count = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.analysis_type == "JOB").scalar() or 0
    inv_count = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.analysis_type == "INVESTMENT").scalar() or 0
    email_count = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.analysis_type == "EMAIL").scalar() or 0

    scam_low = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.risk_tier == "LOW").scalar() or 0
    scam_mod = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.risk_tier == "MODERATE").scalar() or 0
    scam_high = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.risk_tier == "HIGH").scalar() or 0
    scam_crit = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.risk_tier == "CRITICAL").scalar() or 0

    # Flagged scams count
    scams_identified = url_phish + scam_high + scam_crit

    # Grand totals
    total_analyses = url_total + scam_total
    safe_combined = url_safe + scam_low
    suspicious_combined = url_susp + scam_mod
    phishing_combined = url_phish + scam_high + scam_crit

    # Average score computation
    url_avg_score = db.query(func.avg(ScanRecord.risk_score)).scalar() or 0.0
    scam_avg_score = db.query(func.avg(ScamAnalysisRecord.risk_score)).scalar() or 0.0
    if total_analyses > 0:
        overall_avg = round(((float(url_avg_score) * url_total) + (float(scam_avg_score) * scam_total)) / total_analyses, 1)
    else:
        overall_avg = 0.0

    # Indicator aggregation across URL scans
    all_url_scans = db.query(ScanRecord.detected_threats).all()
    indicator_counts = Counter()
    for row in all_url_scans:
        threats = row[0]
        if isinstance(threats, list):
            for t in threats:
                title = t.get("title", "Unknown Threat").split("(")[0].strip()
                indicator_counts[title] += 1

    # Indicators from multi-channel scams
    all_scam_records = db.query(ScamAnalysisRecord.detected_indicators, ScamAnalysisRecord.scam_category).all()
    scam_category_counts = Counter()
    for ind_list, cat in all_scam_records:
        if cat:
            scam_category_counts[cat] += 1
        if isinstance(ind_list, list):
            for t in ind_list:
                title = t.get("title", "Unknown").split("(")[0].strip()
                indicator_counts[title] += 1

    top_indicators = []
    for title, count in indicator_counts.most_common(7):
        top_indicators.append({
            "name": title,
            "count": count,
            "percentage": round((count / max(total_analyses, 1)) * 100, 1)
        })

    top_categories = []
    for cat, count in scam_category_counts.most_common(6):
        top_categories.append({
            "category": cat,
            "count": count,
            "percentage": round((count / max(scam_total, 1)) * 100, 1)
        })

    # Channel breakdown for visual charts
    channel_breakdown = [
        {"channel": "URL & Domains", "count": url_total, "color": "#FF6B35"},
        {"channel": "Messages / SMS", "count": msg_count, "color": "#06B6D4"},
        {"channel": "Job & Internships", "count": job_count, "color": "#8B5CF6"},
        {"channel": "Investment / Crypto", "count": inv_count, "color": "#F59E0B"},
        {"channel": "Email Phishing", "count": email_count, "color": "#EF4444"}
    ]

    # Recent combined activity (latest 15 across both tables)
    recent_url_records = db.query(ScanRecord).order_by(ScanRecord.created_at.desc()).limit(10).all()
    recent_scam_records = db.query(ScamAnalysisRecord).order_by(ScamAnalysisRecord.created_at.desc()).limit(10).all()

    combined_recent = []
    for r in recent_url_records:
        combined_recent.append({
            "id": f"url-{r.id}",
            "type": "URL",
            "time": r.created_at.strftime("%H:%M:%S") if r.created_at else "",
            "domain": r.domain,
            "snippet": r.url[:45],
            "score": r.risk_score,
            "classification": r.classification,
            "created_at": r.created_at or datetime.utcnow()
        })
    for r in recent_scam_records:
        combined_recent.append({
            "id": f"scam-{r.id}",
            "type": r.analysis_type,
            "time": r.created_at.strftime("%H:%M:%S") if r.created_at else "",
            "domain": r.scam_category[:24],
            "snippet": r.content_snippet[:45],
            "score": r.risk_score,
            "classification": r.risk_tier,
            "created_at": r.created_at or datetime.utcnow()
        })

    # Sort combined recent by created_at descending
    combined_recent.sort(key=lambda x: x["created_at"], reverse=True)
    recent_activity = combined_recent[:15]

    return DashboardStats(
        total_scans=total_analyses,
        safe_count=safe_combined,
        suspicious_count=suspicious_combined,
        phishing_count=phishing_combined,
        unverified_count=url_unverified,
        avg_risk_score=overall_avg,
        top_threat_indicators=top_indicators,
        recent_activity=recent_activity,
        potential_scams_identified=scams_identified,
        urls_analyzed=url_total,
        messages_analyzed=msg_count,
        emails_analyzed=email_count,
        job_scams_detected=job_count,
        investment_scams_detected=inv_count,
        risk_distribution={
            "LOW": safe_combined,
            "MODERATE": suspicious_combined,
            "HIGH": url_phish + scam_high,
            "CRITICAL": scam_crit
        },
        top_scam_categories=top_categories,
        channel_breakdown=channel_breakdown
    )


_LEGACY_TO_VERDICT = {"SAFE": "SAFE", "SUSPICIOUS": "SUSPICIOUS", "PHISHING": "DANGEROUS", "UNVERIFIED": "UNVERIFIED"}


@router.get("/dashboard/security")
def get_security_overview(db: Session = Depends(get_db)):
    """Real counts from stored scans: URL vs QR volume, verdict distribution, 14-day trend, per-source detections."""
    rows = db.query(
        ScanRecord.verdict, ScanRecord.classification, ScanRecord.scan_type,
        ScanRecord.detection_method, ScanRecord.created_at,
    ).all()

    dist = Counter()
    url_n = qr_n = 0
    timeline = {}
    for verdict, classification, scan_type, method, created in rows:
        v = verdict or _LEGACY_TO_VERDICT.get(str(classification or "").upper(), "UNVERIFIED")
        dist[v] += 1
        is_qr = scan_type == "QR" or str(method or "").startswith("QR")
        if is_qr:
            qr_n += 1
        else:
            url_n += 1
        if created:
            day = created.strftime("%Y-%m-%d")
            slot = timeline.setdefault(day, {"date": day, "scans": 0, "dangerous": 0, "suspicious": 0})
            slot["scans"] += 1
            if v == "DANGEROUS":
                slot["dangerous"] += 1
            elif v == "SUSPICIOUS":
                slot["suspicious"] += 1

    # QR scans of non-URL payloads (text, Wi-Fi) leave no ScanRecord, so count QR scans from their own log.
    qr_total = db.query(func.count(ScamAnalysisRecord.id)).filter(ScamAnalysisRecord.analysis_type == "QR").scalar() or 0

    from datetime import timedelta
    today = datetime.utcnow().date()
    trend = []
    for i in range(13, -1, -1):
        d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        trend.append(timeline.get(d, {"date": d, "scans": 0, "dangerous": 0, "suspicious": 0}))

    recent_rows = db.query(ScanRecord).order_by(ScanRecord.created_at.desc()).limit(10).all()
    recent = [{
        "id": r.id,
        "type": "QR" if (r.scan_type == "QR" or str(r.detection_method or "").startswith("QR")) else "URL",
        "domain": r.domain,
        "score": r.risk_score,
        "verdict": r.verdict or _LEGACY_TO_VERDICT.get(str(r.classification or "").upper(), "UNVERIFIED"),
        "created_at": r.created_at,
    } for r in recent_rows]

    sources = {}
    for (rep,) in db.query(ScanRecord.engine_report).filter(ScanRecord.engine_report.isnot(None)).order_by(ScanRecord.created_at.desc()).limit(300).all():
        for name, s in ((rep or {}).get("sources") or {}).items():
            slot = sources.setdefault(name, {"source": name, "queried": 0, "flagged": 0})
            if s.get("status") in ("ok", "no_data"):
                slot["queried"] += 1
                if s.get("status") == "ok" and s.get("verdict") in ("malicious", "suspicious"):
                    slot["flagged"] += 1

    return {
        "totals": {
            "urls_scanned": url_n,
            "qr_scanned": max(qr_total, qr_n),
            "malicious": dist["DANGEROUS"],
            "suspicious": dist["SUSPICIOUS"],
            "safe": dist["SAFE"],
            "unverified": dist["UNVERIFIED"],
        },
        "verdict_distribution": {k: dist[k] for k in ("SAFE", "UNVERIFIED", "SUSPICIOUS", "DANGEROUS")},
        "timeline": trend,
        "recent": recent,
        "source_detections": list(sources.values()),
    }
