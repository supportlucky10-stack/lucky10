import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings, sanitize_db_url

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

engine_kwargs = {"connect_args": connect_args, "pool_pre_ping": True}
if db_url.startswith("postgresql"):
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 5,
        "pool_recycle": 180,
    })

try:
    engine = create_engine(db_url, **engine_kwargs)
    with engine.connect() as conn:
        pass
except Exception as err:
    safe_url = sanitize_db_url(db_url)
    print(f"[FATAL DB ERROR] Primary database connection to '{safe_url}' failed: {err}")
    if db_url.startswith("sqlite"):
        # For local sqlite, create engine without strict initial connection check
        engine = create_engine(db_url, **engine_kwargs)
    else:
        raise RuntimeError(f"Database connection failed for '{safe_url}': {err}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
