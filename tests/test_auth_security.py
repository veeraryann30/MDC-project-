"""
Unit Tests for Authentication and Security
"""

import unittest
import time
from backend.app.security.auth import (
    hash_password, verify_password, create_access_token, decode_access_token
)
from fastapi import HTTPException


class TestAuthSecurity(unittest.TestCase):

    def test_password_hashing_and_verification(self):
        pwd = "UltraSecurePassword2026!#"
        hashed = hash_password(pwd)
        self.assertNotEqual(pwd, hashed)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword123", hashed))

    def test_jwt_token_creation_and_payload(self):
        payload = {"sub": "42", "email": "analyst@catchthephish.io", "role": "admin"}
        token = create_access_token(payload, expires_delta=3600)
        decoded = decode_access_token(token)
        self.assertEqual(decoded["sub"], "42")
        self.assertEqual(decoded["email"], "analyst@catchthephish.io")
        self.assertEqual(decoded["role"], "admin")

    def test_tampered_token_rejection(self):
        token = create_access_token({"sub": "42"})
        parts = token.split(".")
        # Tamper payload
        tampered_token = f"{parts[0]}.eyJhZG1pbiI6dHJ1ZX0.{parts[2]}"
        with self.assertRaises(HTTPException):
            decode_access_token(tampered_token)

    def test_expired_token_rejection(self):
        # Create token already expired in the past
        token = create_access_token({"sub": "42"}, expires_delta=-10)
        with self.assertRaises(HTTPException):
            decode_access_token(token)


if __name__ == "__main__":
    unittest.main()
