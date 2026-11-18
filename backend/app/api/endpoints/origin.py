"""
Link Origin Intelligence API Endpoint
Provides network infrastructure investigation, DNS resolution, IP geolocation,
and RDAP domain registration intelligence.
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.link_origin_service import LinkOriginService

logger = logging.getLogger(__name__)
router = APIRouter()


class OriginRequest(BaseModel):
    url: str = Field(..., description="Target URL or domain to investigate for infrastructure origin")


@router.post("/origin-intelligence")
def get_origin_intelligence(payload: OriginRequest):
    raw_url = payload.url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="Target URL cannot be empty.")

    try:
        intelligence = LinkOriginService.analyze(raw_url)
        return intelligence
    except Exception:
        logger.exception("Link origin analysis failed")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while analyzing link origin."
        )
