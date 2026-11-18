"""
Scan Endpoint for Catch the Phish
Performs safe static URL analysis, feature extraction, ML inference,
rule-based explainability generation, and audit logging.
"""

import base64
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import ScanRecord
from backend.app.schemas.scan import ScanRequest, ScanResponse, RiskBreakdown, ThreatIndicator
from backend.app.schemas.qr import QRScanResponse, QRJsonRequest
from ml.features.extractor import extract_features
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.ml_service import MLService
from backend.app.services.threat_intel import ThreatIntelService
from backend.app.services.scorer import ScorerService
from backend.app.services.link_origin_service import LinkOriginService
from backend.app.services.qr_scanner_service import QRScannerService

router = APIRouter()

@router.post("/scan", response_model=ScanResponse)
def scan_url(payload: ScanRequest, db: Session = Depends(get_db)):
    raw_url = payload.url.strip()

    try:
        # 1. Feature Extraction (strictly static parsing without network fetching)
        extracted = extract_features(raw_url)
        features = extracted["features"]
        details = extracted["details"]
        domain = details["domain"]

        # 2. Rule Engine & Explainability Generation
        threats_detected, safe_indicators, rule_score = RuleEngineService.evaluate(features, details)

        # 3. Machine Learning Probability Prediction
        ml_score, is_phish = MLService.predict(features)

        # 4. Optional Threat Intelligence Check
        intel = ThreatIntelService.check_url(raw_url, domain)
        threat_intel_score = intel.get("threat_score", 0.0)

        # 5. Hybrid Risk Scoring & Classification (Risk score remains purely lexical/ML/heuristic)
        risk_breakdown_dict = ScorerService.calculate_risk(
            ml_score=ml_score,
            rule_score=rule_score,
            threat_intel_score=threat_intel_score,
            threats_detected=threats_detected,
            domain=domain
        )

        final_score = risk_breakdown_dict["final_score"]
        classification = risk_breakdown_dict["classification"]

        # 6. Retrieve Link Origin Intelligence (Non-blocking: does not alter phishing risk score)
        origin_intelligence = None
        try:
            origin_intelligence = LinkOriginService.analyze(raw_url)
        except Exception as origin_err:
            print(f"[!] LinkOriginService non-blocking warning: {origin_err}")

        # 7. Persist scan in SQLite database for history & dashboard
        scan_record = ScanRecord(
            url=raw_url,
            domain=domain,
            risk_score=final_score,
            classification=classification,
            ml_score=ml_score,
            rule_score=rule_score,
            threat_intel_score=threat_intel_score,
            detected_threats=threats_detected,
            features=features,
            detection_method="ML + Rule Heuristics + Threat Intel",
            created_at=datetime.utcnow()
        )
        db.add(scan_record)
        db.commit()
        db.refresh(scan_record)

        # 8. Construct response
        response = ScanResponse(
            id=scan_record.id,
            url=raw_url,
            domain=domain,
            risk_score=final_score,
            classification=classification,
            breakdown=RiskBreakdown(**risk_breakdown_dict),
            threats_detected=[ThreatIndicator(**t) for t in threats_detected],
            safe_indicators=[ThreatIndicator(**s) for s in safe_indicators],
            features=features,
            details=details,
            origin_intelligence=origin_intelligence,
            detection_method="ML + Rule Heuristics + Threat Intel",
            created_at=scan_record.created_at
        )
        return response

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while analyzing the URL: {str(e)}"
        )


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

        filename = file.filename or "uploaded_qr_file"
        result = QRScannerService.analyze_qr_file(
            file_name=filename,
            file_bytes=contents,
            db=db
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process QR code file: {str(e)}"
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
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
        file_bytes = base64.b64decode(b64_data)
        result = QRScannerService.analyze_qr_file(
            file_name=payload.filename,
            file_bytes=file_bytes,
            db=db
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 payload: {str(e)}"
        )
