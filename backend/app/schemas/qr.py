"""
QR Code Scam Detector Pydantic Schemas
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class QRJsonRequest(BaseModel):
    filename: str = Field(..., description="Uploaded file name (image or pdf)")
    file_base64: str = Field(..., description="Base64 encoded file contents")


class QRThreatIndicator(BaseModel):
    id: str
    title: str
    severity: str  # SAFE, LOW, MODERATE, HIGH, CRITICAL
    what_was_detected: str
    why_it_matters: str


class QRScanResponse(BaseModel):
    success: bool
    status: str  # 'SUCCESS', 'NO_QR_DETECTED', 'INVALID_FILE', 'UNSAFE_PROTOCOL', 'ERROR'
    filename: str
    file_type: str
    file_size_kb: float
    qr_count: int
    extracted_contents: List[str]
    primary_content: str
    is_url: bool
    extracted_url: Optional[str] = None
    extracted_domain: Optional[str] = None
    risk_classification: str  # 'Safe', 'Suspicious', 'Malicious', 'Inconclusive'
    risk_score: float  # 0 to 100
    risk_tier: str  # 'SAFE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'INCONCLUSIVE'
    danger_explanation: str
    recommended_actions: List[str]
    threats_detected: List[Dict[str, Any]] = []
    safe_indicators: List[Dict[str, Any]] = []
    url_scan_id: Optional[int] = None
    url_breakdown: Optional[Dict[str, Any]] = None
    threat_intel: Optional[Dict[str, Any]] = None
    origin_intelligence: Optional[Dict[str, Any]] = None
    detection_method: str = "OpenCV QR Decoding + 34-Feature URL Lexical Inspection + ML Inference"
    created_at: datetime = Field(default_factory=datetime.utcnow)
