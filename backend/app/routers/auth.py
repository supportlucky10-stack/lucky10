import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    verify_and_update_password,
    create_access_token,
    get_current_user_token,
    check_rate_limit,
)
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserAccountResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def safe_format_dt(val, fmt="%Y-%m-%d") -> str:
    if not val:
        return ""
    if isinstance(val, str):
        return val[:10] if fmt == "%Y-%m-%d" else val
    if hasattr(val, "strftime"):
        try:
            return val.strftime(fmt)
        except Exception:
            return str(val)
    return str(val)

def format_user_response(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "agencyName": user.name,
        "email": user.email,
        "username": user.username,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "mode": user.mode or "Commission (20%)",
        "isActive": user.is_active if hasattr(user, 'is_active') and user.is_active is not None else True,
        "createdAt": safe_format_dt(user.created_at, "%Y-%m-%d"),
    }

@router.post("/customer/register")
def register_customer(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request)
    if not req.name.strip() or not req.email.strip() or not req.password.strip():
        raise HTTPException(status_code=400, detail="Please fill in all fields to sign up")

    email_clean = req.email.strip().lower()
    name_clean = req.name.strip()
    username_clean = email_clean.split("@")[0] if "@" in email_clean else email_clean

    normalized_agency = " ".join(name_clean.split()).lower()
    existing_agency = db.query(User).filter(
        func.lower(func.trim(User.name)) == normalized_agency
    ).first()
    if existing_agency:
        raise HTTPException(status_code=400, detail="Agency name already exists.")

    existing = db.query(User).filter(
        (User.email == email_clean) | (User.username == username_clean)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email/username already exists")

    new_user = User(
        id=f"user_{int(datetime.now().timestamp() * 1000)}",
        name=name_clean,
        email=email_clean,
        username=username_clean,
        password_hash=get_password_hash(req.password.strip()),
        role=UserRole.CUSTOMER,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    user_dict = format_user_response(new_user)
    access_token = create_access_token(data={"sub": new_user.id, "role": "CUSTOMER"})
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

@router.post("/customer/login")
def login_customer(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request)
    input_str = req.username.strip()
    p_input = req.password.strip()

    user = db.query(User).filter(
        (User.username.ilike(input_str)) |
        (User.name.ilike(input_str)) |
        (User.email.ilike(input_str))
    ).first()

    is_prod = os.getenv("ENVIRONMENT", "").lower() in ("production", "prod") or os.getenv("RAILWAY_ENVIRONMENT") is not None
    valid_password = False

    if user:
        is_valid, new_hash = verify_and_update_password(p_input, user.password_hash)
        if is_valid:
            valid_password = True
            if new_hash:
                user.password_hash = new_hash
                db.commit()

    if not user or not valid_password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if hasattr(user, 'is_active') and user.is_active is False:
        raise HTTPException(status_code=403, detail="Your account is deactivated. Please contact administrator.")

    user_dict = format_user_response(user)
    access_token = create_access_token(data={"sub": user.id, "role": user.role.value if hasattr(user.role, 'value') else str(user.role)})
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

@router.post("/admin/login")
def login_admin(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request)
    u_input = req.username.strip().lower()
    p_input = req.password.strip()

    user = db.query(User).filter(User.role == UserRole.ADMIN).filter(
        (User.username == u_input) | (User.email == u_input)
    ).first()

    valid_password = False
    if user:
        is_valid, new_hash = verify_and_update_password(p_input, user.password_hash)
        if is_valid:
            valid_password = True
            if new_hash:
                user.password_hash = new_hash
                db.commit()

    if not user or not valid_password:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    if hasattr(user, 'is_active') and user.is_active is False:
        raise HTTPException(status_code=403, detail="Your admin account is deactivated. Please contact administrator.")

    user_dict = format_user_response(user)
    access_token = create_access_token(data={"sub": user.id, "role": "ADMIN"})
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

@router.get("/me")
def get_me(token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    user_id = token_payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return format_user_response(user)
