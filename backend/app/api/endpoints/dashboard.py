"""
Dashboard Analytics Endpoints for Catch the Phish
Calculates real-time statistics, threat indicator frequencies, and scan activity trends.
"""

from collections import Counter
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database.session import get_db
from backend.app.database.models import ScanRecord
from backend.app.schemas.history import DashboardStats

router = APIRouter()

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_scans = db.query(func.count(ScanRecord.id)).scalar() or 0
    safe_count = db.query(func.count(ScanRecord.id)).filter(ScanRecord.classification == "SAFE").scalar() or 0
    suspicious_count = db.query(func.count(ScanRecord.id)).filter(ScanRecord.classification == "SUSPICIOUS").scalar() or 0
    phishing_count = db.query(func.count(ScanRecord.id)).filter(ScanRecord.classification == "PHISHING").scalar() or 0
    avg_score_raw = db.query(func.avg(ScanRecord.risk_score)).scalar() or 0.0
    avg_risk_score = round(float(avg_score_raw), 1)

    # Compute top threat indicators across all scans
    all_scans = db.query(ScanRecord.detected_threats).all()
    indicator_counts = Counter()

    for scan_row in all_scans:
        threats = scan_row[0]
        if isinstance(threats, list):
            for t in threats:
                title = t.get("title", "Unknown Threat")
                # Normalize title for counting
                base_title = title.split("(")[0].strip()
                indicator_counts[base_title] += 1

    top_indicators = []
    for title, count in indicator_counts.most_common(7):
        top_indicators.append({
            "name": title,
            "count": count,
            "percentage": round((count / max(total_scans, 1)) * 100, 1)
        })

    # Recent scans activity trend (last 10 scans or daily counts)
    recent_records = db.query(ScanRecord).order_by(ScanRecord.created_at.desc()).limit(15).all()
    recent_activity = []
    for r in reversed(recent_records):
        recent_activity.append({
            "id": r.id,
            "time": r.created_at.strftime("%H:%M:%S") if r.created_at else "",
            "domain": r.domain,
            "score": r.risk_score,
            "classification": r.classification
        })

    return DashboardStats(
        total_scans=total_scans,
        safe_count=safe_count,
        suspicious_count=suspicious_count,
        phishing_count=phishing_count,
        avg_risk_score=avg_risk_score,
        top_threat_indicators=top_indicators,
        recent_activity=recent_activity
    )
