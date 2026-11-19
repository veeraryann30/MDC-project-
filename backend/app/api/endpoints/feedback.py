"""
Feedback endpoints: users tell us when a verdict was wrong ("Mark as safe") or when a link
really is phishing ("Report this link"). Stored as labelled data for later review; it does not
change any score automatically.
"""

import hashlib
import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.app.database.models import FeedbackRecord, ScanRecord
from backend.app.database.session import get_db
from backend.app.schemas.feedback import FeedbackRequest, FeedbackResponse
from backend.app.security.auth import SECRET_KEY, require_admin
from backend.app.security.rate_limit import _client_ip

logger = logging.getLogger(__name__)
router = APIRouter()


def _reporter_hash(request: Request) -> str:
    """Salted hash of the client IP: lets us keep one vote per person per scan without storing the IP."""
    return hashlib.sha256(f"{SECRET_KEY}|{_client_ip(request)}".encode("utf-8")).hexdigest()


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(payload: FeedbackRequest, request: Request, db: Session = Depends(get_db)):
    scan = db.query(ScanRecord).filter(ScanRecord.id == payload.scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="That scan could not be found.")

    reporter = _reporter_hash(request)
    existing = (
        db.query(FeedbackRecord)
        .filter(FeedbackRecord.scan_id == payload.scan_id, FeedbackRecord.reporter_hash == reporter)
        .first()
    )
    try:
        if existing:
            existing.user_label = payload.label
            existing.comment = payload.comment
            existing.updated_at = datetime.utcnow()
            record, updated = existing, True
        else:
            record = FeedbackRecord(
                scan_id=scan.id,
                url=scan.url,
                domain=scan.domain,
                verdict_at_scan=scan.classification,
                risk_score_at_scan=scan.risk_score,
                user_label=payload.label,
                comment=payload.comment,
                reporter_hash=reporter,
            )
            db.add(record)
            updated = False
        db.commit()
        db.refresh(record)
    except Exception:
        logger.exception("Saving feedback failed")
        db.rollback()
        raise HTTPException(status_code=500, detail="Your feedback could not be saved. Please try again.")

    return FeedbackResponse(
        id=record.id,
        scan_id=record.scan_id,
        label=record.user_label,
        updated=updated,
        message="Thanks - your feedback was recorded for review.",
    )


@router.get("/feedback")
def list_feedback(limit: int = 100, offset: int = 0, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    """Admin only: labelled feedback, newest first."""
    limit = max(1, min(limit, 500))
    rows: List[FeedbackRecord] = (
        db.query(FeedbackRecord).order_by(FeedbackRecord.created_at.desc()).offset(max(0, offset)).limit(limit).all()
    )
    return [
        {
            "id": r.id,
            "scan_id": r.scan_id,
            "url": r.url,
            "domain": r.domain,
            "verdict_at_scan": r.verdict_at_scan,
            "risk_score_at_scan": r.risk_score_at_scan,
            "user_label": r.user_label,
            "comment": r.comment,
            "created_at": r.created_at,
        }
        for r in rows
    ]
