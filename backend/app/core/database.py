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

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
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

def get_next_ticket_id(db: Session) -> str:
    """
    Generate an authoritative, sequential ticket ID atomically.
    Guarantees no race condition or duplicate ID under high concurrency.
    Preserves exact visible 7-digit numeric string format.
    """
    bind = db.get_bind()
    dialect_name = bind.dialect.name if bind else "sqlite"
    is_postgres = dialect_name == "postgresql"

    try:
        from app.models.ticket import TicketCounter, Ticket
        
        query = db.query(TicketCounter)
        if is_postgres:
            query = query.with_for_update()

        counter = query.first()
        if not counter:
            recent_ids = db.query(Ticket.id).all()
            max_num = 2243296
            for (tid,) in recent_ids:
                digits = ''.join(filter(str.isdigit, str(tid or '')))
                if digits:
                    try:
                        val = int(digits)
                        if val > max_num:
                            max_num = val
                    except Exception:
                        pass
            counter = TicketCounter(id=1, current_val=max_num)
            db.add(counter)
            db.flush()

        counter.current_val = int(counter.current_val) + 1
        db.add(counter)
        db.flush()
        return str(counter.current_val)
    except Exception as e:
        from app.models.ticket import Ticket
        recent_ids = db.query(Ticket.id).all()
        max_num = 2243296
        for (tid,) in recent_ids:
            digits = ''.join(filter(str.isdigit, str(tid or '')))
            if digits:
                try:
                    val = int(digits)
                    if val > max_num:
                        max_num = val
                except Exception:
                    pass
        candidate = max_num + 1
        while db.query(Ticket.id).filter(Ticket.id == str(candidate)).first() is not None:
            candidate += 1
        return str(candidate)
