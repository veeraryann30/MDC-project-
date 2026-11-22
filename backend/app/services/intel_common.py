"""
Shared plumbing for every outbound threat-intelligence call:

* ``TTLCache``      - thread-safe LRU cache with expiry (saves API quota on repeat scans)
* ``RateBudget``    - sliding-window call budget so we never exceed a provider's free tier
* ``HealthRegistry``- real per-provider counters/latency/last error, surfaced on the dashboard
* ``make_result``   - the one result shape every provider returns

Nothing here ever fabricates a result: a provider that was not queried says so via ``status``.
"""

import threading
import time
from collections import OrderedDict, deque
from datetime import datetime, timezone
from typing import Any, Deque, Dict, Optional

# status values
OK = "ok"                      # provider answered with a usable result
NO_DATA = "no_data"            # provider answered: it has nothing on this URL (NOT proof of safety)
NOT_CONFIGURED = "not_configured"
RATE_LIMITED = "rate_limited"  # our own budget (or the provider's 429) stopped the call
ERROR = "error"                # timeout / HTTP error / bad response
SKIPPED = "skipped"            # deliberately not queried (bulk scan, unsafe target, ...)

# verdict values
MALICIOUS = "malicious"
SUSPICIOUS = "suspicious"
CLEAN = "clean"
UNKNOWN = "unknown"


class TTLCache:
    def __init__(self, ttl: float, max_items: int = 1000):
        self._ttl = ttl
        self._max = max_items
        self._data: "OrderedDict[str, tuple]" = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return None
            expires, value = entry
            if expires < time.monotonic():
                del self._data[key]
                return None
            self._data.move_to_end(key)
            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._data[key] = (time.monotonic() + self._ttl, value)
            self._data.move_to_end(key)
            while len(self._data) > self._max:
                self._data.popitem(last=False)


class RateBudget:
    """Allow at most ``max_calls`` per ``window`` seconds. ``max_calls <= 0`` disables the limit."""

    def __init__(self, max_calls: int, window: float = 60.0):
        self.max_calls = max_calls
        self.window = window
        self._hits: Deque[float] = deque()
        self._lock = threading.Lock()

    def allow(self) -> bool:
        if self.max_calls <= 0:
            return True
        now = time.monotonic()
        with self._lock:
            while self._hits and now - self._hits[0] > self.window:
                self._hits.popleft()
            if len(self._hits) >= self.max_calls:
                return False
            self._hits.append(now)
            return True


class HealthRegistry:
    """Counts what actually happened when each provider was called (never invented)."""

    def __init__(self):
        self._lock = threading.Lock()
        self._state: Dict[str, Dict[str, Any]] = {}

    def record(self, provider: str, status: str, latency_ms: Optional[int] = None, error: Optional[str] = None) -> None:
        # Only real attempts count; "skipped"/"not_configured" are not provider activity.
        if status in (NOT_CONFIGURED, SKIPPED):
            return
        with self._lock:
            st = self._state.setdefault(provider, {"ok": 0, "failed": 0, "rate_limited": 0})
            if status in (OK, NO_DATA):
                st["ok"] += 1
                st["last_error"] = None
            elif status == RATE_LIMITED:
                st["rate_limited"] += 1
            else:
                st["failed"] += 1
                st["last_error"] = redact(error or "")[:200]
            st["last_status"] = status
            st["last_checked"] = datetime.now(timezone.utc).isoformat()
            if latency_ms is not None:
                st["last_latency_ms"] = latency_ms

    def snapshot(self, provider: str) -> Dict[str, Any]:
        with self._lock:
            return dict(self._state.get(provider, {}))


health = HealthRegistry()


def redact(text: Any) -> str:
    """Replace any configured API key/token inside ``text`` so a secret can never reach a response or the UI."""
    from backend.app.core.config import settings
    out = str(text or "")
    for name in ("VIRUSTOTAL_API_KEY", "GOOGLE_WEB_RISK_API_KEY", "URLHAUS_AUTH_KEY", "URLSCAN_API_KEY",
                 "GROQ_API_KEY", "ABUSEIPDB_API_KEY", "IPINFO_API_KEY", "GOOGLE_SAFE_BROWSING_API_KEY"):
        secret = getattr(settings, name, "")
        if secret and len(secret) >= 8:
            out = out.replace(secret, "[redacted]")
    return out


def make_result(
    source: str,
    status: str,
    verdict: str = UNKNOWN,
    score: float = 0.0,
    note: str = "",
    details: Optional[Dict[str, Any]] = None,
    latency_ms: Optional[int] = None,
    reference: Optional[str] = None,
) -> Dict[str, Any]:
    """Uniform provider result. ``score`` is 0-100 and only meaningful when verdict is malicious/suspicious."""
    return {
        "source": source,
        "status": status,
        "verdict": verdict,
        "score": round(float(score), 1),
        "note": redact(note),
        "details": details or {},
        "latency_ms": latency_ms,
        "reference": reference,
    }
