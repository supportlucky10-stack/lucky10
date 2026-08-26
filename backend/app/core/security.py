import hashlib
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings

try:
    import argon2
    _ph = argon2.PasswordHasher()
except Exception:
    _ph = None

try:
    from passlib.context import CryptContext
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    _pwd_context = None

security_bearer = HTTPBearer(auto_error=False)

# ── Simple In-Memory Rate Limiter for Auth Endpoints ─────────────────────────
_login_attempts = defaultdict(list)

def check_rate_limit(request: Request, max_requests: int = 15, window_seconds: int = 60):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    attempts = _login_attempts[client_ip]
    _login_attempts[client_ip] = [t for t in attempts if now - t < window_seconds]
    if len(_login_attempts[client_ip]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login requests. Please wait a minute before trying again.",
        )
    _login_attempts[client_ip].append(now)

# ── Secure Password Hashing (Argon2id / bcrypt + Legacy SHA-256 Migration) ────

def get_password_hash(password: str) -> str:
    """Hash password using Argon2id (or bcrypt / secure SHA-256 fallback)."""
    if _ph is not None:
        try:
            return _ph.hash(password)
        except Exception:
            pass
    if _pwd_context is not None:
        try:
            return _pwd_context.hash(password[:72])
        except Exception:
            pass
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}:{hashed}"


def verify_and_update_password(plain_password: str, hashed_password: str) -> Tuple[bool, Optional[str]]:
    """
    Verify password against stored hash.
    If stored hash is in legacy SHA-256 format (salt:hash), verifies legacy format
    and returns (True, new_argon2_hash) for transparent automatic migration.
    """
    if not hashed_password or not plain_password:
        return False, None

    # Argon2id hash format check
    if hashed_password.startswith("$argon2"):
        if _ph is not None:
            try:
                valid = _ph.verify(hashed_password, plain_password)
                return valid, None
            except Exception:
                return False, None

    # Bcrypt hash format check
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        if _pwd_context is not None:
            try:
                valid = _pwd_context.verify(plain_password, hashed_password)
                # Rehash to Argon2id if available
                new_hash = get_password_hash(plain_password) if (_ph is not None) else None
                return valid, new_hash
            except Exception:
                return False, None

    # Legacy SHA-256 format check (salt:hash)
    if ":" in hashed_password and not hashed_password.startswith("$"):
        try:
            salt, stored_hash = hashed_password.split(":", 1)
            candidate = hashlib.sha256((salt + plain_password).encode("utf-8")).hexdigest()
            if secrets.compare_digest(candidate, stored_hash):
                new_hash = get_password_hash(plain_password)
                return True, new_hash
        except Exception:
            return False, None

    return False, None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    valid, _ = verify_and_update_password(plain_password, hashed_password)
    return valid

# ── JWT Tokens ────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None

# ── FastAPI Auth Dependencies ─────────────────────────────────────────────────

def get_current_user_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

from app.core.database import get_db
from app.models.user import User, UserRole

def get_current_customer(
    payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
) -> User:
    if payload.get("role") not in ("CUSTOMER", "ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")

    if hasattr(user, "is_active") and user.is_active is False:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is deactivated. Please contact administrator.")

    return user

def require_customer_for_betting(
    payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
) -> User:
    role_str = str(payload.get("role", "")).upper()
    if role_str == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System Admin is not permitted to place bets. Admin account is for management and reports only.",
        )
    return get_current_customer(payload=payload, db=db)

def get_current_admin(
    payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
) -> User:
    role_str = str(payload.get("role", "")).upper()
    if role_str != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter(User.role == UserRole.ADMIN).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    user_role_str = str(getattr(user.role, "value", user.role)).upper()
    if user_role_str != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
    if hasattr(user, "is_active") and user.is_active is False:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is deactivated.")
        
    return user
