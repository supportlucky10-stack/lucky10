import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User, UserRole
from app.models.bank_details import BankDetails
from app.models.game_result import GameResult
from app.models.ticket import Ticket, BetItem
from app.models.payout import PayoutRequest
from app.models.issue import IssueTicket
from app.models.transaction import TransactionLog
from app.schemas.result import GameResultPublishSchema
from app.schemas.payout import PayoutRequestCreate

router = APIRouter(prefix="/api/admin", tags=["Admin Domain"])

@router.get("/users")
def get_all_users(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == UserRole.CUSTOMER).all()
    result = []
    for u in users:
        bank = None
        if u.bank_details:
            bank = {
                "accountHolderName": u.bank_details.account_holder_name,
                "accountNo": u.bank_details.account_number,
                "bankName": u.bank_details.bank_name,
                "ifsc": u.bank_details.ifsc,
                "branchName": u.bank_details.branch_name,
                "updatedAt": u.bank_details.updated_at.strftime("%Y-%m-%d") if u.bank_details.updated_at else "",
            }
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "username": u.username,
            "balance": u.balance,
            "bankDetails": bank,
            "createdAt": u.created_at.strftime("%Y-%m-%d") if u.created_at else "",
        })
    return result

@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.delete("/users")
def clear_all_users(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    db.query(User).filter(User.role == UserRole.CUSTOMER).delete(synchronize_session=False)
    db.commit()
    return {"message": "All users deleted successfully"}

@router.post("/results")
def publish_results(req: GameResultPublishSchema, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if result already exists for slot today
    existing = db.query(GameResult).filter(
        GameResult.date == today_str,
        GameResult.game_slot == req.gameSlot
    ).first()

    compliments_json = json.dumps(req.compliments or [])

    if existing:
        existing.prize1 = req.prize1
        existing.prize2 = req.prize2
        existing.prize3 = req.prize3
        existing.prize4 = req.prize4
        existing.prize5 = req.prize5 or ""
        existing.compliments_json = compliments_json
        existing.published_at = datetime.now(timezone.utc)
        target_res = existing
    else:
        target_res = GameResult(
            id=f"res_{int(datetime.now().timestamp() * 1000)}",
            date=today_str,
            game_slot=req.gameSlot,
            prize1=req.prize1,
            prize2=req.prize2,
            prize3=req.prize3,
            prize4=req.prize4,
            prize5=req.prize5 or "",
            compliments_json=compliments_json,
            published_at=datetime.now(timezone.utc),
        )
        db.add(target_res)

    db.commit()
    db.refresh(target_res)
    return {
        "id": target_res.id,
        "date": target_res.date,
        "gameSlot": target_res.game_slot,
        "prize1": target_res.prize1,
        "prize2": target_res.prize2,
        "prize3": target_res.prize3,
        "prize4": target_res.prize4,
        "prize5": target_res.prize5 or "",
        "compliments": req.compliments,
        "publishedAt": target_res.published_at.isoformat(),
    }

@router.get("/payouts")
def get_payout_logs(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(PayoutRequest).order_by(PayoutRequest.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "userId": p.user_id,
            "userName": p.user_name,
            "amount": p.amount,
            "bankAccount": p.bank_account,
            "status": p.status,
            "date": p.created_at.strftime("%Y-%m-%d") if p.created_at else "",
        }
        for p in logs
    ]

@router.post("/payouts/{user_id}")
def process_user_payout(user_id: str, req: PayoutRequestCreate, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    bank_str = f"{user.bank_details.ifsc} - {user.bank_details.account_number}" if user.bank_details else "Bank Pending"
    new_log = PayoutRequest(
        id=f"pay_{int(datetime.now().timestamp() * 1000)}",
        user_id=user.id,
        user_name=user.name,
        amount=req.amount,
        bank_account=bank_str,
        status="SUCCESS",
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_log)

    txn = TransactionLog(
        id=f"TXN_{uuid.uuid4().hex[:6].upper()}",
        user_id=user.id,
        user_name=user.name,
        type="Bank Transfer (Payout)",
        amount=f"₹ {req.amount:.0f}",
        account=bank_str,
        status="SUCCESS",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(txn)

    db.commit()
    db.refresh(new_log)
    return {
        "id": new_log.id,
        "userId": new_log.user_id,
        "userName": new_log.user_name,
        "amount": new_log.amount,
        "bankAccount": new_log.bank_account,
        "status": new_log.status,
        "date": new_log.created_at.strftime("%Y-%m-%d"),
    }

@router.get("/transactions")
def get_transactions(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    txns = db.query(TransactionLog).order_by(TransactionLog.timestamp.desc()).all()
    return [
        {
            "id": t.id,
            "user": t.user_name,
            "type": t.type,
            "amount": t.amount,
            "account": t.account,
            "status": t.status,
            "date": t.timestamp.strftime("%Y-%m-%d") if t.timestamp else "",
            "timestamp": t.timestamp.strftime("%Y-%m-%d %I:%M %p") if t.timestamp else "",
        }
        for t in txns
    ]

@router.get("/issues")
def get_all_issues(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    issues = db.query(IssueTicket).order_by(IssueTicket.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "userName": i.user_name,
            "userEmail": i.user_email,
            "category": i.category,
            "description": i.description,
            "attachment": i.attachment,
            "date": i.created_at.strftime("%Y-%m-%d %I:%M %p") if i.created_at else "",
            "status": i.status,
        }
        for i in issues
    ]

@router.put("/issues/{issue_id}")
def update_issue_status(issue_id: str, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    issue = db.query(IssueTicket).filter(IssueTicket.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = "RESOLVED" if issue.status == "PENDING" else "PENDING"
    issue.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {
        "id": issue.id,
        "status": issue.status,
    }

@router.get("/reports")
def get_reports(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    tickets = db.query(Ticket).all()
    payouts = db.query(PayoutRequest).all()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_tickets = [t for t in tickets if t.placed_at and t.placed_at.strftime("%Y-%m-%d") == today_str]
    today_payouts = [p for p in payouts if p.created_at and p.created_at.strftime("%Y-%m-%d") == today_str]

    today_gross = sum(t.total_amount for t in today_tickets)
    today_payout_amount = sum(p.amount for p in today_payouts)
    today_net = today_gross - today_payout_amount

    return {
        "todayStr": today_str,
        "todayGross": today_gross,
        "todayPayouts": today_payout_amount,
        "todayNet": today_net,
        "todayBetsCount": len(today_tickets),
    }
