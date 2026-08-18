import os
import tempfile

raw_db_url = os.getenv("DATABASE_URL", "").strip()

# Strip accidental prefix if user pasted "DATABASE_URL postgresql://..."
if raw_db_url.startswith("DATABASE_URL"):
    raw_db_url = raw_db_url.replace("DATABASE_URL", "", 1).strip()
    if raw_db_url.startswith("="):
        raw_db_url = raw_db_url[1:].strip()

# Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

if raw_db_url:
    _db_url = raw_db_url
else:
    # Default to local sqlite file for explicit local dev if DATABASE_URL is empty
    _db_url = "sqlite:///lucky10.db"

def _get_int(key: str, default: int) -> int:
    """Safely read an env var as int, falling back to default if missing or empty."""
    val = os.getenv(key, "").strip()
    try:
        return int(val) if val else default
    except (ValueError, TypeError):
        return default

def _get_str(key: str, default: str) -> str:
    """Safely read an env var as str, falling back to default if missing or empty."""
    val = os.getenv(key, "").strip()
    return val if val else default


class Settings:
    PROJECT_NAME: str = "Lucky10 API"
    DATABASE_URL: str = _db_url
    JWT_SECRET_KEY: str = _get_str("JWT_SECRET_KEY", "lucky10-super-secret-jwt-key-change-in-production-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _get_int("ACCESS_TOKEN_EXPIRE_MINUTES", 1440)  # 24 hours
    ALLOWED_ORIGINS: str = _get_str("ALLOWED_ORIGINS", "*")


settings = Settings()
