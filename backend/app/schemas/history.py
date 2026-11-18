from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class HistoryItem(BaseModel):
    id: int
    url: str
    domain: str
    risk_score: float
    classification: str
    ml_score: float
    rule_score: float
    threat_intel_score: float
    detected_threats_count: int
    detected_threats: List[Dict[str, Any]]
    detection_method: str
    created_at: datetime


class HistoryResponse(BaseModel):
    total: int
    items: List[HistoryItem]


class DashboardStats(BaseModel):
    total_scans: int
    safe_count: int
    suspicious_count: int
    phishing_count: int
    avg_risk_score: float
    top_threat_indicators: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

    # Multi-channel platform extensions
    potential_scams_identified: int = 0
    urls_analyzed: int = 0
    messages_analyzed: int = 0
    emails_analyzed: int = 0
    job_scams_detected: int = 0
    investment_scams_detected: int = 0
    risk_distribution: Dict[str, int] = {}
    top_scam_categories: List[Dict[str, Any]] = []
    channel_breakdown: List[Dict[str, Any]] = []
