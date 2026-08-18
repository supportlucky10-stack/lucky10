import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, customer, admin

# ── DB Init & Seed at import time (works in serverless where lifespan may not fire) ──
try:
    Base.metadata.create_all(bind=engine)
    from sqlalchemy import text
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN mode VARCHAR DEFAULT 'With Commission'"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE tickets ADD COLUMN customer_name VARCHAR DEFAULT 'Customer'"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE game_results ADD COLUMN prize6 VARCHAR DEFAULT ''"))
        except Exception:
            pass
    print("[Lucky10] DB tables ensured")
except Exception as e:
    print(f"[Lucky10] DB init warning: {e}")

try:
    from app.initial_seed import seed_db
    seed_db()
    print("[Lucky10] Seed complete")
except Exception as e:
    print(f"[Lucky10] Seed warning: {e}")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack FastAPI backend for Lucky10",
    version="1.0.0",
)

# Global Exception Handler so any unhandled Python exception returns clear JSON instead of Vercel 500 HTML
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Lucky10 Global Error] {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"}
    )

# Configure CORS based on environment
raw_origins = [o.strip().rstrip('/') for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

is_prod = (
    os.getenv("ENVIRONMENT", "").lower() in ("production", "prod")
    or os.getenv("RAILWAY_ENVIRONMENT") is not None
)

if is_prod and "*" in raw_origins:
    print("[Lucky10 CORS Warning] Wildcard '*' removed from ALLOWED_ORIGINS in production")
    raw_origins = [o for o in raw_origins if o != "*"]

origins = raw_origins if raw_origins else ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers (with /api prefix)
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(admin.router)

@app.get("/api/health")
def health():
    return {"message": "Lucky10 Backend OK", "status": "active"}

@app.get("/")
def root():
    return {"message": "Lucky10 Backend OK", "status": "active"}
