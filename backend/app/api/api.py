from fastapi import APIRouter
from backend.app.api.endpoints import scan, history, dashboard, ml_stats, origin

api_router = APIRouter()

api_router.include_router(scan.router, tags=["Scanner"])
api_router.include_router(origin.router, tags=["Origin Intelligence"])
api_router.include_router(history.router, tags=["History"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
api_router.include_router(ml_stats.router, tags=["Machine Learning"])
