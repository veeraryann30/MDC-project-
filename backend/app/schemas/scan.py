from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
import re

class ScanRequest(BaseModel):
    url: str = Field(..., description="The target URL to analyze statically")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("URL cannot be empty.")
        if len(cleaned) > 2048:
            raise ValueError("URL exceeds maximum safe length of 2048 characters.")
        # Basic character safety check
        if any(c in cleaned for c in ["\r", "\n", "\t"]):
            raise ValueError("URL contains illegal control characters.")
        return cleaned


class ThreatIndicator(BaseModel):
    id: str
    title: str
    severity: str  # HIGH, MEDIUM, LOW, INFORMATIONAL
    category: str  # Identity, Network, Structure, Content, Transport
    what_was_detected: str
    why_it_matters: str
    how_attackers_use_it: str
    what_to_do: str


class RiskBreakdown(BaseModel):
    final_score: float
    ml_score: float
    rule_score: float
    threat_intel_score: float
    classification: str  # SAFE, SUSPICIOUS, PHISHING
    classification_label: str
    summary_explanation: str


class ScanResponse(BaseModel):
    id: Optional[int] = None
    url: str
    domain: str
    risk_score: float
    classification: str
    breakdown: RiskBreakdown
    threats_detected: List[ThreatIndicator]
    safe_indicators: List[ThreatIndicator]
    features: Dict[str, Any]
    details: Dict[str, Any]
    origin_intelligence: Optional[Dict[str, Any]] = None
    detection_method: str
    created_at: datetime
