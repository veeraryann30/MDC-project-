"""The scanner must reject text that is not a web address before any analysis runs."""
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from pydantic import ValidationError

from backend.app.schemas.scan import ScanRequest
from backend.app.services.url_validation import check_url


class TestUrlValidation(unittest.TestCase):
    VALID = [
        "example.com", "www.google.com", "https://example.com/login?a=1", "bit.ly/3xyz",
        "http://paypa1-account-verification.xyz/login.php", "192.168.1.100:8080/x", "http://[::1]:8080/",
        "localhost:3000", "xn--gogle-pra.com/signin", "münchen.de", "http://2130706433/admin",
    ]
    INVALID = [
        "adsajv", "asdf asdf", "hello world.com", "javascript:alert(1)", "mailto:a@b.com", "ftp://example.com",
        "file:///etc/passwd", "data:text/html,hi", "http://", "https://.com", "http://-bad-.com", "example.c",
        "example.123", "http://a..b.com", "example.com:99999", "   ",
    ]

    def test_valid_inputs_accepted(self):
        for u in self.VALID:
            self.assertTrue(check_url(u)[0], u)

    def test_invalid_inputs_rejected_with_message(self):
        for u in self.INVALID:
            ok, msg = check_url(u)
            self.assertFalse(ok, u)
            self.assertTrue(msg, u)

    def test_request_schema_rejects_invalid_before_scanning(self):
        with self.assertRaises(ValidationError) as ctx:
            ScanRequest(url="adsajv")
        self.assertIn("not a valid web address", str(ctx.exception))
        self.assertEqual(ScanRequest(url="  example.com  ").url, "example.com")


if __name__ == "__main__":
    unittest.main()
