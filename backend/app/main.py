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

# Configure CORS to permit all frontend origins (Vercel, custom domains, localhost)
raw_origins = [o.strip().rstrip('/') for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_origins=raw_origins if raw_origins and "*" not in raw_origins else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
import json
import asyncio
from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import get_db
from fastapi import WebSocket, WebSocketDisconnect, Query
from app.core.ws_manager import ws_manager
from app.core.security import decode_token
from app.core.game_timing import STANDARD_SLOTS, is_game_result_locked, get_ist_now, get_business_date

async def result_cutoff_monitor_task():
    """
    Background monitor that detects when game slot result lock cutoffs are reached in Asia/Kolkata (IST),
    and broadcasts a real-time RESULTS_LOCKED event to all connected admin and customer clients.
    """
    notified_slots_today = set()
    last_date = ""

    while True:
        try:
            await asyncio.sleep(1)
            now_ist = get_ist_now()
            today_str = get_business_date(now_ist)
            if today_str != last_date:
                notified_slots_today.clear()
                last_date = today_str

            for slot in STANDARD_SLOTS:
                if slot not in notified_slots_today and is_game_result_locked(slot, today_str, now_ist):
                    notified_slots_today.add(slot)
                    logger.info(f"[LUCKY10 LOCK] {slot} result cutoff reached at {now_ist.strftime('%H:%M:%S')} IST. Broadcasting RESULTS_LOCKED.")
                    await ws_manager.broadcast({
                        "type": "RESULTS_LOCKED",
                        "gameSlot": slot,
                        "date": today_str,
                        "istTime": now_ist.strftime("%H:%M:%S"),
                        "message": f"Results for {slot} are now LOCKED at cutoff."
                    })
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.debug(f"[Cutoff Monitor] Error: {e}")

@app.on_event("startup")
async def on_startup():
    try:
        loop = asyncio.get_running_loop()
        ws_manager.set_loop(loop)
        logger.info("[WebSocket] Manager event loop registered successfully.")
        asyncio.create_task(result_cutoff_monitor_task())
        logger.info("[Background Task] Result cutoff monitor started.")
    except Exception as e:
        logger.warning(f"[WebSocket] Startup event loop registration failed: {e}")

@app.websocket("/api/ws")
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    user_id = None
    role = "GUEST"
    if token:
        try:
            payload = decode_token(token)
            if payload:
                user_id = str(payload.get("sub", ""))
                role = str(payload.get("role", "CUSTOMER")).upper()
        except Exception:
            pass
    await ws_manager.connect(websocket, user_id=user_id, role=role)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG", "timestamp": time.time()}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id=user_id, role=role)
    except Exception as exc:
        logger.debug(f"[WebSocket] Connection closed with exception: {exc}")
        ws_manager.disconnect(websocket, user_id=user_id, role=role)

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

