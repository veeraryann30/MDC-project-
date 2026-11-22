from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings


def _normalize_database_url(url: str) -> str:
    """Hosts hand out 'postgres://' or 'postgresql://'; SQLAlchemy needs the psycopg2 driver named."""
    url = (url or "").strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _normalize_database_url(settings.DATABASE_URL)
IS_SQLITE = DATABASE_URL.startswith("sqlite")

if IS_SQLITE:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # pool_pre_ping: free Postgres hosts close idle connections; reconnect instead of failing a request.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300, pool_size=5, max_overflow=5)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema_upgrades():
    """
    Lightweight, additive migration: ``create_all`` never alters existing tables, so columns added
    after a database was first created are added here (idempotent; works on SQLite and PostgreSQL).
    """
    from sqlalchemy import inspect, text

    wanted = {
        "scan_records": [("verdict", "VARCHAR(20)"), ("scan_type", "VARCHAR(10)"), ("engine_report", "JSON")],
    }
    insp = inspect(engine)
    with engine.begin() as conn:
        for table, cols in wanted.items():
            if table not in insp.get_table_names():
                continue
            existing = {c["name"] for c in insp.get_columns(table)}
            for name, ddl in cols:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
