from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class IndicatorItem(BaseModel):
    id: str
    title: str
    category: str
    severity: str
    what_was_detected: str
    why_it_matters: str


class HighlightedPhraseItem(BaseModel):
    text: str
    start: int
    end: int
    severity: str
    category: str
    technique: Optional[str] = None


class MessageScanRequest(BaseModel):
    text: str = Field(..., min_length=2, example="URGENT: Your SBI Account is suspended. Update KYC now at http://sbi-kyc.top")


class MessageScanResponse(BaseModel):
    id: Optional[int] = None
    risk_score: float
    risk_tier: str
    risk_tier_label: str
    scam_category: str
    scam_probability: float
    confidence_score: float
    detected_indicators: List[Dict[str, Any]]
    highlighted_phrases: List[Dict[str, Any]]
    scam_dna: Dict[str, Any]
    embedded_urls: List[Dict[str, Any]]
    explanation: str
    recommended_action: str
    created_at: Optional[datetime] = None


class JobScanRequest(BaseModel):
    text: str = Field(..., min_length=5, example="Direct selection for WFH Data Entry. Pay registration fee of Rs 1,500.")
    company_name: Optional[str] = None
    claimed_salary: Optional[str] = None


class JobScanResponse(BaseModel):
    id: Optional[int] = None
    risk_score: float
    risk_tier: str
    risk_tier_label: str
    legitimacy_verdict: str
    scam_category: str
    confidence_score: float
    detected_indicators: List[Dict[str, Any]]
    highlighted_phrases: List[Dict[str, Any]]
    scam_dna: Dict[str, Any]
    explanation: str
    recommended_actions: List[str]
    created_at: Optional[datetime] = None


class InvestmentScanRequest(BaseModel):
    text: str = Field(..., min_length=5, example="Guaranteed 200% return in 48 hours. Zero risk crypto trading.")


class InvestmentScanResponse(BaseModel):
    id: Optional[int] = None
    risk_score: float
    risk_tier: str
    risk_tier_label: str
    financial_verdict: str
    scam_category: str
    confidence_score: float
    detected_indicators: List[Dict[str, Any]]
    highlighted_phrases: List[Dict[str, Any]]
    scam_dna: Dict[str, Any]
    explanation: str
    recommended_actions: List[str]
    created_at: Optional[datetime] = None


class EmailScanRequest(BaseModel):
    raw_email: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    sender: Optional[str] = None


class EmailScanResponse(BaseModel):
    id: Optional[int] = None
    risk_score: float
    risk_tier: str
    risk_tier_label: str
    email_verdict: str
    confidence_score: float
    sender_origin: Optional[Dict[str, Any]] = None
    headers: Dict[str, Any]
    sender_analysis: Dict[str, Any]
    auth_evidence: Dict[str, Any]
    attachments: List[Dict[str, Any]]
    embedded_urls: List[Dict[str, Any]]
    detected_indicators: List[Dict[str, Any]]
    highlighted_phrases: List[Dict[str, Any]]
    scam_dna: Dict[str, Any]
    explanation: str
    recommended_actions: List[str]
    created_at: Optional[datetime] = None


class ScamDNARequest(BaseModel):
    text: str = Field(..., min_length=5, example="Congratulations! You have been selected for an internship. Pay Rs 1,500 for registration.")


class ScamDNAResponse(BaseModel):
    id: Optional[int] = None
    risk_score: float
    risk_tier: str
    risk_tier_label: str
    confidence_score: float
    primary_scam_pattern: str
    detected_techniques: List[Dict[str, Any]]
    highlighted_phrases: List[Dict[str, Any]]
    detected_indicators: List[Dict[str, Any]]
    recommended_actions: List[str]
    evidence_summary: str
    created_at: Optional[datetime] = None


class ScamHistoryItem(BaseModel):
    id: int
    user_id: Optional[int] = None
    analysis_type: str
    content_snippet: str
    risk_score: float
    risk_tier: str
    scam_category: str
    confidence_score: float
    created_at: datetime


class ScamHistoryResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    limit: int
    offset: int
