import os


def _load_dotenv() -> None:
    """
    Load KEY=value pairs from a `.env` file in the project root (dependency-free).
    Real environment variables always win, so hosting dashboards (Render, etc.) are never overridden.
    Quotes, `export` prefixes, comments and a UTF-8 BOM are handled. The file is git-ignored.
    """
    if os.getenv("CTP_SKIP_DOTENV"):  # set by the test suite so tests never use real keys or spend API quota
        return
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    path = os.path.join(root, ".env")
    try:
        with open(path, encoding="utf-8-sig") as fh:
            lines = fh.read().splitlines()
    except OSError:
        return
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if not key or key in os.environ:
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        elif " #" in value:
            value = value.split(" #", 1)[0].rstrip()
        os.environ[key] = value


_load_dotenv()


def _secret(name: str) -> str:
    """API keys are whitespace-trimmed: a trailing newline from a pasted value breaks HTTP headers."""
    return os.getenv(name, "").strip()


def _csv(name: str, default: str) -> list:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


class Settings:
    PROJECT_NAME: str = "Catch the Phish"
    TAGLINE: str = "Don't Click. Check First."
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # "production" turns on strict behaviour: a real AUTH_SECRET_KEY is required,
    # demo data and the demo admin account are never seeded.
    APP_ENV: str = os.getenv("APP_ENV", "development").lower()
    IS_PRODUCTION: bool = os.getenv("APP_ENV", "development").lower() == "production"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./catch_the_phish.db")

    # Optional Threat Intelligence API Keys
    VIRUSTOTAL_API_KEY: str = _secret("VIRUSTOTAL_API_KEY")
    GOOGLE_SAFE_BROWSING_API_KEY: str = _secret("GOOGLE_SAFE_BROWSING_API_KEY")
    ABUSEIPDB_API_KEY: str = _secret("ABUSEIPDB_API_KEY")
    IPINFO_API_KEY: str = _secret("IPINFO_API_KEY")

    # Unified threat-detection engine (all optional: a missing key is reported honestly as
    # "not configured" in every result, never silently treated as "clean").
    GOOGLE_WEB_RISK_API_KEY: str = _secret("GOOGLE_WEB_RISK_API_KEY")
    URLHAUS_AUTH_KEY: str = _secret("URLHAUS_AUTH_KEY")      # abuse.ch Auth-Key (free)
    URLSCAN_API_KEY: str = _secret("URLSCAN_API_KEY")
    GROQ_API_KEY: str = _secret("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()

    # Outbound API budgets (calls per minute) so the platform stays inside each provider's free tier.
    VT_REQUESTS_PER_MINUTE: int = int(os.getenv("VT_REQUESTS_PER_MINUTE", "4"))
    WEB_RISK_REQUESTS_PER_MINUTE: int = int(os.getenv("WEB_RISK_REQUESTS_PER_MINUTE", "60"))
    URLHAUS_REQUESTS_PER_MINUTE: int = int(os.getenv("URLHAUS_REQUESTS_PER_MINUTE", "30"))
    URLSCAN_SEARCH_PER_MINUTE: int = int(os.getenv("URLSCAN_SEARCH_PER_MINUTE", "20"))
    URLSCAN_SUBMIT_PER_MINUTE: int = int(os.getenv("URLSCAN_SUBMIT_PER_MINUTE", "5"))
    GROQ_REQUESTS_PER_MINUTE: int = int(os.getenv("GROQ_REQUESTS_PER_MINUTE", "20"))
    INTEL_CACHE_TTL_SECONDS: int = int(os.getenv("INTEL_CACHE_TTL_SECONDS", "3600"))
    INTEL_TIMEOUT_SECONDS: float = float(os.getenv("INTEL_TIMEOUT_SECONDS", "6"))

    # Stricter per-IP limit for the scan endpoints (they fan out to paid/limited third-party APIs).
    SCAN_RATE_LIMIT_PER_MINUTE: int = int(os.getenv("SCAN_RATE_LIMIT_PER_MINUTE", "20"))

    # CORS: comma-separated list of allowed browser origins, e.g.
    # CORS_ORIGINS=https://catch-the-phish.vercel.app
    # Never "*": the API accepts credentials (bearer tokens).
    CORS_ORIGINS: list = _csv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    )

    # Upload / payload limits
    MAX_UPLOAD_BYTES: int = int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))

    # Simple per-IP rate limit for expensive POST endpoints (requests per minute)
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))


settings = Settings()
