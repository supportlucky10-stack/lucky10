import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, customer, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lucky10")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack FastAPI backend for Lucky10",
    version="1.0.0",
)

# Global Exception Handler so any unhandled Python exception logs details silently and returns sanitized JSON
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"[Lucky10 Global Error] {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )

# Configure CORS based on environment
raw_origins = [o.strip().rstrip('/') for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

is_prod = (
    os.getenv("ENVIRONMENT", "").lower() in ("production", "prod")
    or os.getenv("RAILWAY_ENVIRONMENT") is not None
)

if is_prod and "*" in raw_origins:
    logger.warning("[Lucky10 CORS Warning] Wildcard '*' removed from ALLOWED_ORIGINS in production")
    raw_origins = [o for o in raw_origins if o != "*"]

origins = raw_origins if raw_origins else ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import get_db

# Structured Request Logging Middleware (Never logs sensitive tokens/passwords)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(f"[HTTP] {request.method} {request.url.path} -> {response.status_code} ({duration_ms:.2f}ms)")
    return response

# Register Routers (with /api prefix)
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(admin.router)

@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"[Lucky10 Health Check DB Error]: {e}")
        db_status = "disconnected"
    return {
        "message": "Lucky10 Backend OK",
        "status": "active",
        "database": db_status,
    }

@app.get("/")
def root(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"
    return {
        "message": "Lucky10 Backend OK",
        "status": "active",
        "database": db_status,
    }


@app.get('/api/health/db-timing')
def health_db_timing(db: Session = Depends(get_db)):
    start = time.perf_counter()
    db.execute(text('SELECT 1')).scalar()
    db_ms = (time.perf_counter() - start) * 1000
    return {'database': 'connected', 'db_query_ms': round(db_ms, 2)}

