"""
Unit Tests for AI Message Scam Detector
"""

import unittest
from backend.app.services.message_scanner_service import MessageScannerService


class TestMessageScanner(unittest.TestCase):

    def test_clean_message(self):
        text = "Hey Veer, are we still meeting tomorrow at 4 PM for the project discussion?"
        res = MessageScannerService.analyze(text)
        self.assertLessEqual(res["risk_score"], 29.0)
        self.assertEqual(res["risk_tier"], "LOW")
        self.assertEqual(len(res["detected_indicators"]), 0)

    def test_kyc_and_otp_banking_fraud(self):
        text = "URGENT: SBI Alert! Your account is blocked today. Update KYC at http://sbi-verify.top immediately. Share your OTP to confirm."
        res = MessageScannerService.analyze(text)
        self.assertGreaterEqual(res["risk_score"], 60.0)
        self.assertIn(res["risk_tier"], ["HIGH", "CRITICAL"])
        self.assertTrue(len(res["highlighted_phrases"]) > 0)
        self.assertIn("OTP", res["scam_category"])

    def test_lottery_prize_lure(self):
        text = "Congratulations! You have won ₹25,00,000 in KBC Lottery. Pay registration fee of ₹2,500 to claim your reward."
        res = MessageScannerService.analyze(text)
        self.assertGreaterEqual(res["risk_score"], 50.0)
        self.assertTrue(any("Registration Fee" in ind["title"] or "Unrealistic" in ind["title"] for ind in res["detected_indicators"]))


if __name__ == "__main__":
    unittest.main()
