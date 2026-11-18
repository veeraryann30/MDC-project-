"""
Central Multi-Signal Risk Scoring Engine for Catch the Phish
Synthesizes ML prediction, rule heuristics, NLP semantic weights, and threat intelligence into a unified 0-100 score.
Categorizes into standard 4-tier risk levels:
- 0–29: LOW RISK
- 30–59: MODERATE RISK
- 60–79: HIGH RISK
- 80–100: CRITICAL RISK
- INCONCLUSIVE: When insufficient content or ambiguous signals exist.
"""

from typing import Dict, Any, List, Optional

class ScorerService:
    # Configurable thresholds
    LOW_THRESHOLD = 29.0
    MODERATE_THRESHOLD = 59.0
    HIGH_THRESHOLD = 79.0

    @classmethod
    def classify_score(cls, score: float, is_inconclusive: bool = False) -> Dict[str, str]:
        """Classifies a numeric score (0-100) into standardized tier labels."""
        if is_inconclusive:
            return {
                "tier": "INCONCLUSIVE",
                "tier_label": "Inconclusive / Insufficient Data",
                "badge_color": "gray"
            }
        
        clamped = max(0.0, min(100.0, score))
        if clamped <= cls.LOW_THRESHOLD:
            return {
                "tier": "LOW",
                "tier_label": "Low Risk / Likely Safe",
                "badge_color": "green"
            }
        elif clamped <= cls.MODERATE_THRESHOLD:
            return {
                "tier": "MODERATE",
                "tier_label": "Moderate Risk / Exercise Caution",
                "badge_color": "yellow"
            }
        elif clamped <= cls.HIGH_THRESHOLD:
            return {
                "tier": "HIGH",
                "tier_label": "High Risk / Probable Threat",
                "badge_color": "orange"
            }
        else:
            return {
                "tier": "CRITICAL",
                "tier_label": "Critical Risk / Confirmed Scam",
                "badge_color": "red"
            }

    @classmethod
    def calculate_risk(
        cls,
        ml_score: float,
        rule_score: float,
        threat_intel_score: float = 0.0,
        threats_detected: Optional[List[Dict[str, Any]]] = None,
        domain: str = ""
    ) -> Dict[str, Any]:
        """
        Combines signals for URL / Infrastructure scans.
        Retains backward compatibility with legacy classification (SAFE, SUSPICIOUS, PHISHING)
        while providing standard risk tiers (LOW, MODERATE, HIGH, CRITICAL).
        """
        threats = threats_detected or []
        has_high_severity = any(t.get("severity") == "HIGH" for t in threats)
        high_severity_count = sum(1 for t in threats if t.get("severity") == "HIGH")

        # Base weighted combination
        combined_raw = (0.50 * ml_score) + (0.50 * rule_score)

        # Boost if threat intel flagged it
        if threat_intel_score > 0:
            combined_raw = max(combined_raw, threat_intel_score)

        # Critical security override: If high severity threat exists (like brand spoofing or IP login)
        if has_high_severity:
            if high_severity_count >= 2 or ml_score >= 80:
                combined_raw = max(combined_raw, 75.0)
            else:
                combined_raw = max(combined_raw, 55.0)

        final_score = min(100.0, max(0.0, round(combined_raw, 1)))
        tier_info = cls.classify_score(final_score)

        # Legacy backward-compatible mapping
        if final_score <= 29.0:
            legacy_class = "SAFE"
            summary_explanation = (
                f"The URL '{domain}' shows standard domain naming conventions, clean syntax, "
                "and no significant phishing markers or impersonation indicators."
            )
        elif final_score <= 69.0:
            legacy_class = "SUSPICIOUS"
            threat_names = [t.get("title", "") for t in threats[:2]]
            threat_str = " and ".join(filter(None, threat_names)) or "anomalous indicators"
            summary_explanation = (
                f"The URL exhibits unusual characteristics ({threat_str}). "
                "While not confirmed malicious, it deviates from standard trustworthy patterns. Do not submit sensitive data."
            )
        else:
            legacy_class = "PHISHING"
            threat_names = [t.get("title", "") for t in threats[:3]]
            threat_str = ", ".join(filter(None, threat_names)) or "critical indicators"
            summary_explanation = (
                f"High-confidence phishing threat detected! The URL exhibits dangerous signatures ({threat_str}) "
                "strongly characteristic of active credential theft campaigns."
            )

        return {
            "final_score": final_score,
            "ml_score": ml_score,
            "rule_score": rule_score,
            "threat_intel_score": threat_intel_score,
            "risk_tier": tier_info["tier"],
            "risk_tier_label": tier_info["tier_label"],
            "classification": legacy_class,
            "classification_label": legacy_class if legacy_class == "SAFE" else f"{legacy_class.capitalize()} ({tier_info['tier_label']})",
            "summary_explanation": summary_explanation
        }
