from fastapi import APIRouter
from backend.app.api.endpoints import (
    scan,
    history,
    dashboard,
    ml_stats,
    origin,
    phish_trace,
    auth,
    scam,
    academy,
    feedback
)

api_router = APIRouter()

# Authentication & User Management
api_router.include_router(auth.router)

# URL & Infrastructure Scanning (Module 1 - Preserved & Upgraded)
api_router.include_router(scan.router, tags=["Scanner"])
api_router.include_router(feedback.router, tags=["Feedback"])
api_router.include_router(phish_trace.router, tags=["Phish Trace Infrastructure"])
api_router.include_router(origin.router, tags=["Origin Intelligence"])

# Multi-Channel Scam Detection & Scam DNA (Modules 2, 3, 4, 5, 6)
api_router.include_router(scam.router)

# Scam Awareness Academy (Module 8)
api_router.include_router(academy.router)

# Analytics, History & Telemetry (Modules 5 & 7)
api_router.include_router(history.router, tags=["History"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
api_router.include_router(ml_stats.router, tags=["Machine Learning"])
