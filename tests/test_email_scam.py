"""
Unit Tests for Email Phishing & Header Inspector
"""

import unittest
from backend.app.services.email_scam_service import EmailScamService


class TestEmailScamDetector(unittest.TestCase):

    def test_clean_internal_email(self):
        raw = """From: colleague@company.com
To: analyst@company.com
Subject: Sprint Planning Agenda for Thursday
Date: Thu, 14 Nov 2026 10:00:00 +0000

Hi team,
Please find the agenda for our sprint review attached below.
Let me know if you would like to add any items.
"""
        res = EmailScamService.analyze_raw_email(raw)
        self.assertLessEqual(res["risk_score"], 29.0)
        self.assertEqual(res["risk_tier"], "LOW")
        self.assertIn("Likely Legitimate", res["email_verdict"])

    def test_display_name_spoof_with_executable_attachment(self):
        raw = """From: "PayPal Security" <attacker@hacked-domain.xyz>
Reply-To: phish-collector@mail-hub.com
Subject: Critical Alert: Unauthorized Account Login
Date: Thu, 14 Nov 2026 10:05:00 +0000
Content-Type: multipart/mixed; boundary="BOUNDARY"

--BOUNDARY
Content-Type: text/plain

Your account has been suspended. Please review the attached security update.

--BOUNDARY
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="security_patch.pdf.exe"

MZ...binary...
--BOUNDARY--
"""
        res = EmailScamService.analyze_raw_email(raw)
        self.assertGreaterEqual(res["risk_score"], 70.0)
        self.assertIn(res["risk_tier"], ["HIGH", "CRITICAL"])
        self.assertTrue(res["sender_analysis"]["is_spoofed"])
        self.assertTrue(res["sender_analysis"]["has_reply_to_mismatch"])
        self.assertTrue(any(att["is_dangerous"] for att in res["attachments"]))


if __name__ == "__main__":
    unittest.main()
