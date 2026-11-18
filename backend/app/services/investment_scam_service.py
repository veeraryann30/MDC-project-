"""
Investment & Financial Scam Detector for Catch the Phish (Module 4)
Analyzes high-yield investment proposals, cryptocurrency schemes, automated trading bots,
guaranteed dividend promises, and Ponzi referral structures.
"""

import re
from typing import Dict, Any, List
from backend.app.services.nlp_engine import NLPEngine
from backend.app.services.scam_dna_service import ScamDNAService
from backend.app.services.scorer import ScorerService


class InvestmentScamService:

    @classmethod
    def analyze(cls, text: str) -> Dict[str, Any]:
        """
        Forensic risk assessment for investment, crypto, trading, and financial proposals.
        Distinguishes between general risk warnings and high-confidence fraudulent mechanisms.
        """
        raw_text = (text or "").strip()
        if len(raw_text) < 10:
            return {
                "risk_score": 0.0,
                "risk_tier": "INCONCLUSIVE",
                "risk_tier_label": "Inconclusive / Insufficient Text",
                "financial_verdict": "Inconclusive",
                "scam_category": "Insufficient Input",
                "detected_indicators": [],
                "highlighted_phrases": [],
                "scam_dna": {},
                "explanation": "Provide the complete financial proposal, trading message, or investment terms.",
                "recommended_action": "Submit the full proposal for investment legitimacy evaluation."
            }

        # 1. Base Scam DNA evaluation
        dna_result = ScamDNAService.analyze(raw_text)
        threats = list(dna_result["detected_indicators"])
        highlights = list(dna_result["highlighted_phrases"])

        specific_risk_penalty = 0.0
        fin_indicators = []
        lower = raw_text.lower()

        # 2. Check for "Guaranteed Returns" or "Zero Risk"
        has_guaranteed_profit = any(w in lower for w in [
            "guaranteed return", "guaranteed profit", "100% return", "200% return",
            "risk-free", "risk free", "zero risk", "capital protection guaranteed", "double in 24 hours"
        ])
        if has_guaranteed_profit:
            specific_risk_penalty += 40.0
            fin_indicators.append({
                "id": "guaranteed_profit_fallacy",
                "title": "Unrealistic Guaranteed Return Claim",
                "category": "Financial Deception",
                "severity": "CRITICAL",
                "what_was_detected": "The proposal claims guaranteed financial returns or zero market risk.",
                "why_it_matters": "All genuine financial markets (equities, crypto, commodities) fluctuate. No legitimate investment can promise fixed zero-risk profits."
            })

        # 3. Check for Ponzi / Multi-Level / Downline dynamics
        has_ponzi = any(w in lower for w in [
            "referral bonus", "refer friends", "downline", "binary bonus", "upline",
            "passive daily roi", "multi-tier commission", "invite 5 members"
        ])
        if has_ponzi:
            specific_risk_penalty += 35.0
            fin_indicators.append({
                "id": "ponzi_referral_structure",
                "title": "Ponzi / Multi-Level Referral Mechanics",
                "category": "Schematic Fraud",
                "severity": "HIGH",
                "what_was_detected": "Earnings rely heavily on recruiting subsequent depositors rather than commercial productivity.",
                "why_it_matters": "Classic Ponzi schemes use funds from newer investors to pay earlier participants until inevitable collapse."
            })

        # 4. Check for Withdrawal Fee / Unlock Tax demands
        has_withdrawal_tax = any(w in lower for w in [
            "withdrawal fee", "unlock fee", "gas fee required", "tax clearance deposit",
            "pay margin to withdraw", "unfreeze account"
        ])
        if has_withdrawal_tax:
            specific_risk_penalty += 45.0
            fin_indicators.append({
                "id": "advance_withdrawal_tax",
                "title": "Advance Withdrawal Fee / Tax Trap",
                "category": "Financial Extortion",
                "severity": "CRITICAL",
                "what_was_detected": "Requires transferring additional upfront money to unlock or withdraw existing account funds.",
                "why_it_matters": "Common pig-butchering and fake trading exchange trap where victims are drained repeatedly under false release promises."
            })

        # 5. Crypto / Wallet Seed Phrase harvesting
        has_crypto_seed = any(w in lower for w in [
            "seed phrase", "12 word recovery", "private key", "wallet passkey", "connect trustwallet"
        ])
        if has_crypto_seed:
            specific_risk_penalty += 50.0
            fin_indicators.append({
                "id": "crypto_seed_phrase_harvesting",
                "title": "Crypto Wallet Seed Phrase Solicitation",
                "category": "Asset Theft",
                "severity": "CRITICAL",
                "what_was_detected": "Solicits private keys or 12/24-word wallet recovery phrases.",
                "why_it_matters": "Sharing a seed phrase grants attackers irreversible, irrevocable access to drain all wallet balances."
            })

        # Combine and deduplicate
        all_threats = fin_indicators + threats
        dedup_threats = []
        seen_titles = set()
        for t in all_threats:
            if t["title"] not in seen_titles:
                seen_titles.add(t["title"])
                dedup_threats.append(t)

        # Composite score
        base_score = dna_result["risk_score"]
        final_score = min(100.0, max(0.0, round(base_score + specific_risk_penalty, 1)))
        tier_info = ScorerService.classify_score(final_score)

        if final_score <= 29.0:
            verdict = "Standard Financial / Market Commentary"
            category = "Standard Market Offer"
            explanation = "The content presents standard market terms, investment products, or general financial information without abnormal zero-risk claims or advance fee traps."
            actions = [
                "Verify provider licensing with regulatory bodies (such as SEBI, SEC, or FCA).",
                "Evaluate historical fund performance and standard prospectuses."
            ]
        elif final_score <= 59.0:
            verdict = "High-Risk / Speculative Financial Scheme"
            category = "Unregulated High-Yield Opportunity"
            explanation = "This proposal exhibits aggressive marketing, high profit assertions, or multi-level incentives. Exercise substantial skepticism."
            actions = [
                "Never invest money you cannot afford to lose completely.",
                "Confirm whether the platform is officially registered with financial conduct regulators."
            ]
        else:
            verdict = "Fraudulent Financial / Ponzi Scheme"
            category = "High-Yield Investment Deception / Pig Butchering Scam"
            explanation = "Severe financial scam signatures detected! Characteristics include mathematically impossible guaranteed returns, referral-based payouts, or advance withdrawal fees."
            actions = [
                "DO NOT deposit funds, buy vouchers, or send cryptocurrency.",
                "Never share your crypto wallet seed phrases or banking credentials.",
                "Disengage immediately and report the platform to financial cyber defense authorities."
            ]

        return {
            "risk_score": final_score,
            "risk_tier": tier_info["tier"],
            "risk_tier_label": tier_info["tier_label"],
            "financial_verdict": verdict,
            "scam_category": category,
            "confidence_score": dna_result["confidence_score"],
            "detected_indicators": dedup_threats,
            "highlighted_phrases": highlights,
            "scam_dna": dna_result,
            "explanation": explanation,
            "recommended_actions": actions
        }
