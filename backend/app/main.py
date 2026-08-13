import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, customer, admin

# Create DB tables at import time (safe for serverless)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Lucky10] DB init warning: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed default admin, demo user, games, and results on startup
    try:
        from app.initial_seed import seed_db
        seed_db()
    except Exception as e:
        print(f"[Lucky10] Seed warning: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack FastAPI backend for Lucky10 Customer and Admin domains",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(admin.router)

@app.get("/api/health")
def health():
    return {"message": "Lucky10 FastAPI Backend Operating Normally", "status": "active"}

@app.get("/")
def root():
    return {"message": "Lucky10 FastAPI Backend Operating Normally", "status": "active"}
