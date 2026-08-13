import os
from pydantic_settings import BaseSettings

# Detect Vercel environment
is_vercel = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or os.getenv("VERCEL_URL"))
raw_db_url = os.getenv("DATABASE_URL", "")

# On Vercel: always use /tmp SQLite (only writable path in serverless)
# Locally without DATABASE_URL: use local SQLite file
if is_vercel:
    default_db_url = "sqlite:////tmp/lucky10.db"
elif raw_db_url:
    default_db_url = raw_db_url
else:
    default_db_url = "sqlite:///./lucky10.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lucky10 API"
    DATABASE_URL: str = default_db_url
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "lucky10-super-secret-jwt-key-change-in-production-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")

    class Config:
        env_file = None if is_vercel else ".env"
        extra = "allow"

settings = Settings()
