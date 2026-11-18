"""
Unit Tests for Fake Job & Internship Scam Detector
"""

import unittest
from backend.app.services.job_scam_service import JobScamService


class TestJobScamDetector(unittest.TestCase):

    def test_clean_legitimate_job_posting(self):
        text = """
        Software Engineer - Backend
        Requirements:
        - 3+ years experience with Python and FastAPI
        - Experience with relational databases and SQL
        - Strong communication skills
        Apply through our official career portal at careers.techcorp.com.
        """
        res = JobScamService.analyze(text, company_name="TechCorp")
        self.assertLessEqual(res["risk_score"], 29.0)
        self.assertEqual(res["risk_tier"], "LOW")
        self.assertIn("Legitimate", res["legitimacy_verdict"])

    def test_fake_internship_with_upfront_registration_fee(self):
        text = "Congratulations! You have been selected for a high-paying internship at Microsoft. Pay ₹1,500 for registration fee to confirm your position. Contact hr.recruiter@gmail.com."
        res = JobScamService.analyze(text, company_name="Microsoft")
        self.assertGreaterEqual(res["risk_score"], 60.0)
        self.assertIn(res["risk_tier"], ["HIGH", "CRITICAL"])
        indicator_titles = [t["title"] for t in res["detected_indicators"]]
        self.assertTrue(any("Upfront Fee" in t for t in indicator_titles))
        self.assertTrue(any("Corporate Impersonation" in t for t in indicator_titles))

    def test_guaranteed_selection_no_interview(self):
        text = "Instant job placement! Guaranteed selection without interview. Work from home data entry. Pay ₹999 security deposit."
        res = JobScamService.analyze(text)
        self.assertGreaterEqual(res["risk_score"], 65.0)


if __name__ == "__main__":
    unittest.main()
