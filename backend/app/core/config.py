import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lucky10 API"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./lucky10.db"
    )
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "lucky10-super-secret-jwt-key-change-in-production-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
