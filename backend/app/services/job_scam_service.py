"""
Fake Job & Internship Scam Detector for Catch the Phish (Module 3)
Specialized analyzer for fraudulent recruitment advertisements, upfront training fees,
unrealistic salaries, guaranteed selection offers, and enterprise HR impersonation.
"""

import re
from typing import Dict, Any, List
from backend.app.services.nlp_engine import NLPEngine
from backend.app.services.scam_dna_service import ScamDNAService
from backend.app.services.scorer import ScorerService


class JobScamService:

    @classmethod
    def analyze(cls, text: str, company_name: str = "", claimed_salary: str = "") -> Dict[str, Any]:
        """
        Evaluates employment and internship advertisements for recruitment fraud indicators.
        Guarantees that unknown small companies are not penalized simply for being unfamiliar.
        """
        raw_text = (text or "").strip()
        if len(raw_text) < 10:
            return {
                "risk_score": 0.0,
                "risk_tier": "INCONCLUSIVE",
                "risk_tier_label": "Inconclusive / Insufficient Details",
                "legitimacy_verdict": "Inconclusive",
                "scam_category": "Insufficient Input",
                "detected_indicators": [],
                "highlighted_phrases": [],
                "scam_dna": {},
                "explanation": "Please provide the job description, offer email, or internship terms.",
                "recommended_action": "Paste the complete job post or offer letter text."
            }

        # 1. Base Scam DNA evaluation
        dna_result = ScamDNAService.analyze(raw_text)
        threats = list(dna_result["detected_indicators"])
        highlights = list(dna_result["highlighted_phrases"])

        specific_risk_penalty = 0.0
        job_indicators = []

        lower = raw_text.lower()

        # 2. Upfront fee check (Strict red flag in recruitment)
        has_fee = any(w in lower for w in [
            "registration fee", "processing fee", "security deposit", "training fee",
            "laptop deposit", "uniform charge", "documentation charge", "refundable amount"
        ])
        if has_fee:
            specific_risk_penalty += 40.0
            job_indicators.append({
                "id": "recruitment_upfront_fee",
                "title": "Mandatory Upfront Fee Demand",
                "category": "Recruitment Fraud",
                "severity": "CRITICAL",
                "what_was_detected": "The offer requires candidate to pay upfront money (registration, training, or deposit).",
                "why_it_matters": "Legitimate employers never require candidates to pay money for equipment, training, or job offers."
            })

        # 3. Guaranteed selection without interview
        has_no_interview = any(w in lower for w in [
            "direct offer", "no interview", "guaranteed selection", "instant appointment letter",
            "direct placement", "selected without interview"
        ])
        if has_no_interview:
            specific_risk_penalty += 30.0
            job_indicators.append({
                "id": "instant_selection_guarantee",
                "title": "Unrealistic Guaranteed Selection",
                "category": "Social Engineering",
                "severity": "HIGH",
                "what_was_detected": "Candidate is promised immediate selection without standard technical or competency evaluation.",
                "why_it_matters": "Fraudulent rings use instant gratification to bypass critical thinking and rush fee payments."
            })

        # 4. Off-platform contact channels (e.g. contact via WhatsApp/Telegram only)
        has_suspicious_channel = any(w in lower for w in [
            "contact on whatsapp", "send message on telegram", "join telegram group",
            "dm on telegram", "whatsapp hr", "telegram hr"
        ])
        if has_suspicious_channel:
            specific_risk_penalty += 20.0
            job_indicators.append({
                "id": "suspicious_recruitment_channel",
                "title": "Informal / Off-Platform Recruitment Channel",
                "category": "Communication Risk",
                "severity": "MEDIUM",
                "what_was_detected": "Recruitment communication is routed to private Telegram/WhatsApp rather than corporate portals.",
                "why_it_matters": "Scammers avoid official corporate email servers to prevent traceability and domain validation."
            })

        # 5. Free public email used for claimed corporate enterprise
        major_enterprises = ["google", "microsoft", "amazon", "infosys", "tcs", "wipro", "deloitte", "apple"]
        has_enterprise_impersonation = False
        for corp in major_enterprises:
            if corp in lower and any(domain in lower for domain in ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com"]):
                has_enterprise_impersonation = True
                specific_risk_penalty += 35.0
                job_indicators.append({
                    "id": "enterprise_free_email",
                    "title": f"Corporate Impersonation via Free Webmail ({corp.capitalize()})",
                    "category": "Identity Spoofing",
                    "severity": "CRITICAL",
                    "what_was_detected": f"The post references {corp.capitalize()} but utilizes a free public email address.",
                    "why_it_matters": "Enterprise recruitment teams never communicate hiring decisions through personal Gmail or Yahoo addresses."
                })
                break

        # Combine indicators
        all_threats = job_indicators + threats
        # Deduplicate indicators by title
        dedup_threats = []
        seen_titles = set()
        for t in all_threats:
            if t["title"] not in seen_titles:
                seen_titles.add(t["title"])
                dedup_threats.append(t)

        # Composite score
        base_score = dna_result["risk_score"]
        composite = base_score + specific_risk_penalty
        final_score = min(100.0, max(0.0, round(composite, 1)))
        tier_info = ScorerService.classify_score(final_score)

        # Category and legitimacy assessment
        if final_score <= 29.0:
            verdict = "Likely Legitimate Opportunity"
            category = "Standard Recruitment Posting"
            explanation = "The job posting outlines standard job responsibilities, skills, and evaluation criteria without advance fee demands or suspicious communication channels."
            actions = [
                "Proceed through standard application procedures.",
                "Verify the job listing on the company's official career portal (e.g., company.com/careers)."
            ]
        elif final_score <= 59.0:
            verdict = "Suspicious Recruitment Posting"
            category = "Potential Work-From-Home / Task-Based Scheme"
            explanation = "The listing contains irregularities (such as vague duties, rapid guarantees, or non-corporate communication channels). Exercise caution."
            actions = [
                "Never pay any training or onboarding fee.",
                "Search the employer's official LinkedIn and website to confirm the recruiter's identity."
            ]
        else:
            verdict = "High-Risk Recruitment Fraud"
            category = "Advance Fee Recruitment & Fake Internship Scam"
            explanation = "Severe red flags detected! This offer exhibits classic markers of recruitment exploitation, including advance fee demands and unauthorized brand usage."
            actions = [
                "DO NOT transfer any money or provide bank account details.",
                "Do not upload identity documents (Passport, PAN, Aadhaar) to unverified contacts.",
                "Report the posting to the recruitment platform or national cybercrime portal."
            ]

        return {
            "risk_score": final_score,
            "risk_tier": tier_info["tier"],
            "risk_tier_label": tier_info["tier_label"],
            "legitimacy_verdict": verdict,
            "scam_category": category,
            "confidence_score": dna_result["confidence_score"],
            "detected_indicators": dedup_threats,
            "highlighted_phrases": highlights,
            "scam_dna": dna_result,
            "explanation": explanation,
            "recommended_actions": actions
        }
