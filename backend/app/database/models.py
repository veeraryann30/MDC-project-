from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text
from backend.app.database.session import Base

class ScanRecord(Base):
    __tablename__ = "scan_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    url = Column(Text, nullable=False, index=True)
    domain = Column(String(255), nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    classification = Column(String(50), nullable=False, index=True) # SAFE, SUSPICIOUS, PHISHING
    ml_score = Column(Float, nullable=False, default=0.0)
    rule_score = Column(Float, nullable=False, default=0.0)
    threat_intel_score = Column(Float, nullable=False, default=0.0)
    detected_threats = Column(JSON, nullable=False, default=list)
    features = Column(JSON, nullable=False, default=dict)
    detection_method = Column(String(100), default="ML + Rule Heuristics + Threat Intel")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
