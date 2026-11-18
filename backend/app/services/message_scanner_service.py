"""
AI Message Scam Detector for Catch the Phish (Module 2)
Analyzes SMS, WhatsApp, and chat messages for financial manipulation, KYC fraud,
OTP harvesting, artificial urgency, and embedded malicious links.
"""

from typing import Dict, Any, List
from backend.app.services.nlp_engine import NLPEngine
from backend.app.services.scam_dna_service import ScamDNAService
from backend.app.services.scorer import ScorerService
from ml.features.extractor import extract_features
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.ml_service import MLService


class MessageScannerService:

    @classmethod
    def analyze(cls, text: str) -> Dict[str, Any]:
        """
        Full forensic analysis of an SMS or messaging communication.
        """
        raw_text = (text or "").strip()
        if len(raw_text) < 5:
            return {
                "risk_score": 0.0,
                "risk_tier": "INCONCLUSIVE",
                "risk_tier_label": "Inconclusive / Insufficient Text",
                "scam_category": "Insufficient Input",
                "scam_probability": 0.0,
                "confidence_score": 0.0,
                "detected_indicators": [],
                "highlighted_phrases": [],
                "scam_dna": {},
                "embedded_urls": [],
                "explanation": "The submitted message text is too brief to evaluate scam signatures.",
                "recommended_action": "Paste the complete message including any numbers or links."
            }

        # 1. Run Scam DNA engine
        dna_result = ScamDNAService.analyze(raw_text)

        # 2. Extract and statically inspect embedded URLs
        embedded_urls = NLPEngine.extract_urls(raw_text)
        url_threat_boost = 0.0
        inspected_urls = []

        for u in embedded_urls[:3]:  # inspect up to 3 links statically
            try:
                extracted = extract_features(u)
                u_features = extracted["features"]
                u_details = extracted["details"]
                threats, _, u_rule_score = RuleEngineService.evaluate(u_features, u_details)
                u_ml_score, _ = MLService.predict(u_features)
                u_risk = max(u_rule_score, u_ml_score)
                inspected_urls.append({
                    "url": u,
                    "domain": u_details["domain"],
                    "risk_score": u_risk,
                    "is_suspicious": u_risk >= 50.0
                })
                if u_risk >= 60.0:
                    url_threat_boost = max(url_threat_boost, 25.0)
            except Exception:
                inspected_urls.append({"url": u, "domain": "Unknown", "risk_score": 0.0, "is_suspicious": False})

        # 3. Classify primary scam category
        lower = raw_text.lower()
        if any(w in lower for w in ["otp", "one time password", "pin", "cvv"]):
            category = "OTP & Credential Interception Scam"
        elif any(w in lower for w in ["kyc", "pan card", "aadhaar", "block", "suspended", "deactivated"]):
            category = "Banking & KYC Update Impersonation"
        elif any(w in lower for w in ["lottery", "kbc", "winner", "won", "prize", "gift card"]):
            category = "Advance Fee Lottery / Prize Scam"
        elif any(w in lower for w in ["upi", "paytm", "gpay", "phonepe", "refund", "cashback"]):
            category = "UPI Payment & Refund Deception"
        elif any(w in lower for w in ["job", "internship", "hiring", "work from home", "hr executive"]):
            category = "Recruitment & Placement Fraud"
        elif any(w in lower for w in ["crypto", "bitcoin", "investment", "double", "daily profit"]):
            category = "High-Yield Investment Deception"
        elif dna_result["detected_techniques"]:
            category = dna_result["primary_scam_pattern"]
        else:
            category = "Legitimate / Standard Communication"

        # 4. Synthesize final risk score
        base_score = dna_result["risk_score"]
        final_score = min(100.0, round(base_score + url_threat_boost, 1))
        tier_info = ScorerService.classify_score(final_score)

        # 5. Formulate human-understandable explanation & action
        if final_score <= 29.0:
            explanation = "This message demonstrates standard conversational patterns without coercion, suspicious payment demands, or credential requests."
            action = "No immediate threat detected. Standard vigilance advised."
        elif final_score <= 59.0:
            explanation = f"Moderate risk indicators detected: exhibits characteristics of {category.lower()}. Exercise caution before responding or opening links."
            action = "Do not share personal details. Verify the message via official customer care channels."
        else:
            explanation = f"High-confidence deceptive communication identified as {category}! Contains high-risk patterns such as urgency pressure and credential/payment solicitation."
            action = "Do NOT click links, do NOT send money, and NEVER share OTPs. Block and report the sender immediately."

        return {
            "risk_score": final_score,
            "risk_tier": tier_info["tier"],
            "risk_tier_label": tier_info["tier_label"],
            "scam_category": category,
            "scam_probability": round(min(1.0, final_score / 100.0), 3),
            "confidence_score": dna_result["confidence_score"],
            "detected_indicators": dna_result["detected_indicators"],
            "highlighted_phrases": dna_result["highlighted_phrases"],
            "scam_dna": dna_result,
            "embedded_urls": inspected_urls,
            "explanation": explanation,
            "recommended_action": action
        }
