"""
Scam Detection API Endpoints for Catch the Phish
Handles Message, Job, Investment, Email, and central Scam DNA analyses with SQLite persistence.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.database.models import ScamAnalysisRecord
from backend.app.security.auth import get_current_user_optional, get_current_user
from backend.app.schemas.scam import (
    MessageScanRequest, MessageScanResponse,
    JobScanRequest, JobScanResponse,
    InvestmentScanRequest, InvestmentScanResponse,
    EmailScanRequest, EmailScanResponse,
    ScamDNARequest, ScamDNAResponse,
    ScamHistoryResponse
)
from backend.app.services.message_scanner_service import MessageScannerService
from backend.app.services.job_scam_service import JobScamService
from backend.app.services.investment_scam_service import InvestmentScamService
from backend.app.services.email_scam_service import EmailScamService
from backend.app.services.scam_dna_service import ScamDNAService

router = APIRouter(prefix="/scam", tags=["Scam Detection Engines"])


def _can_access(rec, token_payload: Optional[dict]) -> bool:
    """Anonymous records are readable by anyone; owned records only by their owner or an admin."""
    if rec.user_id is None:
        return True
    if not token_payload:
        return False
    return token_payload.get("role") == "admin" or _extract_user_id(token_payload) == rec.user_id


def _can_modify(rec, token_payload: dict) -> bool:
    if token_payload.get("role") == "admin":
        return True
    uid = _extract_user_id(token_payload)
    return uid is not None and rec.user_id == uid


def _extract_user_id(token_payload: Optional[dict]) -> Optional[int]:
    if token_payload and "sub" in token_payload:
        try:
            return int(token_payload["sub"])
        except ValueError:
            return None
    return None


@router.post("/message", response_model=MessageScanResponse)
def scan_message(
    payload: MessageScanRequest,
    db: Session = Depends(get_db),
    user_payload: Optional[dict] = Depends(get_current_user_optional)
):
    result = MessageScannerService.analyze(payload.text)
    user_id = _extract_user_id(user_payload)

    # Persist in SQLite
    record = ScamAnalysisRecord(
        user_id=user_id,
        analysis_type="MESSAGE",
        content_snippet=payload.text[:250],
        risk_score=result["risk_score"],
        risk_tier=result["risk_tier"],
        scam_category=result["scam_category"],
        confidence_score=result["confidence_score"],
        detected_indicators=result["detected_indicators"],
        highlighted_phrases=result["highlighted_phrases"],
        scam_dna_breakdown=result["scam_dna"],
        recommended_actions=[result["recommended_action"]],
        metadata_info={"embedded_urls_count": len(result["embedded_urls"])},
        created_at=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    result["created_at"] = record.created_at
    return result


@router.post("/job", response_model=JobScanResponse)
def scan_job_offer(
    payload: JobScanRequest,
    db: Session = Depends(get_db),
    user_payload: Optional[dict] = Depends(get_current_user_optional)
):
    result = JobScamService.analyze(payload.text, payload.company_name or "", payload.claimed_salary or "")
    user_id = _extract_user_id(user_payload)

    record = ScamAnalysisRecord(
        user_id=user_id,
        analysis_type="JOB",
        content_snippet=payload.text[:250],
        risk_score=result["risk_score"],
        risk_tier=result["risk_tier"],
        scam_category=result["scam_category"],
        confidence_score=result["confidence_score"],
        detected_indicators=result["detected_indicators"],
        highlighted_phrases=result["highlighted_phrases"],
        scam_dna_breakdown=result["scam_dna"],
        recommended_actions=result["recommended_actions"],
        metadata_info={"company_name": payload.company_name, "claimed_salary": payload.claimed_salary},
        created_at=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    result["created_at"] = record.created_at
    return result


@router.post("/investment", response_model=InvestmentScanResponse)
def scan_investment_proposal(
    payload: InvestmentScanRequest,
    db: Session = Depends(get_db),
    user_payload: Optional[dict] = Depends(get_current_user_optional)
):
    result = InvestmentScamService.analyze(payload.text)
    user_id = _extract_user_id(user_payload)

    record = ScamAnalysisRecord(
        user_id=user_id,
        analysis_type="INVESTMENT",
        content_snippet=payload.text[:250],
        risk_score=result["risk_score"],
        risk_tier=result["risk_tier"],
        scam_category=result["scam_category"],
        confidence_score=result["confidence_score"],
        detected_indicators=result["detected_indicators"],
        highlighted_phrases=result["highlighted_phrases"],
        scam_dna_breakdown=result["scam_dna"],
        recommended_actions=result["recommended_actions"],
        metadata_info={},
        created_at=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    result["created_at"] = record.created_at
    return result


@router.post("/email", response_model=EmailScanResponse)
def scan_email(
    payload: EmailScanRequest,
    db: Session = Depends(get_db),
    user_payload: Optional[dict] = Depends(get_current_user_optional)
):
    # If raw_email is provided, parse it; otherwise synthesize from body/subject/sender
    raw_content = payload.raw_email or ""
    if not raw_content:
        headers_synthetic = []
        if payload.sender:
            headers_synthetic.append(f"From: {payload.sender}")
        if payload.subject:
            headers_synthetic.append(f"Subject: {payload.subject}")
        raw_content = "\n".join(headers_synthetic) + "\n\n" + (payload.body or "")

    result = EmailScamService.analyze_raw_email(raw_content)
    user_id = _extract_user_id(user_payload)

    snippet = (payload.subject or result["headers"].get("subject") or payload.body or raw_content)[:250]
    record = ScamAnalysisRecord(
        user_id=user_id,
        analysis_type="EMAIL",
        content_snippet=snippet,
        risk_score=result["risk_score"],
        risk_tier=result["risk_tier"],
        scam_category=result["email_verdict"],
        confidence_score=result["confidence_score"],
        detected_indicators=result["detected_indicators"],
        highlighted_phrases=result["highlighted_phrases"],
        scam_dna_breakdown=result["scam_dna"],
        recommended_actions=result["recommended_actions"],
        metadata_info={
            "headers": result["headers"],
            "auth_evidence": result["auth_evidence"],
            "attachments_count": len(result["attachments"])
        },
        created_at=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    result["created_at"] = record.created_at
    return result


@router.post("/dna", response_model=ScamDNAResponse)
def scan_dna_general(
    payload: ScamDNARequest,
    db: Session = Depends(get_db),
    user_payload: Optional[dict] = Depends(get_current_user_optional)
):
    result = ScamDNAService.analyze(payload.text)
    user_id = _extract_user_id(user_payload)

    record = ScamAnalysisRecord(
        user_id=user_id,
        analysis_type="DNA",
        content_snippet=payload.text[:250],
        risk_score=result["risk_score"],
        risk_tier=result["risk_tier"],
        scam_category=result["primary_scam_pattern"],
        confidence_score=result["confidence_score"],
        detected_indicators=result["detected_indicators"],
        highlighted_phrases=result["highlighted_phrases"],
        scam_dna_breakdown={"techniques": result["detected_techniques"]},
        recommended_actions=result["recommended_actions"],
        metadata_info={},
        created_at=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    result["created_at"] = record.created_at
    return result


@router.get("/history", response_model=ScamHistoryResponse)
def get_scam_history(
    search: str = Query("", description="Search snippet or category"),
    analysis_type: str = Query("ALL", description="Filter by type (ALL, MESSAGE, JOB, INVESTMENT, EMAIL, DNA)"),
    risk_tier: str = Query("ALL", description="Filter by tier (ALL, LOW, MODERATE, HIGH, CRITICAL, INCONCLUSIVE)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user_payload: Optional[dict] = Depends(get_current_user_optional)
):
    query = db.query(ScamAnalysisRecord)

    # Anonymous visitors only ever see anonymous records; signed-in users see their own
    # records plus anonymous ones. One user's history is never shown to another.
    user_id = _extract_user_id(user_payload)
    if user_id:
        query = query.filter((ScamAnalysisRecord.user_id == user_id) | (ScamAnalysisRecord.user_id == None))
    else:
        query = query.filter(ScamAnalysisRecord.user_id == None)

    if search.strip():
        s = f"%{search.strip()}%"
        query = query.filter(
            (ScamAnalysisRecord.content_snippet.ilike(s)) |
            (ScamAnalysisRecord.scam_category.ilike(s))
        )

    if analysis_type != "ALL":
        query = query.filter(ScamAnalysisRecord.analysis_type == analysis_type.upper())

    if risk_tier != "ALL":
        query = query.filter(ScamAnalysisRecord.risk_tier == risk_tier.upper())

    total = query.count()
    records = query.order_by(desc(ScamAnalysisRecord.created_at)).offset(offset).limit(limit).all()

    items = []
    for r in records:
        items.append({
            "id": r.id,
            "user_id": r.user_id,
            "analysis_type": r.analysis_type,
            "content_snippet": r.content_snippet,
            "risk_score": r.risk_score,
            "risk_tier": r.risk_tier,
            "scam_category": r.scam_category,
            "confidence_score": r.confidence_score,
            "detected_indicators": r.detected_indicators,
            "highlighted_phrases": r.highlighted_phrases,
            "scam_dna_breakdown": r.scam_dna_breakdown,
            "recommended_actions": r.recommended_actions,
            "metadata_info": r.metadata_info,
            "created_at": r.created_at
        })

    return ScamHistoryResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/history/{record_id}")
def get_scam_history_item(
    record_id: int,
    db: Session = Depends(get_db),
    user_payload: Optional[dict] = Depends(get_current_user_optional)
):
    rec = db.query(ScamAnalysisRecord).filter(ScamAnalysisRecord.id == record_id).first()
    if not rec or not _can_access(rec, user_payload):
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return {
        "id": rec.id,
        "user_id": rec.user_id,
        "analysis_type": rec.analysis_type,
        "content_snippet": rec.content_snippet,
        "risk_score": rec.risk_score,
        "risk_tier": rec.risk_tier,
        "scam_category": rec.scam_category,
        "confidence_score": rec.confidence_score,
        "detected_indicators": rec.detected_indicators,
        "highlighted_phrases": rec.highlighted_phrases,
        "scam_dna_breakdown": rec.scam_dna_breakdown,
        "recommended_actions": rec.recommended_actions,
        "metadata_info": rec.metadata_info,
        "created_at": rec.created_at
    }


@router.delete("/history/{record_id}")
def delete_scam_history_item(
    record_id: int,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user)
):
    rec = db.query(ScamAnalysisRecord).filter(ScamAnalysisRecord.id == record_id).first()
    if not rec or not _can_modify(rec, user_payload):
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    db.delete(rec)
    db.commit()
    return {"status": "success", "message": f"Analysis record {record_id} deleted."}


@router.delete("/history")
def clear_scam_history(
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user)
):
    # Admins clear everything; everyone else clears only their own records.
    query = db.query(ScamAnalysisRecord)
    if user_payload.get("role") != "admin":
        user_id = _extract_user_id(user_payload)
        if user_id is None:
            raise HTTPException(status_code=403, detail="Not allowed.")
        query = query.filter(ScamAnalysisRecord.user_id == user_id)
    deleted = query.delete(synchronize_session=False)
    db.commit()
    return {"status": "success", "message": f"{deleted} scam analysis records cleared."}
