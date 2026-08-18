import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("postgresql"):
    connect_args = {"connect_timeout": 10}
elif db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    try:
        raw_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        folder = os.path.dirname(os.path.abspath(raw_path))
        if folder:
            os.makedirs(folder, exist_ok=True)
    except Exception as e:
        print(f"[DB Init] Directory check note: {e}")

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
except Exception as err:
    print(f"[FATAL DB ERROR] Primary database connection to '{db_url}' failed: {err}")
    if db_url.startswith("sqlite"):
        # For local sqlite, create engine without strict initial connection check
        engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
    else:
        raise RuntimeError(f"Database connection failed for '{db_url}': {err}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
