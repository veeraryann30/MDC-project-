"""
FastAPI Main Application Entrypoint for Catch the Phish
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure root workspace is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.app.core.config import settings
from backend.app.database.session import engine, Base, SessionLocal
from backend.app.database.models import ScanRecord
from backend.app.api.api import api_router
from ml.features.extractor import extract_features
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.ml_service import MLService
from backend.app.services.scorer import ScorerService

# Initialize SQLite database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Explainable Phishing URL Detection System combining Lexical Heuristics, Machine Learning, and Threat Intelligence.",
    version=settings.VERSION
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.on_event("startup")
def seed_demo_data_if_empty():
    """Seeds initial demonstration scan records if database is empty."""
    db = SessionLocal()
    try:
        count = db.query(ScanRecord).count()
        if count == 0:
            print("[*] Seeding sample security scans for dashboard demonstrations...")
            demo_urls = [
                "https://www.google.com/search?q=cybersecurity+best+practices",
                "https://github.com/torvalds/linux",
                "http://paypa1-account-verification.xyz/login.php",
                "http://192.168.1.100:8080/secure/bank-login.asp",
                "http://micros0ft-security-update.top/auth/verify-account",
                "https://en.wikipedia.org/wiki/Phishing",
                "http://secure.login.apple.com.attacker-cloud.click/id",
                "http://xn--gogle-pra.com/signin/v2/identifier"
            ]
            for url in demo_urls:
                extracted = extract_features(url)
                features = extracted["features"]
                details = extracted["details"]
                threats, safe_signals, rule_score = RuleEngineService.evaluate(features, details)
                ml_score, is_phish = MLService.predict(features)
                risk_breakdown = ScorerService.calculate_risk(
                    ml_score=ml_score,
                    rule_score=rule_score,
                    threat_intel_score=0.0,
                    threats_detected=threats,
                    domain=details["domain"]
                )
                rec = ScanRecord(
                    url=url,
                    domain=details["domain"],
                    risk_score=risk_breakdown["final_score"],
                    classification=risk_breakdown["classification"],
                    ml_score=ml_score,
                    rule_score=rule_score,
                    threat_intel_score=0.0,
                    detected_threats=threats,
                    features=features,
                    detection_method="ML + Rule Heuristics + Threat Intel"
                )
                db.add(rec)
            db.commit()
            print(f"[*] Seeded {len(demo_urls)} sample scans successfully.")
    except Exception as e:
        print(f"[!] Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "ml_model_loaded": MLService.get_model() is not None,
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
