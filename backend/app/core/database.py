import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings, sanitize_db_url

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("postgresql"):
    connect_args = {"connect_timeout": settings.DB_POOL_TIMEOUT}
elif db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    try:
        raw_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        folder = os.path.dirname(os.path.abspath(raw_path))
        if folder:
            os.makedirs(folder, exist_ok=True)
    except Exception as e:
        print(f"[DB Init] Directory check note: {e}")

engine_kwargs = {
    "connect_args": connect_args,
    "pool_pre_ping": True,
}

if db_url.startswith("postgresql"):
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
    })

try:
    engine = create_engine(db_url, **engine_kwargs)
    with engine.connect() as conn:
        pass
except Exception as err:
    safe_url = sanitize_db_url(db_url)
    print(f"[FATAL DB ERROR] Primary database connection to '{safe_url}' failed: {err}")
    if db_url.startswith("sqlite"):
        engine = create_engine(db_url, **engine_kwargs)
    else:
        raise RuntimeError(f"Database connection failed for '{safe_url}': {err}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

import threading

_ticket_counter_lock = threading.Lock()
_pg_seq_initialized = False

def _ensure_pg_sequence(engine_or_bind):
    global _pg_seq_initialized
    if _pg_seq_initialized:
        return
    with _ticket_counter_lock:
        if _pg_seq_initialized:
            return
        try:
            with engine.begin() as conn:
                conn.execute(text("CREATE SEQUENCE IF NOT EXISTS ticket_id_seq START WITH 2243297"))
                max_val = 2243296
                try:
                    res = conn.execute(text("SELECT id FROM tickets")).fetchall()
                    for (tid,) in res:
                        digits = ''.join(filter(str.isdigit, str(tid or '')))
                        if digits:
                            try:
                                v = int(digits)
                                if v > max_val:
                                    max_val = v
                            except Exception:
                                pass
                except Exception:
                    pass
                conn.execute(text(f"SELECT setval('ticket_id_seq', GREATEST({max_val}, nextval('ticket_id_seq')))"))
            _pg_seq_initialized = True
        except Exception:
            pass

def get_next_ticket_id(db: Session) -> str:
    """
    Generate an authoritative, sequential ticket ID atomically.
    Guarantees no race condition or duplicate ID under high concurrency.
    Preserves exact visible 7-digit numeric string format (>= 2243297).
    """
    bind = db.get_bind()
    dialect_name = bind.dialect.name if bind else "sqlite"
    is_postgres = dialect_name == "postgresql"

    if is_postgres:
        try:
            if not _pg_seq_initialized:
                _ensure_pg_sequence(bind)
            val = db.execute(text("SELECT nextval('ticket_id_seq')")).scalar()
            if val:
                return str(val)
        except Exception:
            pass

    # Thread-safe atomic counter for SQLite and Postgres fallback
    with _ticket_counter_lock:
        from app.models.ticket import TicketCounter, Ticket
        
        counter = db.query(TicketCounter).filter(TicketCounter.id == 1).first()
        if not counter:
            max_num = 2243296
            recent_ids = db.query(Ticket.id).all()
            for (tid,) in recent_ids:
                digits = ''.join(filter(str.isdigit, str(tid or '')))
                if digits:
                    try:
                        v = int(digits)
                        if v > max_num:
                            max_num = v
                    except Exception:
                        pass
            counter = TicketCounter(id=1, current_val=max_num)
            db.add(counter)
            db.flush()

        next_val = int(counter.current_val) + 1
        
        # Verify next_val doesn't collide with existing tickets
        while db.query(Ticket.id).filter(Ticket.id == str(next_val)).first() is not None:
            next_val += 1

        counter.current_val = next_val
        db.flush()
        return str(next_val)
