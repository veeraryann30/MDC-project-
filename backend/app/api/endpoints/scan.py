"""
Scan Endpoint for Catch the Phish
Performs safe static URL analysis, feature extraction, ML inference,
rule-based explainability generation, and audit logging.
"""

import base64
import asyncio
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from backend.app.core.config import settings

from backend.app.database.session import get_db
from backend.app.database.models import ScanRecord
from backend.app.schemas.scan import (
    ScanRequest, ScanResponse, RiskBreakdown, ThreatIndicator,
    BulkScanRequest, BulkScanResponse, BulkScanItem,
)
from backend.app.schemas.qr import QRScanResponse, QRJsonRequest
from ml.features.extractor import extract_features
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.ml_service import MLService
from backend.app.services.threat_intel import ThreatIntelService
from backend.app.services.scorer import ScorerService
from backend.app.services.qr_scanner_service import QRScannerService
from backend.app.services.url_analysis_service import UrlAnalysisService
from backend.app.services.url_validation import check_url

logger = logging.getLogger(__name__)
router = APIRouter()

def _analyze_url(raw_url: str, db: Session, external: bool = True) -> ScanResponse:
    """
    Runs the unified detection pipeline for one URL and persists it. Raises on failure (caller rolls back).
    The URL is never fetched; reputation lookups, short-link expansion and the AI explanation are
    described in url_analysis_service.
    """
    r = UrlAnalysisService.analyze(raw_url, db, external=external, persist=True)
    return ScanResponse(
        id=r["id"],
        url=raw_url,
        domain=r["domain"],
        risk_score=r["risk_score"],
        classification=r["classification"],
        breakdown=RiskBreakdown(**r["breakdown"]),
        threats_detected=[ThreatIndicator(**t) for t in r["threats_detected"]],
        safe_indicators=[ThreatIndicator(**s) for s in r["safe_indicators"]],
        features=r["features"],
        details=r["details"],
        detection_method=r["detection_method"],
        created_at=r["created_at"],
        verdict=r["verdict"],
        scan_type=r["scan_type"],
        engine=r["engine"],
        intelligence=r["intelligence"],
        redirect=r["redirect"],
        ai_analysis=r["ai_analysis"],
    )

@router.post("/scan", response_model=ScanResponse)
def scan_url(payload: ScanRequest, db: Session = Depends(get_db)):
    try:
        return _analyze_url(payload.url.strip(), db)
    except Exception:
        logger.exception("URL scan failed")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An error occurred while analyzing the URL."
        )


@router.post("/scan/bulk", response_model=BulkScanResponse)
def scan_bulk(payload: BulkScanRequest, db: Session = Depends(get_db)):
    """Analyzes up to BULK_MAX_URLS links in one request. One bad link never fails the batch."""
    items = []
    for raw_url in payload.urls:
        valid, message = check_url(raw_url)
        if not valid:
            items.append(BulkScanItem(url=raw_url, ok=False, error=message))
            continue
        try:
            result = _analyze_url(raw_url, db, external=False)
            items.append(BulkScanItem(
                url=raw_url,
                ok=True,
                id=result.id,
                domain=result.domain,
                risk_score=result.risk_score,
                classification=result.classification,
                top_reasons=[t.title for t in result.threats_detected[:3]],
            ))
        except Exception:
            logger.exception("Bulk scan item failed")
            db.rollback()
            items.append(BulkScanItem(url=raw_url, ok=False, error="This link could not be analyzed."))
    succeeded = sum(1 for i in items if i.ok)
    return BulkScanResponse(total=len(items), succeeded=succeeded, failed=len(items) - succeeded, items=items)

@router.post("/scan/qr", response_model=QRScanResponse)
@router.post("/qr", response_model=QRScanResponse)
async def scan_qr_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Decodes QR code from an uploaded image (PNG, JPG, JPEG) or PDF document.
    Extracts embedded URL or payload, performs zero-execution lexical analysis,
    SSRF validation, ML inference, and generates an explainable security report.
    """
    try:
        if hasattr(file, "file") and hasattr(file.file, "read"):
            contents = file.file.read()
        elif hasattr(file, "read"):
            r = file.read()
            contents = await r if asyncio.iscoroutine(r) else r
        else:
            contents = bytes(file)

        if len(contents) > settings.MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File is too large.")

        filename = file.filename or "uploaded_qr_file"
        result = QRScannerService.analyze_qr_file(
            file_name=filename,
            file_bytes=contents,
            db=db
        )
        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("QR file processing failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to process the QR code file."
        )


@router.post("/scan/qr-json", response_model=QRScanResponse)
@router.post("/qr/json", response_model=QRScanResponse)
def scan_qr_json(
    payload: QRJsonRequest,
    db: Session = Depends(get_db)
):
    """
    Base64 payload support for QR Code detection.
    """
    try:
        b64_data = payload.file_base64
        if len(b64_data) > settings.MAX_UPLOAD_BYTES * 4 // 3 + 1024:
            raise HTTPException(status_code=413, detail="File is too large.")
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
        file_bytes = base64.b64decode(b64_data)
        result = QRScannerService.analyze_qr_file(
            file_name=payload.filename,
            file_bytes=file_bytes,
            db=db
        )
        return result
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid base64 payload."
        )


