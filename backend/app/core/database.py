import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("postgresql"):
    connect_args = {"connect_timeout": 2}
elif db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback to local SQLite database if PostgreSQL container/server is offline locally
    db_url = "sqlite:///./lucky10.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
