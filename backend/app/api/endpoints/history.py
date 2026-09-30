"""
Scan History Endpoints for Catch the Phish
Allows searching, filtering by classification, viewing scan details,
and deleting single records or clearing all history.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.database.models import ScanRecord
from backend.app.schemas.history import HistoryResponse, HistoryItem

router = APIRouter()

@router.get("/history", response_model=HistoryResponse)
def get_history(
    search: Optional[str] = None,
    classification: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(ScanRecord)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((ScanRecord.url.ilike(s)) | (ScanRecord.domain.ilike(s)))

    if classification and classification.upper() in ["SAFE", "SUSPICIOUS", "PHISHING"]:
        query = query.filter(ScanRecord.classification == classification.upper())

    total = query.count()
    records = query.order_by(desc(ScanRecord.created_at)).offset(offset).limit(limit).all()

    items = []
    for r in records:
        threats_list = r.detected_threats if isinstance(r.detected_threats, list) else []
        items.append(
            HistoryItem(
                id=r.id,
                url=r.url,
                domain=r.domain,
                risk_score=r.risk_score,
                classification=r.classification,
                ml_score=r.ml_score,
                rule_score=r.rule_score,
                threat_intel_score=r.threat_intel_score,
                detected_threats_count=len(threats_list),
                detected_threats=threats_list,
                detection_method=r.detection_method or "ML + Rule Heuristics",
                created_at=r.created_at
            )
        )

    return HistoryResponse(total=total, items=items)


@router.get("/history/{record_id}")
def get_history_detail(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ScanRecord).filter(ScanRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return record


@router.delete("/history/{record_id}")
def delete_history_item(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ScanRecord).filter(ScanRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan record not found")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Scan record {record_id} deleted"}


@router.delete("/history")
def clear_all_history(db: Session = Depends(get_db)):
    deleted_count = db.query(ScanRecord).delete()
    db.commit()
    return {"status": "success", "message": f"Cleared {deleted_count} scan records"}
