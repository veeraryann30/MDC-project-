from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: str = Field(..., example="analyst@example.com")
    password: str = Field(..., min_length=6, example="SecurePass123!")
    full_name: Optional[str] = Field(None, example="Veer Aryan")


class UserLoginRequest(BaseModel):
    email: str = Field(..., example="analyst@example.com")
    password: str = Field(..., example="SecurePass123!")


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
