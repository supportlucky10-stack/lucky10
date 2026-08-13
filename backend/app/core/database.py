import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("postgresql"):
    connect_args = {"connect_timeout": 3}
elif db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    try:
        raw_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        folder = os.path.dirname(os.path.abspath(raw_path))
        if folder:
            os.makedirs(folder, exist_ok=True)
    except Exception as e:
        print(f"[DB Init] Directory check note: {e}")

is_vercel = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or os.getenv("VERCEL_URL"))

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
except Exception as err:
    print(f"[DB Init] Primary connection failed ({err}), falling back to SQLite in temp dir")
    tmp_file = os.path.join(tempfile.gettempdir(), "lucky10.db").replace("\\", "/")
    db_url = f"sqlite:///{tmp_file}" if tmp_file.startswith("/") else f"sqlite:///{tmp_file}"
    connect_args = {"check_same_thread": False}
    try:
        os.makedirs(os.path.dirname(tmp_file), exist_ok=True)
    except Exception:
        pass
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
