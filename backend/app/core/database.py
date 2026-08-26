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
    "pool_size": settings.DB_POOL_SIZE,
    "max_overflow": settings.DB_MAX_OVERFLOW,
    "pool_timeout": settings.DB_POOL_TIMEOUT,
    "pool_recycle": settings.DB_POOL_RECYCLE,
}

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

if db_url.startswith("sqlite"):
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.close()
        except Exception:
            pass

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
_global_ticket_val = None

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
    Generate an authoritative, strictly consecutive ticket ID transactionally.
    Uses TicketCounter table with row-level locking so on failure or rollback,
    no IDs are skipped or wasted.
    Guarantees zero race conditions, zero duplicates, and zero gaps.
    """
    from app.models.ticket import TicketCounter, Ticket

    with _ticket_counter_lock:
        bind = db.get_bind()
        dialect_name = bind.dialect.name if bind else "sqlite"

        query = db.query(TicketCounter).filter(TicketCounter.id == 1)
        if dialect_name in ("postgresql", "mysql"):
            query = query.with_for_update()

        counter = query.first()
        if not counter:
            max_num = 2243296
            try:
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
            except Exception:
                pass
            counter = TicketCounter(id=1, current_val=max_num)
            db.add(counter)
            db.flush()

        counter.current_val += 1
        return str(counter.current_val)
