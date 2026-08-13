import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("postgresql"):
    connect_args = {"connect_timeout": 3}
elif db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

is_vercel = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") is not None

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback to SQLite DB (/tmp/lucky10.db for Vercel Serverless, ./lucky10.db for local dev)
    sqlite_path = "/tmp/lucky10.db" if is_vercel else "./lucky10.db"
    db_url = f"sqlite:///{sqlite_path}"
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
