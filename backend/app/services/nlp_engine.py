"""
Central NLP & Text Analysis Engine for Catch the Phish
Extracts lexical markers, psychological manipulation indicators, financial extraction signals,
urgency cues, and exact substring offsets for UI visual phrase highlighting.
"""

import re
import math
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer

# Canonical Scam Pattern Catalog
SCAM_PATTERNS = [
    # 1. Upfront Payment / Fee Demands
    {
        "id": "upfront_fee",
        "category": "Financial Extraction",
        "severity": "CRITICAL",
        "title": "Upfront Payment or Registration Fee Demand",
        "description": "Requests advance payments under the guise of registration, security deposit, training fee, or document processing.",
        "regex": r"(?:registration\s+fee|processing\s+fee|security\s+deposit|refundable\s+deposit|pay\s+(?:rs\.?|inr|₹|\$)\s*[\d,]+|advance\s+fee|activation\s+charge|training\s+fee|document\s+charge)",
        "dna_technique": "UPFRONT_PAYMENT_DEMAND"
    },
    # 2. Artificial Urgency & Coercion
    {
        "id": "artificial_urgency",
        "category": "Psychological Manipulation",
        "severity": "HIGH",
        "title": "Artificial Urgency & Threat Pressure",
        "description": "Pressures victim to act immediately to prevent severe consequences or avoid losing an opportunity.",
        "regex": r"(?:within\s+(?:24|12|48)\s*hours?|immediately|account\s+(?:blocked|suspended|deactivated|terminated)|act\s+now|urgent\s+action|last\s+chance|expires\s+today|final\s+warning|confirm\s+your\s+position\s+within|limited\s+slots?)",
        "dna_technique": "ARTIFICIAL_URGENCY"
    },
    # 3. Unrealistic Financial Promises & Guaranteed Recruitment
    {
        "id": "unrealistic_guarantee",
        "category": "Deceptive Promise",
        "severity": "CRITICAL",
        "title": "Unrealistic Recruitment / Profit Guarantee",
        "description": "Promises guaranteed profit, risk-free returns, or effortless job selection without technical interview.",
        "regex": r"(?:guaranteed\s+(?:returns?|profit|placement|selection)|100%\s*(?:safe|guaranteed|profit)|double\s+your\s+money|risk[- ]free\s+profit|earn\s+(?:rs\.?|inr|₹|\$)?\s*\d{3,}\s*(?:per\s+day|daily|weekly)|high[- ]paying\s+internship|no\s+interview\s+required|direct\s+offer\s+letter)",
        "dna_technique": "UNREALISTIC_PROMISE"
    },
    # 4. Credential & OTP Harvesting
    {
        "id": "otp_credential_theft",
        "category": "Credential Theft",
        "severity": "CRITICAL",
        "title": "Sensitive Credential or OTP Request",
        "description": "Attempts to solicit one-time passcodes (OTP), banking PINs, card CVVs, or account passwords.",
        "regex": r"(?:share\s+your\s+otp|send\s+(?:the\s+)?otp|enter\s+(?:your\s+)?pin|verify\s+(?:your\s+)?(?:password|credentials|cvv)|kyc\s+update\s+link|update\s+pan\s+immediately|send\s+bank\s+details)",
        "dna_technique": "CREDENTIAL_HARVESTING"
    },
    # 5. Fake Lottery, Prizes & Unsolicited Selection
    {
        "id": "fake_reward",
        "category": "Social Engineering",
        "severity": "HIGH",
        "title": "Fake Lottery, Gift or Unsolicited Selection",
        "description": "Claims recipient has won a prize, lottery, or was selected for an exclusive offer without application.",
        "regex": r"(?:congratulations!?\s+you\s+(?:have\s+)?(?:been\s+)?(?:selected|won)|lottery\s+winner|claimed?\s+(?:your\s+)?(?:reward|prize|cashback|gift\s+card)|selected\s+for\s+(?:a\s+|an\s+)?(?:high-paying|exclusive|lucky|internship|job)|kbc\s+lottery)",
        "dna_technique": "UNREALISTIC_PROMISE"
    },
    # 6. Authority & Institutional Impersonation
    {
        "id": "authority_impersonation",
        "category": "Identity Impersonation",
        "severity": "HIGH",
        "title": "Bank or Government Authority Impersonation",
        "description": "Fabricates identity of reputable institutions (RBI, SBI, Income Tax, FedEx, Police, Amazon HR).",
        "regex": r"(?:reserve\s+bank\s+of\s+india|rbi\s+alert|income\s+tax\s+department|customs\s+(?:office|officer|clearance)|sbi\s+security\s+team|amazon\s+hr\s+recruitment|cyber\s+police)",
        "dna_technique": "AUTHORITY_IMPERSONATION"
    },
    # 7. Unofficial Channel Redirection
    {
        "id": "channel_redirection",
        "category": "Communication Evasion",
        "severity": "MEDIUM",
        "title": "Off-Platform Communication Redirection",
        "description": "Directs victim from official portals onto private channels like WhatsApp, Telegram, or personal Gmail.",
        "regex": r"(?:contact\s+(?:on\s+|via\s+)?whatsapp|join\s+(?:our\s+)?telegram(?:\s+channel|\s+group)?|dm\s+on\s+telegram|send\s+resume\s+to\s+[\w\.-]+@gmail\.com)",
        "dna_technique": "SUSPICIOUS_COMMUNICATION_CHANNEL"
    },
    # 8. Ponzi & Multi-Level Referral Mechanics
    {
        "id": "ponzi_referral",
        "category": "Schematic Fraud",
        "severity": "HIGH",
        "title": "Multi-Level Referral / Ponzi Dynamics",
        "description": "Incentivizes recruiting new members for passive commissions or upfront deposit multipliers.",
        "regex": r"(?:refer\s+(?:and\s+earn|\d+\s+friends)|daily\s+roi|mining\s+pool\s+investment|binary\s+plan|passive\s+crypto\s+income|downline\s+commission)",
        "dna_technique": "PONZI_REFERRAL_STRUCTURE"
    }
]


class NLPEngine:
    """Core Natural Language Processing engine for text-based scam inspection."""

    @staticmethod
    def extract_highlighted_phrases(text: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Locates exact regex matches within the source text, returning:
        1. List of detected threat indicators with explanations.
        2. List of highlighted phrase spans with exact start and end string offsets.
        """
        if not text or not text.strip():
            return [], []

        threats = []
        highlights = []
        seen_spans = set()

        for pattern in SCAM_PATTERNS:
            regex = re.compile(pattern["regex"], re.IGNORECASE)
            matches = list(regex.finditer(text))
            
            if matches:
                # Add indicator entry
                sample_match = matches[0].group(0)
                threats.append({
                    "id": pattern["id"],
                    "title": pattern["title"],
                    "category": pattern["category"],
                    "severity": pattern["severity"],
                    "what_was_detected": f"Detected matching phrasing: \"{sample_match}\"",
                    "why_it_matters": pattern["description"],
                    "dna_technique": pattern["dna_technique"]
                })

                # Record exact span positions for UI highlighting
                for m in matches:
                    start, end = m.start(), m.end()
                    span_key = (start, end)
                    if span_key not in seen_spans:
                        seen_spans.add(span_key)
                        highlights.append({
                            "text": text[start:end],
                            "start": start,
                            "end": end,
                            "severity": pattern["severity"],
                            "category": pattern["category"],
                            "technique": pattern["dna_technique"]
                        })

        # Sort highlights by appearance order in text
        highlights.sort(key=lambda x: x["start"])
        return threats, highlights

    @staticmethod
    def extract_urls(text: str) -> List[str]:
        """Extracts all embedded web URLs from arbitrary text."""
        url_regex = re.compile(r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\.-]*\b", re.IGNORECASE)
        return url_regex.findall(text or "")

    @staticmethod
    def calculate_urgency_metric(text: str) -> float:
        """Measures psychological urgency markers on a scale of 0 to 100."""
        urgency_terms = [
            "urgent", "immediately", "hurry", "fast", "act now", "warning",
            "blocked", "suspended", "deadline", "today", "now", "alert"
        ]
        lower = text.lower()
        matches = sum(lower.count(term) for term in urgency_terms)
        return min(100.0, matches * 25.0)

    @staticmethod
    def calculate_financial_greed_metric(text: str) -> float:
        """Measures financial promises, fee demands, or lottery lures on a scale of 0 to 100."""
        terms = [
            "profit", "guaranteed", "earn", "salary", "bonus", "cashback",
            "deposit", "fee", "payment", "lakh", "crore", "dollar", "crypto"
        ]
        lower = text.lower()
        matches = sum(lower.count(term) for term in terms)
        return min(100.0, matches * 20.0)
