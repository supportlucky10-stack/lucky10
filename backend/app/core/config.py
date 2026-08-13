import os
import tempfile

raw_db_url = os.getenv("DATABASE_URL", "").strip()

# Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

if raw_db_url:
    _db_url = raw_db_url
else:
    # Fallback to local / temp SQLite if DATABASE_URL is not set
    tmp_file = os.path.join(tempfile.gettempdir(), "lucky10.db").replace("\\", "/")
    _db_url = f"sqlite:///{tmp_file}" if tmp_file.startswith("/") else f"sqlite:///{tmp_file}"

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
