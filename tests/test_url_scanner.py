"""
Unit & Integration Tests for URL Scanner and Heuristic Scoring
"""

import unittest
from ml.features.extractor import extract_features
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.ml_service import MLService
from backend.app.services.scorer import ScorerService


class TestURLScanner(unittest.TestCase):

    def test_clean_legitimate_url(self):
        url = "https://www.google.com/search?q=cybersecurity"
        extracted = extract_features(url)
        features = extracted["features"]
        details = extracted["details"]
        threats, safe_signals, rule_score = RuleEngineService.evaluate(features, details)
        ml_score, is_phish = MLService.predict(features)
        risk = ScorerService.calculate_risk(ml_score, rule_score, 0.0, threats, details["domain"])

        self.assertLessEqual(risk["final_score"], 29.0)
        self.assertEqual(risk["classification"], "SAFE")
        self.assertEqual(risk["risk_tier"], "LOW")

    def test_phishing_brand_impersonation_url(self):
        url = "http://paypa1-account-verification.xyz/login.php"
        extracted = extract_features(url)
        features = extracted["features"]
        details = extracted["details"]
        threats, safe_signals, rule_score = RuleEngineService.evaluate(features, details)
        ml_score, is_phish = MLService.predict(features)
        risk = ScorerService.calculate_risk(ml_score, rule_score, 0.0, threats, details["domain"])

        self.assertGreaterEqual(risk["final_score"], 60.0)
        self.assertIn(risk["classification"], ["SUSPICIOUS", "PHISHING"])
        # Ensure brand impersonation or suspicious TLD was detected
        threat_titles = [t["title"] for t in threats]
        self.assertTrue(any("Brand Impersonation" in t or "Top-Level Domain" in t for t in threat_titles))

    def test_raw_ip_address_host(self):
        url = "http://192.168.1.100:8080/login.asp"
        extracted = extract_features(url)
        self.assertEqual(extracted["features"]["is_ip_address"], 1)
        self.assertEqual(extracted["features"]["has_suspicious_port"], 1)


if __name__ == "__main__":
    unittest.main()
