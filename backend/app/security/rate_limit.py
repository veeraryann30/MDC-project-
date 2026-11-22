"""
Minimal in-memory, per-IP sliding-window rate limiter (no external dependencies).

Good enough for a single-instance deployment: it blunts scripted abuse of the scan
endpoints and password guessing on /auth. For multiple instances, use a shared store.
"""

import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.core.config import settings

WINDOW_SECONDS = 60
AUTH_LIMIT_PER_MINUTE = 10  # login / register attempts
# Endpoints that fan out to third-party APIs (or make urlscan.io visit a page) get a stricter bucket.
SCAN_PATH_SUFFIXES = ("/scan", "/scan/bulk", "/scan/qr", "/qr", "/scan/qr-json", "/qr/json", "/urlscan/submit")
BULK_COST = 5               # a bulk scan counts as this many requests


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, per_minute: int = 60):
        super().__init__(app)
        self.per_minute = per_minute
        self._hits: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        # Only throttle state-changing / expensive calls; reads and CORS preflights pass through.
        if request.method != "POST" or self.per_minute <= 0:
            return await call_next(request)

        path = request.url.path
        if "/auth/" in path:
            bucket, limit = "auth", AUTH_LIMIT_PER_MINUTE
        elif path.rstrip("/").endswith(SCAN_PATH_SUFFIXES):
            bucket = "scan"
            limit = min(self.per_minute, settings.SCAN_RATE_LIMIT_PER_MINUTE) if settings.SCAN_RATE_LIMIT_PER_MINUTE > 0 else self.per_minute
        else:
            bucket, limit = "post", self.per_minute
        key = (_client_ip(request), bucket)

        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > WINDOW_SECONDS:
            hits.popleft()
        if len(hits) >= limit:
            retry_after = max(1, int(WINDOW_SECONDS - (now - hits[0])))
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please wait a moment and try again."},
                headers={"Retry-After": str(retry_after)},
            )
        # A bulk scan does up to 25 analyses, so it uses up more of the allowance than a single scan.
        cost = BULK_COST if path.rstrip("/").endswith("/scan/bulk") else 1
        hits.extend([now] * cost)

        # Keep memory bounded.
        if len(self._hits) > 5000:
            for k in [k for k, v in self._hits.items() if not v or now - v[-1] > WINDOW_SECONDS]:
                self._hits.pop(k, None)

        return await call_next(request)
