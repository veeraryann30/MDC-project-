"""
Unit Tests for Investment & Financial Scam Detector
"""

import unittest
from backend.app.services.investment_scam_service import InvestmentScamService


class TestInvestmentScamDetector(unittest.TestCase):

    def test_clean_financial_commentary(self):
        text = "Index funds track major equity benchmarks such as the S&P 500. Past market performance is not a guarantee of future returns. Diversification helps manage risk."
        res = InvestmentScamService.analyze(text)
        self.assertLessEqual(res["risk_score"], 29.0)
        self.assertEqual(res["risk_tier"], "LOW")
        self.assertIn("Standard", res["financial_verdict"])

    def test_guaranteed_return_crypto_ponzi(self):
        text = "Guaranteed 200% return in 48 hours! 100% risk-free automated bot. Double your money. Refer 3 friends for binary downline bonuses."
        res = InvestmentScamService.analyze(text)
        self.assertGreaterEqual(res["risk_score"], 70.0)
        self.assertIn(res["risk_tier"], ["HIGH", "CRITICAL"])
        titles = [t["title"] for t in res["detected_indicators"]]
        self.assertTrue(any("Guaranteed Return" in t for t in titles))
        self.assertTrue(any("Ponzi" in t for t in titles))

    def test_advance_withdrawal_fee_trap(self):
        text = "Your account balance is $24,500. Pay gas fee required and 10% withdrawal fee to unlock your funds."
        res = InvestmentScamService.analyze(text)
        self.assertGreaterEqual(res["risk_score"], 50.0)
        titles = [t["title"] for t in res["detected_indicators"]]
        self.assertTrue(any("Withdrawal Fee" in t for t in titles))


if __name__ == "__main__":
    unittest.main()
