"""
PHISH TRACE API Endpoints
Provides real-time attacker infrastructure reconnaissance, geolocation intelligence,
IP threat reputation, SSL certificate inspection, and historical telemetry queries.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, distinct

from backend.app.database.session import get_db
from backend.app.database.models import PhishTraceRecord
from backend.app.services.phish_trace_service import PhishTraceService
from backend.app.security.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter()


class TraceRequest(BaseModel):
    url: str = Field(..., description="Target URL or domain to trace infrastructure")


@router.post("/phish-trace/analyze")
def analyze_infrastructure(payload: TraceRequest, db: Session = Depends(get_db)):
    """
    Executes full infrastructure & geolocation intelligence reconnaissance for a target URL.
    Saves results to the audit history in the database.
    """
    raw_url = payload.url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="Target URL cannot be empty.")

    try:
        dossier = PhishTraceService.trace(raw_url, db)
        if not dossier.get("success"):
            raise HTTPException(status_code=400, detail=dossier.get("error", "Trace analysis failed."))

        ip_intel = dossier.get("ip_intelligence", {})
        threat_intel = dossier.get("threat_intelligence", {})

        # Extract numeric scores safely
        abuse_score = threat_intel.get("confidence_score")
        abuse_score_val = float(abuse_score) if isinstance(abuse_score, (int, float)) else 0.0

        abuse_reports = threat_intel.get("abuse_reports")
        abuse_reports_val = int(abuse_reports) if isinstance(abuse_reports, (int, float)) else 0

        # Persist record in database
        trace_record = PhishTraceRecord(
            url=dossier.get("submitted_url", raw_url),
            domain=dossier.get("hostname", raw_url),
            ip=ip_intel.get("ip"),
            country=ip_intel.get("country"),
            city=ip_intel.get("city"),
            asn=ip_intel.get("asn"),
            isp=ip_intel.get("isp"),
            hosting_provider=ip_intel.get("org"),
            reputation=threat_intel.get("reputation", "Unknown"),
            abuse_confidence_score=abuse_score_val,
            abuse_reports_count=abuse_reports_val,
            trace_data=dossier
        )
        db.add(trace_record)
        db.commit()
        db.refresh(trace_record)

        dossier["id"] = trace_record.id
        return dossier

    except HTTPException:
        raise
    except Exception:
        logger.exception("Infrastructure trace failed")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An error occurred while executing infrastructure trace."
        )


@router.get("/phish-trace/stats")
def get_phish_trace_stats(db: Session = Depends(get_db)):
    """
    Computes summary telemetry metrics for the PHISH TRACE Dashboard card.
    """
    total_traces = db.query(func.count(PhishTraceRecord.id)).scalar() or 0
    unique_ips = db.query(func.count(distinct(PhishTraceRecord.ip))).filter(
        PhishTraceRecord.ip != None,
        PhishTraceRecord.ip != "Unavailable"
    ).scalar() or 0

    suspicious_ips = db.query(func.count(PhishTraceRecord.id)).filter(
        PhishTraceRecord.reputation.in_(["Suspicious", "Malicious"])
    ).scalar() or 0

    countries_count = db.query(func.count(distinct(PhishTraceRecord.country))).filter(
        PhishTraceRecord.country != None,
        PhishTraceRecord.country != "Location unavailable"
    ).scalar() or 0

    # Top countries
    top_countries_rows = db.query(
        PhishTraceRecord.country,
        func.count(PhishTraceRecord.id).label("count")
    ).filter(
        PhishTraceRecord.country != None,
        PhishTraceRecord.country != "Location unavailable"
    ).group_by(PhishTraceRecord.country).order_by(desc("count")).limit(5).all()

    top_countries = [{"country": r[0], "count": r[1]} for r in top_countries_rows]

    # Recent traces
    recent_records = db.query(PhishTraceRecord).order_by(
        desc(PhishTraceRecord.created_at)
    ).limit(8).all()

    recent_traces = []
    for r in recent_records:
        recent_traces.append({
            "id": r.id,
            "url": r.url,
            "domain": r.domain,
            "ip": r.ip or "Unavailable",
            "country": r.country or "Unknown",
            "reputation": r.reputation or "Unknown",
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {
        "total_traces": total_traces,
        "unique_ips": unique_ips,
        "suspicious_ips": suspicious_ips,
        "countries_count": countries_count,
        "top_countries": top_countries,
        "recent_traces": recent_traces
    }


@router.get("/phish-trace/history")
def get_trace_history(
    search: Optional[str] = None,
    reputation: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Returns paginated historical infrastructure traces.
    """
    query = db.query(PhishTraceRecord)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (PhishTraceRecord.url.ilike(s)) |
            (PhishTraceRecord.domain.ilike(s)) |
            (PhishTraceRecord.ip.ilike(s)) |
            (PhishTraceRecord.country.ilike(s))
        )

    if reputation and reputation.upper() in ["CLEAN", "SUSPICIOUS", "MALICIOUS", "UNKNOWN"]:
        query = query.filter(PhishTraceRecord.reputation.ilike(reputation.strip()))

    total = query.count()
    records = query.order_by(desc(PhishTraceRecord.created_at)).offset(offset).limit(limit).all()

    items = []
    for r in records:
        items.append({
            "id": r.id,
            "url": r.url,
            "domain": r.domain,
            "ip": r.ip,
            "country": r.country,
            "city": r.city,
            "asn": r.asn,
            "isp": r.isp,
            "hosting_provider": r.hosting_provider,
            "reputation": r.reputation,
            "abuse_confidence_score": r.abuse_confidence_score,
            "abuse_reports_count": r.abuse_reports_count,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {
        "total": total,
        "items": items,
        "limit": limit,
        "offset": offset
    }


@router.get("/phish-trace/{record_id}")
def get_trace_detail(record_id: int, db: Session = Depends(get_db)):
    """
    Retrieves complete trace dossier for a previous analysis.
    """
    record = db.query(PhishTraceRecord).filter(PhishTraceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Trace record not found.")

    dossier = record.trace_data or {}
    dossier["id"] = record.id
    return dossier


@router.delete("/phish-trace/{record_id}")
def delete_trace_record(record_id: int, db: Session = Depends(get_db), _admin: dict = Depends(require_admin)):
    """
    Deletes an infrastructure trace record.
    """
    record = db.query(PhishTraceRecord).filter(PhishTraceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Trace record not found.")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Trace record {record_id} deleted."}
