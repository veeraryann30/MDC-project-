"""
Security & Authentication Utilities for Catch the Phish
Implements secure password hashing via PBKDF2-HMAC-SHA256 and signed JWT tokens
using Python standard library (zero external compiled dependencies).
"""

import os
import hmac
import json
import time
import base64
import hashlib
import secrets
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

def _load_secret_key() -> str:
    """Signing key for JWTs. Must come from the environment in production."""
    key = os.getenv("AUTH_SECRET_KEY", "").strip()
    is_prod = os.getenv("APP_ENV", "development").lower() == "production"
    if key and key.startswith("catch-the-phish-super-secure"):
        # The old default is public (it was committed to the repository); never accept it.
        key = ""
    if len(key) >= 32:
        return key
    if is_prod:
        raise RuntimeError(
            "AUTH_SECRET_KEY must be set to a random string of at least 32 characters when APP_ENV=production."
        )
    # Development: a random per-process key. Tokens simply stop working after a restart.
    print("[!] AUTH_SECRET_KEY not set; using a temporary random key (development only).")
    return secrets.token_urlsafe(48)


SECRET_KEY = _load_secret_key()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 days

security_bearer = HTTPBearer(auto_error=False)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def _b64url_decode(data: str) -> bytes:
    padding = '=' * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 and 100,000 iterations."""
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100_000)
    return f"{salt.hex()}${key.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verifies a plain password against the stored salt$key hash."""
    try:
        salt_hex, key_hex = stored_hash.split('$')
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        computed_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100_000)
        return hmac.compare_digest(computed_key, expected_key)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Generates an RFC 7519 compliant HMAC-SHA256 JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    exp = int(time.time()) + (expires_delta or ACCESS_TOKEN_EXPIRE_SECONDS)
    payload["exp"] = exp
    payload["iat"] = int(time.time())

    h_bytes = _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    p_bytes = _b64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    msg = f"{h_bytes}.{p_bytes}".encode('utf-8')

    signature = hmac.new(SECRET_KEY.encode('utf-8'), msg, hashlib.sha256).digest()
    s_bytes = _b64url_encode(signature)

    return f"{h_bytes}.{p_bytes}.{s_bytes}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Validates and decodes JWT token."""
    parts = token.split('.')
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format."
        )

    h_str, p_str, s_str = parts
    msg = f"{h_str}.{p_str}".encode('utf-8')
    expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), msg, hashlib.sha256).digest()

    try:
        given_sig = _b64url_decode(s_str)
        if not hmac.compare_digest(expected_sig, given_sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signature verification failed."
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature encoding."
        )

    try:
        payload = json.loads(_b64url_decode(p_str).decode('utf-8'))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload."
        )

    if "exp" in payload and time.time() > payload["exp"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired."
        )

    return payload


def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[Dict[str, Any]]:
    """Returns decoded user payload if valid bearer token provided, else None."""
    if not credentials:
        return None
    try:
        return decode_access_token(credentials.credentials)
    except HTTPException:
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    """Requires a valid bearer token; returns the decoded payload."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return decode_access_token(credentials.credentials)


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Requires an authenticated user whose token carries the admin role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required.")
    return user
