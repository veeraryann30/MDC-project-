import os


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
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    GOOGLE_SAFE_BROWSING_API_KEY: str = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "")
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")
    IPINFO_API_KEY: str = os.getenv("IPINFO_API_KEY", "")

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
