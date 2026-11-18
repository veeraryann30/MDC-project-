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
from backend.app.database.models import ScanRecord, PhishTraceRecord, User, ScamAnalysisRecord, AcademyProgress
from backend.app.api.api import api_router
from ml.features.extractor import extract_features
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.ml_service import MLService
from backend.app.services.scorer import ScorerService
from backend.app.security.auth import hash_password
from backend.app.security.rate_limit import RateLimitMiddleware
from backend.app.services.message_scanner_service import MessageScannerService
from backend.app.services.job_scam_service import JobScamService
from backend.app.services.investment_scam_service import InvestmentScamService
from backend.app.services.email_scam_service import EmailScamService

# Initialize SQLite database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Explainable Phishing URL Detection System combining Lexical Heuristics, Machine Learning, and Threat Intelligence.",
    version=settings.VERSION
)

# Rate limiting (added first so CORS, added next, wraps it and error responses keep CORS headers)
app.add_middleware(RateLimitMiddleware, per_minute=settings.RATE_LIMIT_PER_MINUTE)

# CORS configuration: explicit origins only (see CORS_ORIGINS in config)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.on_event("startup")
def seed_demo_data_if_empty():
    """Seeds initial demonstration scan records if database is empty."""
    if settings.IS_PRODUCTION:
        # Never seed demo records or the demo admin account in production.
        return
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

        trace_count = db.query(PhishTraceRecord).count()
        if trace_count == 0:
            print("[*] Seeding sample infrastructure traces for PHISH TRACE telemetry...")
            demo_traces = [
                {
                    "url": "http://paypa1-account-verification.xyz/login.php",
                    "domain": "paypa1-account-verification.xyz",
                    "ip": "104.21.65.112",
                    "country": "United States",
                    "city": "San Francisco",
                    "asn": "AS13335",
                    "isp": "Cloudflare, Inc.",
                    "hosting_provider": "Cloudflare Edge / Proxy",
                    "reputation": "Suspicious",
                    "abuse_confidence_score": 42.0,
                    "abuse_reports_count": 8,
                    "trace_data": {
                        "submitted_url": "http://paypa1-account-verification.xyz/login.php",
                        "hostname": "paypa1-account-verification.xyz",
                        "retrieved_at": "2026-11-13T12:00:00Z",
                        "dns": {
                            "status": "Resolved",
                            "resolved_ips": [{"ip": "104.21.65.112", "type": "IPv4", "is_public": True}],
                            "ns_records": ["ns1.cloudflare.com", "ns2.cloudflare.com"]
                        },
                        "ip_intelligence": {
                            "ip": "104.21.65.112",
                            "country": "United States",
                            "city": "San Francisco",
                            "latitude": 37.7749,
                            "longitude": -122.4194,
                            "isp": "Cloudflare, Inc.",
                            "org": "Cloudflare Edge / Proxy",
                            "asn": "AS13335",
                            "is_cdn_or_proxy": True,
                            "cdn_provider": "Cloudflare Edge / Proxy"
                        },
                        "ssl_certificate": {"has_ssl": False, "status": "No SSL Certificate on Port 443"},
                        "domain_registration": {"status": "Registered & Active", "registrar": "NameCheap, Inc.", "domain_age_days": 18, "domain_age_readable": "Very New (18 days old — High Risk Indicator)"},
                        "threat_intelligence": {"reputation": "Suspicious", "confidence_score": 42.0, "abuse_reports": 8, "summary": "Flagged in community abuse feeds for brand impersonation.", "sources": ["AbuseIPDB", "SOC Heuristics"]},
                        "overall_assessment": {"threat_level": "Suspicious Infrastructure", "attribution_disclaimer": "Server location indicates Cloudflare proxy datacenter, not actual attacker location."}
                    }
                },
                {
                    "url": "http://micros0ft-security-update.top/auth/verify-account",
                    "domain": "micros0ft-security-update.top",
                    "ip": "198.54.117.210",
                    "country": "United States",
                    "city": "Phoenix",
                    "asn": "AS22612",
                    "isp": "Namecheap Hosting",
                    "hosting_provider": "Namecheap Web Hosting",
                    "reputation": "Malicious",
                    "abuse_confidence_score": 78.0,
                    "abuse_reports_count": 23,
                    "trace_data": {
                        "submitted_url": "http://micros0ft-security-update.top/auth/verify-account",
                        "hostname": "micros0ft-security-update.top",
                        "retrieved_at": "2026-11-13T12:05:00Z",
                        "dns": {
                            "status": "Resolved",
                            "resolved_ips": [{"ip": "198.54.117.210", "type": "IPv4", "is_public": True}],
                            "ns_records": ["dns1.registrar-servers.com", "dns2.registrar-servers.com"]
                        },
                        "ip_intelligence": {
                            "ip": "198.54.117.210",
                            "country": "United States",
                            "city": "Phoenix",
                            "latitude": 33.4484,
                            "longitude": -112.0740,
                            "isp": "Namecheap Hosting",
                            "org": "Namecheap Web Hosting",
                            "asn": "AS22612",
                            "is_cdn_or_proxy": False
                        },
                        "ssl_certificate": {"has_ssl": True, "status": "Self-Signed or Untrusted CA", "issuer": "micros0ft-security-update.top"},
                        "domain_registration": {"status": "Registered & Active", "registrar": "NameCheap, Inc.", "domain_age_days": 12, "domain_age_readable": "Very New (12 days old — High Risk Indicator)"},
                        "threat_intelligence": {"reputation": "Malicious", "confidence_score": 78.0, "abuse_reports": 23, "summary": "Multiple verified phishing reports for Microsoft credential harvesting.", "sources": ["AbuseIPDB Live Feed", "VirusTotal"]},
                        "overall_assessment": {"threat_level": "Malicious Infrastructure", "attribution_disclaimer": "Hosting server is a leased VPS, not the attacker's physical device."}
                    }
                },
                {
                    "url": "https://www.google.com/search?q=cybersecurity+best+practices",
                    "domain": "google.com",
                    "ip": "142.250.190.46",
                    "country": "United States",
                    "city": "Mountain View",
                    "asn": "AS15169",
                    "isp": "Google LLC",
                    "hosting_provider": "Google Cloud Platform (GCP)",
                    "reputation": "Clean",
                    "abuse_confidence_score": 0.0,
                    "abuse_reports_count": 0,
                    "trace_data": {
                        "submitted_url": "https://www.google.com/search?q=cybersecurity+best+practices",
                        "hostname": "google.com",
                        "retrieved_at": "2026-11-13T12:10:00Z",
                        "dns": {
                            "status": "Resolved",
                            "resolved_ips": [{"ip": "142.250.190.46", "type": "IPv4", "is_public": True}],
                            "ns_records": ["ns1.google.com", "ns2.google.com"]
                        },
                        "ip_intelligence": {
                            "ip": "142.250.190.46",
                            "country": "United States",
                            "city": "Mountain View",
                            "latitude": 37.3861,
                            "longitude": -122.0839,
                            "isp": "Google LLC",
                            "org": "Google Cloud Platform (GCP)",
                            "asn": "AS15169",
                            "is_cdn_or_proxy": True,
                            "cdn_provider": "Google Cloud Platform (GCP)"
                        },
                        "ssl_certificate": {"has_ssl": True, "status": "Valid & Trusted", "issuer": "Google Trust Services LLC", "valid_to": "2027-04-14"},
                        "domain_registration": {"status": "Registered & Active", "registrar": "MarkMonitor, Inc.", "domain_age_days": 9500, "domain_age_readable": "26.0 years (Established Entity)"},
                        "threat_intelligence": {"reputation": "Clean", "confidence_score": 0.0, "abuse_reports": 0, "summary": "Official legitimate corporate infrastructure.", "sources": ["AbuseIPDB", "VirusTotal"]},
                        "overall_assessment": {"threat_level": "Clean / Low Risk", "attribution_disclaimer": "Confirmed official enterprise infrastructure."}
                    }
                }
            ]
            for t in demo_traces:
                tr_rec = PhishTraceRecord(
                    url=t["url"],
                    domain=t["domain"],
                    ip=t["ip"],
                    country=t["country"],
                    city=t["city"],
                    asn=t["asn"],
                    isp=t["isp"],
                    hosting_provider=t["hosting_provider"],
                    reputation=t["reputation"],
                    abuse_confidence_score=t["abuse_confidence_score"],
                    abuse_reports_count=t["abuse_reports_count"],
                    trace_data=t["trace_data"]
                )
                db.add(tr_rec)
            db.commit()
            print(f"[*] Seeded {len(demo_traces)} sample infrastructure traces successfully.")

        # Seed default demonstration security analyst user
        if db.query(User).count() == 0:
            demo_user = User(
                email="analyst@catchthephish.io",
                hashed_password=hash_password("CyberGuard2026!"),
                full_name="SOC Lead Analyst",
                role="admin",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            print("[*] Seeded default SOC Analyst account: analyst@catchthephish.io")

        # Seed multi-channel demonstration scam analyses
        if db.query(ScamAnalysisRecord).count() == 0:
            print("[*] Seeding sample multi-channel scam intelligence analyses...")
            demo_scams = [
                {
                    "type": "MESSAGE",
                    "content": "Dear SBI customer, your NetBanking account will be blocked today within 24 hours. Update your KYC immediately at http://sbi-kyc-verify.top to avoid permanent suspension. Never share your OTP.",
                    "analyzer": MessageScannerService.analyze
                },
                {
                    "type": "MESSAGE",
                    "content": "Congratulations! You have won ₹25,00,000 in KBC Lucky Draw 2026. Contact official WhatsApp manager to claim your prize. Registration fee of ₹2,500 required for tax clearance.",
                    "analyzer": MessageScannerService.analyze
                },
                {
                    "type": "JOB",
                    "content": "Immediate opening for WFH Data Entry Specialist at Amazon. Guaranteed salary ₹45,000/month. No technical interview required. Direct appointment letter. Submit ₹1,500 registration fee to HR at amazon.careers.hr@gmail.com.",
                    "analyzer": lambda txt: JobScamService.analyze(txt, "Amazon", "₹45,000/month")
                },
                {
                    "type": "INVESTMENT",
                    "content": "Join our VIP Crypto Trading Pool! Guaranteed 200% return in 48 hours. 100% risk-free automated bot. Refer 3 friends for binary downline bonuses. Pay 5% withdrawal fee to unlock your funds.",
                    "analyzer": InvestmentScamService.analyze
                },
                {
                    "type": "EMAIL",
                    "content": "From: PayPal Account Security <service@paypa1-account-portal.xyz>\nReply-To: refund-desk@attacker-inbox.com\nSubject: Critical Security Alert: Account Suspended\n\nDear client,\nUnusual login detected. Verify your password and card details immediately to unlock your wallet.\n\nAttached: invoice_security_patch.pdf.exe",
                    "analyzer": EmailScamService.analyze_raw_email
                }
            ]

            for s in demo_scams:
                res = s["analyzer"](s["content"])
                rec = ScamAnalysisRecord(
                    user_id=1,
                    analysis_type=s["type"],
                    content_snippet=s["content"][:250],
                    risk_score=res["risk_score"],
                    risk_tier=res["risk_tier"],
                    scam_category=res.get("scam_category") or res.get("email_verdict") or res.get("legitimacy_verdict") or "Scam Detection",
                    confidence_score=res.get("confidence_score", 90.0),
                    detected_indicators=res.get("detected_indicators", []),
                    highlighted_phrases=res.get("highlighted_phrases", []),
                    scam_dna_breakdown=res.get("scam_dna", {}),
                    recommended_actions=res.get("recommended_actions") or [res.get("recommended_action", "Exercise caution.")],
                    metadata_info={"demo_seeded": True}
                )
                db.add(rec)
            db.commit()
            print(f"[*] Seeded {len(demo_scams)} multi-channel intelligence records successfully.")
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
