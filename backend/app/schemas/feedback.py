from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class FeedbackRequest(BaseModel):
    scan_id: int = Field(..., ge=1, description="ID of the scan the user is giving feedback on")
    label: Literal["phishing", "safe"] = Field(
        ..., description="What the user believes the link is: 'phishing' (report) or 'safe' (false positive)"
    )
    comment: Optional[str] = Field(default=None, max_length=500)

    @field_validator("comment")
    @classmethod
    def clean_comment(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = "".join(ch for ch in v if ch.isprintable() or ch in "\n ").strip()
        return cleaned or None


class FeedbackResponse(BaseModel):
    id: int
    scan_id: int
    label: str
    updated: bool
    message: str
