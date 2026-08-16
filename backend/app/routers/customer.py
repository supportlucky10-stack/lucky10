import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_customer
from app.models.user import User
from app.models.bank_details import BankDetails
from app.models.game_result import GameResult
from app.models.ticket import Ticket, BetItem
from app.models.issue import IssueTicket
from app.models.transaction import TransactionLog
from app.schemas.user import BankDetailsSchema, UserAccountResponse
from app.schemas.ticket import TicketCreateSchema, PlacedTicketResponse, BetItemSchema
from app.schemas.result import GameResultResponse
from app.schemas.issue import IssueCreateSchema, IssueResponseSchema

router = APIRouter(prefix="/api/customer", tags=["Customer Domain"])

def format_ticket(ticket: Ticket) -> dict:
    cust_name = getattr(ticket, "customer_name", "") or ""
    if cust_name.lower() == "customer":
        cust_name = ""
    user_name = ticket.user.name if getattr(ticket, "user", None) else ""
    agency_name = ticket.user.username if getattr(ticket, "user", None) else ""
    return {
        "id": ticket.id,
        "ticketId": ticket.id,
        "userId": ticket.user_id,
        "userName": user_name,
        "agencyName": agency_name,
        "customerName": cust_name,
        "gameSlot": ticket.game_slot,
        "items": [
            {
                "id": item.id,
                "number": item.number,
                "count": item.count,
                "type": item.type,
                "unitPrice": item.unit_price,
                "totalAmount": item.total_amount,
            }
            for item in ticket.items
        ],
        "totalAmount": ticket.total_amount,
        "placedAt": (ticket.placed_at.replace(tzinfo=timezone.utc) if ticket.placed_at.tzinfo is None else ticket.placed_at).isoformat() if ticket.placed_at else datetime.now(timezone.utc).isoformat(),
        "status": ticket.status,
        "winAmount": ticket.win_amount,
    }

def format_result(res: GameResult) -> dict:
    try:
        compliments = json.loads(res.compliments_json)
    except Exception:
        compliments = []

    return {
        "id": res.id,
        "date": res.date,
        "gameSlot": res.game_slot,
        "prize1": res.prize1,
        "prize2": res.prize2,
        "prize3": res.prize3,
        "prize4": res.prize4,
        "prize5": res.prize5 or "",
        "compliments": compliments,
        "publishedAt": res.published_at.isoformat() if res.published_at else "",
    }

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

def check_user_active(user: Optional[User]) -> User:
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if hasattr(user, "is_active") and user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Please contact administrator."
        )
    return user

def format_user_account(user: User) -> dict:
    bank = None
    if user.bank_details:
        bank = {
            "accountHolderName": user.bank_details.account_holder_name or "",
            "accountNo": user.bank_details.account_number or "",
            "bankName": user.bank_details.bank_name or "",
            "ifsc": user.bank_details.ifsc or "",
            "branchName": user.bank_details.branch_name or "",
            "updatedAt": safe_format_dt(user.bank_details.updated_at, "%Y-%m-%d"),
        }
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "balance": float(user.balance) if user.balance is not None else 0.0,
        "isActive": user.is_active if hasattr(user, 'is_active') and user.is_active is not None else True,
        "bankDetails": bank,
        "createdAt": safe_format_dt(user.created_at, "%Y-%m-%d"),
    }

@router.get("/profile")
def get_customer_profile(payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    user = check_user_active(db.query(User).filter(User.id == payload["sub"]).first())
    return format_user_account(user)

@router.get("/balance")
def get_customer_balance(payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    user = check_user_active(db.query(User).filter(User.id == payload["sub"]).first())
    return {"balance": user.balance}

@router.get("/results/today")
def get_today_results(db: Session = Depends(get_db)):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    results = db.query(GameResult).filter(GameResult.date == today_str).all()
    out = {}
    for r in results:
        out[r.game_slot] = format_result(r)
    return out

@router.get("/results/by-date")
def get_results_by_date(date: Optional[str] = None, db: Session = Depends(get_db)):
    target_date = date.strip() if date and date.strip() else datetime.now(timezone.utc).strftime("%Y-%m-%d")
    results = db.query(GameResult).filter(GameResult.date == target_date).all()
    out = {}
    for r in results:
        out[r.game_slot] = format_result(r)
    return out

@router.get("/results/all")
def get_all_results(db: Session = Depends(get_db)):
    results = db.query(GameResult).all()
    out = {}
    for r in results:
        key = f"{r.date}_{r.game_slot}"
        out[key] = format_result(r)
    return out

@router.get("/results/previous")
def get_previous_results(db: Session = Depends(get_db)):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    results = db.query(GameResult).filter(GameResult.date != today_str).all()
    return [format_result(r) for r in results]

@router.post("/tickets")
def place_ticket(req: TicketCreateSchema, payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    user = check_user_active(db.query(User).filter(User.id == payload["sub"]).first())

    if not req.items or len(req.items) == 0:
        raise HTTPException(status_code=400, detail="Your bet slip is empty!")

    if req.actionType == "PAY" and user.balance < req.totalAmount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance (Available: ₹{user.balance}). Total needed: ₹{req.totalAmount}",
        )

    # Deduct balance if paying
    if req.actionType == "PAY":
        user.balance -= req.totalAmount

    ticket_prefix = "PAY" if req.actionType == "PAY" else "TKT"
    ticket_id = f"{ticket_prefix}{int(datetime.now().timestamp() * 1000) % 900000 + 100000}"

    c_name = req.customerName.strip() if req.customerName and req.customerName.strip() else ""
    if c_name.lower() == "customer":
        c_name = ""

    new_ticket = Ticket(
        id=ticket_id,
        user_id=user.id,
        customer_name=c_name,
        game_slot=req.gameSlot,
        total_amount=req.totalAmount,
        status="PENDING",
        placed_at=datetime.now(timezone.utc),
    )
    db.add(new_ticket)

    for item in req.items:
        bet = BetItem(
            id=f"bet_{uuid.uuid4().hex[:8]}",
            ticket_id=ticket_id,
            number=item.number,
            count=item.count,
            type=item.type,
            unit_price=item.unitPrice,
            total_amount=item.totalAmount,
        )
        db.add(bet)

    # Add transaction log if paid
    if req.actionType == "PAY":
        txn = TransactionLog(
            id=f"TXN_{uuid.uuid4().hex[:6].upper()}",
            user_id=user.id,
            user_name=user.name,
            type="Ticket Purchase",
            amount=f"₹ {req.totalAmount:.0f}",
            account="Wallet Deposit",
            status="SUCCESS",
            timestamp=datetime.now(timezone.utc),
        )
        db.add(txn)

    db.commit()
    db.refresh(new_ticket)
    return format_ticket(new_ticket)

@router.get("/tickets")
def get_user_tickets(payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    check_user_active(db.query(User).filter(User.id == payload["sub"]).first())
    tickets = db.query(Ticket).filter(Ticket.user_id == payload["sub"]).order_by(Ticket.placed_at.desc()).all()
    return [format_ticket(t) for t in tickets]

@router.get("/bank-details")
def get_bank_details(payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    check_user_active(db.query(User).filter(User.id == payload["sub"]).first())
    bank = db.query(BankDetails).filter(BankDetails.user_id == payload["sub"]).first()
    if not bank:
        return None
    return {
        "accountHolderName": bank.account_holder_name,
        "accountNo": bank.account_number,
        "bankName": bank.bank_name,
        "ifsc": bank.ifsc,
        "branchName": bank.branch_name,
        "updatedAt": bank.updated_at.strftime("%Y-%m-%d") if bank.updated_at else "",
    }

@router.put("/bank-details")
def update_bank_details(req: BankDetailsSchema, payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    user_id = payload["sub"]
    check_user_active(db.query(User).filter(User.id == user_id).first())
    bank = db.query(BankDetails).filter(BankDetails.user_id == user_id).first()

    today_date = datetime.now(timezone.utc)
    if bank:
        bank.account_holder_name = req.accountHolderName
        bank.account_number = req.accountNo
        bank.bank_name = req.bankName
        bank.ifsc = req.ifsc
        bank.branch_name = req.branchName
        bank.updated_at = today_date
    else:
        bank = BankDetails(
            id=f"bank_{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            account_holder_name=req.accountHolderName,
            account_number=req.accountNo,
            bank_name=req.bankName,
            ifsc=req.ifsc,
            branch_name=req.branchName,
            updated_at=today_date,
        )
        db.add(bank)

    db.commit()
    return {
        "accountHolderName": bank.account_holder_name,
        "accountNo": bank.account_number,
        "bankName": bank.bank_name,
        "ifsc": bank.ifsc,
        "branchName": bank.branch_name,
        "updatedAt": today_date.strftime("%Y-%m-%d"),
    }

@router.post("/issues")
def submit_issue(req: IssueCreateSchema, payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    user = check_user_active(db.query(User).filter(User.id == payload["sub"]).first())

    new_issue = IssueTicket(
        id=f"ISS_{int(datetime.now().timestamp() * 1000) % 900000 + 100000}",
        user_id=user.id,
        user_name=user.name,
        user_email=user.email,
        category=req.category,
        description=req.description,
        attachment=req.attachment,
        status="PENDING",
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return {
        "id": new_issue.id,
        "userName": new_issue.user_name,
        "userEmail": new_issue.user_email,
        "category": new_issue.category,
        "description": new_issue.description,
        "attachment": new_issue.attachment,
        "date": new_issue.created_at.strftime("%Y-%m-%d %I:%M %p"),
        "status": new_issue.status,
    }
