import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")
MIN_PASSWORD = 8
MAX_PASSWORD = 128  # bounded: PBKDF2 cost grows with input size


def _clean_email(v: str) -> str:
    v = (v or "").strip().lower()
    if len(v) > 254 or not EMAIL_RE.match(v):
        raise ValueError("Enter a valid email address.")
    return v


class UserRegisterRequest(BaseModel):
    email: str = Field(..., example="you@example.com")
    password: str = Field(..., example="a-long-passphrase")
    full_name: Optional[str] = Field(None, example="Veer Aryan")

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return _clean_email(v)

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        if len(v) < MIN_PASSWORD:
            raise ValueError(f"Password must be at least {MIN_PASSWORD} characters.")
        if len(v) > MAX_PASSWORD:
            raise ValueError(f"Password must be at most {MAX_PASSWORD} characters.")
        if not v.strip():
            raise ValueError("Password cannot be only spaces.")
        return v

    @field_validator("full_name")
    @classmethod
    def _name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = re.sub(r"[\x00-\x1f\x7f]", "", v).strip()
        if len(v) > 80:
            raise ValueError("Name must be at most 80 characters.")
        return v or None


class UserLoginRequest(BaseModel):
    email: str = Field(..., example="you@example.com")
    password: str = Field(..., example="a-long-passphrase")

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if not v or len(v) > 254:
            raise ValueError("Enter your email address.")
        return v

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        if not v or len(v) > MAX_PASSWORD:
            raise ValueError("Enter your password.")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str = "analyst"
    is_active: bool = True
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
