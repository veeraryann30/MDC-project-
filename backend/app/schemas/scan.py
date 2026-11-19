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


BULK_MAX_URLS = 25


class BulkScanRequest(BaseModel):
    urls: List[str] = Field(..., description=f"Up to {BULK_MAX_URLS} URLs to analyze statically")

    @field_validator("urls")
    @classmethod
    def validate_urls(cls, v: List[str]) -> List[str]:
        cleaned: List[str] = []
        seen = set()
        for raw in v:
            item = (raw or "").strip()
            if not item or item in seen:
                continue
            if len(item) > 2048:
                raise ValueError("A URL exceeds the maximum safe length of 2048 characters.")
            if any(c in item for c in ["\r", "\n", "\t"]):
                raise ValueError("A URL contains illegal control characters.")
            seen.add(item)
            cleaned.append(item)
        if not cleaned:
            raise ValueError("Provide at least one URL.")
        if len(cleaned) > BULK_MAX_URLS:
            raise ValueError(f"Up to {BULK_MAX_URLS} links can be checked at once.")
        return cleaned


class BulkScanItem(BaseModel):
    url: str
    ok: bool
    id: Optional[int] = None
    domain: Optional[str] = None
    risk_score: Optional[float] = None
    classification: Optional[str] = None
    top_reasons: List[str] = []
    error: Optional[str] = None


class BulkScanResponse(BaseModel):
    total: int
    succeeded: int
    failed: int
    items: List[BulkScanItem]


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
