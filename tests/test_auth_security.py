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


class TestAuthValidation(unittest.TestCase):
    def test_registration_rules(self):
        from pydantic import ValidationError
        from backend.app.schemas.auth import UserRegisterRequest

        ok = UserRegisterRequest(email="  Person@Example.COM ", password="a-long-enough-pass", full_name=" Veer\x07 ")
        self.assertEqual(ok.email, "person@example.com")      # trimmed + lower-cased
        self.assertEqual(ok.full_name, "Veer")                # control characters stripped
        for bad in (
            dict(email="not-an-email", password="a-long-enough-pass"),
            dict(email="a@b.co", password="short"),            # under 8 characters
            dict(email="a@b.co", password=" " * 12),           # only spaces
            dict(email="a@b.co", password="x" * 129),          # bounded (PBKDF2 cost grows with input)
            dict(email="a@b.co", password="a-long-enough-pass", full_name="n" * 81),
        ):
            with self.assertRaises(ValidationError, msg=str(bad)[:40]):
                UserRegisterRequest(**bad)

    def test_login_input_is_bounded_but_not_policy_checked(self):
        from pydantic import ValidationError
        from backend.app.schemas.auth import UserLoginRequest

        # Existing accounts may have older, shorter passwords: login must not apply the signup policy.
        self.assertEqual(UserLoginRequest(email=" A@B.CO ", password="abc").email, "a@b.co")
        with self.assertRaises(ValidationError):
            UserLoginRequest(email="a@b.co", password="x" * 129)
        with self.assertRaises(ValidationError):
            UserLoginRequest(email="", password="abc")


if __name__ == "__main__":
    unittest.main()
