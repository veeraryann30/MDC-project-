from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, Boolean
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


class PhishTraceRecord(Base):
    __tablename__ = "phish_trace_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    url = Column(Text, nullable=False, index=True)
    domain = Column(String(255), nullable=False, index=True)
    ip = Column(String(100), nullable=True, index=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    asn = Column(String(100), nullable=True, index=True)
    isp = Column(String(255), nullable=True)
    hosting_provider = Column(String(255), nullable=True)
    reputation = Column(String(50), default="Unknown", index=True)
    abuse_confidence_score = Column(Float, default=0.0)
    abuse_reports_count = Column(Integer, default=0)
    trace_data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="analyst")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ScamAnalysisRecord(Base):
    __tablename__ = "scam_analysis_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    analysis_type = Column(String(50), nullable=False, index=True)  # URL, MESSAGE, JOB, INVESTMENT, EMAIL, DNA
    content_snippet = Column(Text, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_tier = Column(String(50), nullable=False, index=True)     # LOW, MODERATE, HIGH, CRITICAL, INCONCLUSIVE
    scam_category = Column(String(100), nullable=False, index=True)
    confidence_score = Column(Float, default=0.0)
    detected_indicators = Column(JSON, nullable=False, default=list)
    highlighted_phrases = Column(JSON, nullable=False, default=list)
    scam_dna_breakdown = Column(JSON, nullable=False, default=dict)
    recommended_actions = Column(JSON, nullable=False, default=list)
    metadata_info = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class AcademyProgress(Base):
    __tablename__ = "academy_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    module_id = Column(String(100), nullable=False, index=True)
    score = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow, index=True)
