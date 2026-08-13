import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user_token
from app.models.user import User, UserRole
from app.models.bank_details import BankDetails
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserAccountResponse, BankDetailsSchema

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def format_user_response(user: User) -> dict:
    bank = None
    if user.bank_details:
        bank = {
            "accountHolderName": user.bank_details.account_holder_name,
            "accountNo": user.bank_details.account_number,
            "bankName": user.bank_details.bank_name,
            "ifsc": user.bank_details.ifsc,
            "branchName": user.bank_details.branch_name,
            "updatedAt": user.bank_details.updated_at.strftime("%Y-%m-%d") if user.bank_details.updated_at else "",
        }
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "balance": user.balance,
        "bankDetails": bank,
        "createdAt": user.created_at.strftime("%Y-%m-%d") if user.created_at else "",
    }

@router.post("/customer/register")
def register_customer(req: RegisterRequest, db: Session = Depends(get_db)):
    if not req.name.strip() or not req.email.strip() or not req.password.strip():
        raise HTTPException(status_code=400, detail="Please fill in all fields to sign up")

    email_clean = req.email.strip().lower()
    name_clean = req.name.strip()
    username_clean = email_clean.split("@")[0] if "@" in email_clean else email_clean

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
        balance=1000.0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    user_dict = format_user_response(new_user)
    access_token = create_access_token(data={"sub": new_user.id, "role": "CUSTOMER"})
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

@router.post("/customer/login")
def login_customer(req: LoginRequest, db: Session = Depends(get_db)):
    u_input = req.username.strip().lower()
    p_input = req.password.strip()

    user = db.query(User).filter(
        (User.username == u_input) | (User.email == u_input) | (User.name == req.username.strip())
    ).first()

    if not user or not verify_password(p_input, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user_dict = format_user_response(user)
    access_token = create_access_token(data={"sub": user.id, "role": user.role.value if hasattr(user.role, 'value') else str(user.role)})
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

@router.post("/admin/login")
def login_admin(req: LoginRequest, db: Session = Depends(get_db)):
    u_input = req.username.strip().lower()
    p_input = req.password.strip()

    user = db.query(User).filter(User.role == UserRole.ADMIN).filter(
        (User.username == u_input) | (User.email == u_input)
    ).first()

    if not user or not verify_password(p_input, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials. Use admin / admin123")

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
