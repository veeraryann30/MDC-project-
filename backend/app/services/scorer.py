"""
Hybrid Risk Scoring Engine for Catch the Phish
Synthesizes ML prediction, rule heuristics, and threat intelligence into a unified 0-100 score.
Categorizes into SAFE (0-29), SUSPICIOUS (30-69), and HIGH RISK / PHISHING (70-100).
"""

from typing import Dict, Any, List

class ScorerService:
    @staticmethod
    def calculate_risk(
        ml_score: float,
        rule_score: float,
        threat_intel_score: float,
        threats_detected: List[Dict[str, Any]],
        domain: str
    ) -> Dict[str, Any]:
        """
        Combines signals:
        - ML prediction probability (0 - 100)
        - Rule heuristics penalty (0 - 100)
        - Threat intelligence status
        """
        has_high_severity = any(t.get("severity") == "HIGH" for t in threats_detected)
        high_severity_count = sum(1 for t in threats_detected if t.get("severity") == "HIGH")

        # Base weighted combination
        combined_raw = (0.50 * ml_score) + (0.50 * rule_score)

        # Boost if threat intel flagged it
        if threat_intel_score > 0:
            combined_raw = max(combined_raw, threat_intel_score)

        # Critical security override: If high severity threat exists (like brand spoofing or IP login), minimum floor
        if has_high_severity:
            if high_severity_count >= 2 or ml_score >= 80:
                combined_raw = max(combined_raw, 75.0)
            else:
                combined_raw = max(combined_raw, 55.0)

        final_score = min(100.0, max(0.0, round(combined_raw, 1)))

        # Classification thresholds
        if final_score <= 29.0:
            classification = "SAFE"
            classification_label = "Low Risk / Likely Safe"
            summary_explanation = (
                f"The URL '{domain}' shows standard domain naming conventions, clean syntax, "
                "and no significant phishing markers or impersonation indicators."
            )
        elif final_score <= 69.0:
            classification = "SUSPICIOUS"
            classification_label = "Suspicious / Exercise Caution"
            threat_names = [t["title"] for t in threats_detected[:2]]
            threat_str = " and ".join(threat_names) if threat_names else "anomalous indicators"
            summary_explanation = (
                f"The URL exhibits unusual characteristics ({threat_str}). "
                "While not confirmed malicious, it deviates from standard trustworthy patterns. Do not submit sensitive data."
            )
        else:
            classification = "PHISHING"
            classification_label = "High Risk / Probable Phishing"
            threat_names = [t["title"] for t in threats_detected[:3]]
            threat_str = ", ".join(threat_names) if threat_names else "critical indicators"
            summary_explanation = (
                f"High-confidence phishing threat detected! The URL exhibits dangerous signatures ({threat_str}) "
                "strongly characteristic of active credential theft campaigns."
            )

        return {
            "final_score": final_score,
            "ml_score": ml_score,
            "rule_score": rule_score,
            "threat_intel_score": threat_intel_score,
            "classification": classification,
            "classification_label": classification_label,
            "summary_explanation": summary_explanation
        }
