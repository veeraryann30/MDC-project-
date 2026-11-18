"""
SCAM DNA Intelligence Engine for Catch the Phish
Deconstructs malicious communications into distinct psychological, financial,
and technical scam genes with evidence-backed explanations.
"""

from typing import Dict, Any, List
from backend.app.services.nlp_engine import NLPEngine
from backend.app.services.scorer import ScorerService

# Gene Definitions with baseline risk weights
DNA_TECHNIQUES = {
    "UPFRONT_PAYMENT_DEMAND": {
        "name": "Upfront Payment Demand",
        "description": "Demands advance payment, registration fee, or security deposit before delivering services or rewards.",
        "risk_weight": 35.0,
        "default_action": "Never pay an advance fee or deposit for employment, internships, or claimed prize winnings."
    },
    "ARTIFICIAL_URGENCY": {
        "name": "Artificial Urgency & Coercion",
        "description": "Applies artificial time deadlines or fear-inducing threats to prevent rational verification.",
        "risk_weight": 25.0,
        "default_action": "Pause and independently contact the organization using an established official telephone line."
    },
    "UNREALISTIC_PROMISE": {
        "name": "Unrealistic Financial / Opportunity Promise",
        "description": "Offers guaranteed profits, excessive stipends for zero qualifications, or unsolicited lottery windfalls.",
        "risk_weight": 30.0,
        "default_action": "Recognize that genuine investments carry risk and legitimate companies do not promise easy money."
    },
    "AUTHORITY_IMPERSONATION": {
        "name": "Authority / Corporate Impersonation",
        "description": "Masquerades as official entities such as banks, law enforcement, tax offices, or known enterprise recruiters.",
        "risk_weight": 25.0,
        "default_action": "Verify the sender domain or credentials directly on the organization's verified official portal."
    },
    "CREDENTIAL_HARVESTING": {
        "name": "Credential & OTP Harvesting",
        "description": "Attempts to solicit passwords, PINs, OTP codes, or full identity documents.",
        "risk_weight": 40.0,
        "default_action": "Never disclose OTPs, PIN numbers, or passwords. Legitimate institutions will never ask for them."
    },
    "SUSPICIOUS_COMMUNICATION_CHANNEL": {
        "name": "Suspicious Off-Platform Redirection",
        "description": "Reroutes business or recruitment dialogue onto personal WhatsApp, Telegram, or free webmail addresses.",
        "risk_weight": 20.0,
        "default_action": "Insist on conducting communication strictly through verified enterprise domain email addresses."
    },
    "PONZI_REFERRAL_STRUCTURE": {
        "name": "Ponzi / Multi-Level Referral Mechanics",
        "description": "Requires bringing new recruits or downlines to unlock claimed daily returns or dividends.",
        "risk_weight": 30.0,
        "default_action": "Do not join schemes that pay out of new investor deposits rather than genuine commercial activity."
    },
    "SPOOFED_IDENTITY_MISMATCH": {
        "name": "Sender Identity / Header Mismatch",
        "description": "Display name conflicts with actual transmitting domain, or failed cryptographic SPF/DKIM validation.",
        "risk_weight": 35.0,
        "default_action": "Treat mismatched email origins as malicious phishing attempts. Do not click links or download attachments."
    }
}


class ScamDNAService:
    @classmethod
    def analyze(cls, text: str, context_metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Extracts evidence-backed Scam DNA from submitted text and optional metadata.
        Guarantees that no technique is marked detected unless concrete evidence exists in the input.
        """
        if not text or len(text.strip()) < 5:
            return {
                "risk_score": 0.0,
                "risk_tier": "INCONCLUSIVE",
                "risk_tier_label": "Inconclusive / Insufficient Content",
                "confidence_score": 0.0,
                "primary_scam_pattern": "Insufficient Input",
                "detected_techniques": [],
                "highlighted_phrases": [],
                "recommended_actions": ["Submit the full message, email, or offer text for a comprehensive forensic analysis."],
                "evidence_summary": "The submitted content is too brief to extract conclusive scam techniques."
            }

        threats, highlights = NLPEngine.extract_highlighted_phrases(text)
        meta = context_metadata or {}

        # Collect techniques triggered by text matches
        detected_techniques_map = {}
        for h in highlights:
            tech_id = h.get("technique")
            if tech_id and tech_id in DNA_TECHNIQUES:
                if tech_id not in detected_techniques_map:
                    detected_techniques_map[tech_id] = {
                        "technique_id": tech_id,
                        "name": DNA_TECHNIQUES[tech_id]["name"],
                        "description": DNA_TECHNIQUES[tech_id]["description"],
                        "risk_weight": DNA_TECHNIQUES[tech_id]["risk_weight"],
                        "evidence_phrases": [h["text"]],
                        "recommended_action": DNA_TECHNIQUES[tech_id]["default_action"]
                    }
                else:
                    if h["text"] not in detected_techniques_map[tech_id]["evidence_phrases"]:
                        detected_techniques_map[tech_id]["evidence_phrases"].append(h["text"])

        # Check metadata for email header mismatch or SPF failures
        if meta.get("auth_mismatch"):
            tech_id = "SPOOFED_IDENTITY_MISMATCH"
            detected_techniques_map[tech_id] = {
                "technique_id": tech_id,
                "name": DNA_TECHNIQUES[tech_id]["name"],
                "description": DNA_TECHNIQUES[tech_id]["description"],
                "risk_weight": DNA_TECHNIQUES[tech_id]["risk_weight"],
                "evidence_phrases": [meta.get("auth_mismatch_detail", "Sender address differs from authentication return path.")],
                "recommended_action": DNA_TECHNIQUES[tech_id]["default_action"]
            }

        # Calculate composite score from detected techniques
        total_risk = 0.0
        for tech in detected_techniques_map.values():
            total_risk += tech["risk_weight"]

        # Scale based on urgency and financial greed indicators
        urgency_boost = NLPEngine.calculate_urgency_metric(text) * 0.15
        financial_boost = NLPEngine.calculate_financial_greed_metric(text) * 0.15
        final_score = min(100.0, round(total_risk + urgency_boost + financial_boost, 1))

        # Model confidence
        num_signals = len(detected_techniques_map)
        if num_signals == 0:
            confidence = 85.0  # high confidence that it's clean if no indicators
            primary_pattern = "Clean / Legitimate Pattern"
        elif num_signals >= 3:
            confidence = 96.0
            primary_pattern = list(detected_techniques_map.values())[0]["name"]
        else:
            confidence = 88.0
            primary_pattern = list(detected_techniques_map.values())[0]["name"]

        tier_info = ScorerService.classify_score(final_score)

        # Build list of active techniques
        technique_list = list(detected_techniques_map.values())

        # Synthesize recommendations
        actions = []
        for t in technique_list:
            if t["recommended_action"] not in actions:
                actions.append(t["recommended_action"])

        if not actions:
            actions.append("No overt deceptive techniques detected. Continue to follow standard digital hygiene.")

        evidence_str = (
            f"Identified {len(technique_list)} distinct scam mechanism(s): "
            + ", ".join(t["name"] for t in technique_list)
            if technique_list else "Zero high-risk deceptive techniques observed in the submitted text."
        )

        return {
            "risk_score": final_score,
            "risk_tier": tier_info["tier"],
            "risk_tier_label": tier_info["tier_label"],
            "confidence_score": confidence,
            "primary_scam_pattern": primary_pattern,
            "detected_techniques": technique_list,
            "highlighted_phrases": highlights,
            "detected_indicators": threats,
            "recommended_actions": actions,
            "evidence_summary": evidence_str
        }
