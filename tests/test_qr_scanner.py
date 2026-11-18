"""
Unit tests for QR Code Scam Detector
Tests valid, invalid, multiple, unreadable, PDF, and SSRF QR vectors.
"""

import io
import unittest
import numpy as np
import qrcode
from PIL import Image

from backend.app.database.session import SessionLocal
from backend.app.services.qr_scanner_service import QRScannerService


class TestQRScanner(unittest.TestCase):

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def _make_qr_bytes(self, payload: str, fmt="PNG") -> bytes:
        qr = qrcode.QRCode(box_size=10, border=4)
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format=fmt)
        return buf.getvalue()

    def test_valid_phishing_url_qr(self):
        phish_url = "http://paypa1-account-verification.xyz/login.php"
        file_bytes = self._make_qr_bytes(phish_url, "PNG")
        res = QRScannerService.analyze_qr_file("test_phish.png", file_bytes, self.db)

        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "SUCCESS")
        self.assertTrue(res["is_url"])
        self.assertEqual(res["qr_count"], 1)
        self.assertEqual(res["extracted_url"], phish_url)
        self.assertIn(res["risk_classification"], ["Suspicious", "Malicious"])
        self.assertGreaterEqual(res["risk_score"], 60)
        self.assertGreater(len(res["recommended_actions"]), 0)
        self.assertGreater(len(res["danger_explanation"]), 10)

    def test_valid_safe_url_qr(self):
        safe_url = "https://www.google.com/search?q=cybersecurity"
        file_bytes = self._make_qr_bytes(safe_url, "PNG")
        res = QRScannerService.analyze_qr_file("test_safe.png", file_bytes, self.db)

        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "SUCCESS")
        self.assertTrue(res["is_url"])
        self.assertEqual(res["extracted_url"], safe_url)
        self.assertEqual(res["risk_classification"], "Safe")
        self.assertLess(res["risk_score"], 35)

    def test_unreadable_blank_image(self):
        # Blank white PNG image
        blank = Image.new("RGB", (300, 300), (255, 255, 255))
        buf = io.BytesIO()
        blank.save(buf, format="PNG")
        file_bytes = buf.getvalue()

        res = QRScannerService.analyze_qr_file("blank.png", file_bytes, self.db)
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "NO_QR_DETECTED")
        self.assertEqual(res["risk_classification"], "Inconclusive")
        self.assertEqual(res["qr_count"], 0)

    def test_multiple_qr_codes(self):
        qr1 = qrcode.make("https://legitimate-domain.com").convert("RGB")
        qr2 = qrcode.make("http://fake-banking-alert.xyz/verify").convert("RGB")

        combined = Image.new("RGB", (qr1.width + qr2.width + 40, max(qr1.height, qr2.height)), (255, 255, 255))
        combined.paste(qr1, (10, 0))
        combined.paste(qr2, (qr1.width + 30, 0))

        buf = io.BytesIO()
        combined.save(buf, format="PNG")
        file_bytes = buf.getvalue()

        res = QRScannerService.analyze_qr_file("multi.png", file_bytes, self.db)
        self.assertTrue(res["success"])
        self.assertGreaterEqual(res["qr_count"], 2)
        self.assertGreaterEqual(len(res["extracted_contents"]), 2)

    def test_pdf_embedded_qr(self):
        qr_img = qrcode.make("https://invoice-payment-portal.top/pay").convert("RGB")
        pdf_buf = io.BytesIO()
        qr_img.save(pdf_buf, format="PDF")
        file_bytes = pdf_buf.getvalue()

        res = QRScannerService.analyze_qr_file("invoice.pdf", file_bytes, self.db)
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["file_type"], "application/pdf")
        self.assertEqual(res["extracted_url"], "https://invoice-payment-portal.top/pay")

    def test_ssrf_and_unsafe_redirect_protection(self):
        # 127.0.0.1 loopback
        loopback_bytes = self._make_qr_bytes("http://127.0.0.1:8080/admin", "PNG")
        res_loopback = QRScannerService.analyze_qr_file("loopback.png", loopback_bytes, self.db)
        self.assertEqual(res_loopback["risk_classification"], "Malicious")
        self.assertEqual(res_loopback["risk_score"], 95.0)

        # 169.254.169.254 AWS metadata
        meta_bytes = self._make_qr_bytes("http://169.254.169.254/latest/meta-data/", "PNG")
        res_meta = QRScannerService.analyze_qr_file("metadata.png", meta_bytes, self.db)
        self.assertEqual(res_meta["risk_classification"], "Malicious")
        self.assertEqual(res_meta["risk_score"], 95.0)

        # Dangerous scheme
        danger_bytes = self._make_qr_bytes("javascript:alert(document.cookie)", "PNG")
        res_danger = QRScannerService.analyze_qr_file("danger.png", danger_bytes, self.db)
        self.assertEqual(res_danger["risk_classification"], "Malicious")

    def test_plain_text_qr(self):
        text_bytes = self._make_qr_bytes("Conference Room B Wi-Fi: Password123", "PNG")
        res = QRScannerService.analyze_qr_file("text.png", text_bytes, self.db)
        self.assertTrue(res["success"])
        self.assertFalse(res["is_url"])
        self.assertEqual(res["risk_classification"], "Safe")


if __name__ == "__main__":
    unittest.main()
