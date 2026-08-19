import os
import re

raw_db_url = os.getenv("DATABASE_URL", "").strip()

# Strip accidental prefix if user pasted "DATABASE_URL postgresql://..."
if raw_db_url.startswith("DATABASE_URL"):
    raw_db_url = raw_db_url.replace("DATABASE_URL", "", 1).strip()
    if raw_db_url.startswith("="):
        raw_db_url = raw_db_url[1:].strip()

# Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

is_prod = (
    os.getenv("ENVIRONMENT", "").lower() in ("production", "prod")
    or os.getenv("RAILWAY_ENVIRONMENT") is not None
)

if raw_db_url:
    _db_url = raw_db_url
else:
    if is_prod:
        raise RuntimeError("[FATAL CONFIG ERROR] DATABASE_URL environment variable is missing in production!")
    _db_url = "sqlite:///lucky10.db"

def sanitize_db_url(url: str) -> str:
    """Redact user password from database connection strings for safe logging."""
    if not url:
        return ""
    return re.sub(r'(://[^:]+:)[^@]+(@)', r'\1***\2', url)

def _get_int(key: str, default: int) -> int:
    val = os.getenv(key, "").strip()
    try:
        return int(val) if val else default
    except (ValueError, TypeError):
        return default

def _get_str(key: str, default: str) -> str:
    val = os.getenv(key, "").strip()
    return val if val else default

jwt_secret = os.getenv("JWT_SECRET_KEY", "").strip()
if is_prod:
    if not jwt_secret or jwt_secret == "lucky10-super-secret-jwt-key-change-in-production-2026" or len(jwt_secret) < 16:
        raise RuntimeError("[FATAL CONFIG ERROR] A secure JWT_SECRET_KEY environment variable is required in production!")
else:
    if not jwt_secret:
        jwt_secret = "lucky10-super-secret-jwt-key-change-in-production-2026"


class Settings:
    PROJECT_NAME: str = "Lucky10 API"
    DATABASE_URL: str = _db_url
    JWT_SECRET_KEY: str = jwt_secret
    JWT_ALGORITHM: str = _get_str("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _get_int("ACCESS_TOKEN_EXPIRE_MINUTES", 1440)  # 24 hours
    ALLOWED_ORIGINS: str = _get_str("ALLOWED_ORIGINS", "*")


settings = Settings()
