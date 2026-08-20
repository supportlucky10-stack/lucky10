import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload
from app.core.database import get_db
from app.core.security import get_current_admin, get_password_hash
from app.models.user import User, UserRole
from app.models.bank_details import BankDetails
from app.models.game_result import GameResult
from app.models.ticket import Ticket, BetItem
from app.models.payout import PayoutRequest
from app.models.issue import IssueTicket
from app.models.transaction import TransactionLog
from app.models.limit_rule import AgencyNumberLimit, BlockedNumberRule, GlobalLimitRule
from app.schemas.result import GameResultPublishSchema
from app.schemas.payout import PayoutRequestCreate
from app.schemas.user import UserCreateSchema
from app.schemas.limit_rule import AgencyLimitCreate, BlockedNumberCreate, GlobalLimitUpdate
from app.core.game_rules import evaluate_ticket_items, get_flat_compliments

router = APIRouter(prefix="/api/admin", tags=["Admin Domain"])

@router.get("/users")
def get_all_users(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).options(joinedload(User.bank_details)).filter(User.role == UserRole.CUSTOMER).all()
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
            "mode": getattr(u, "mode", None) or "With Commission",
            "balance": u.balance,
            "isActive": u.is_active if hasattr(u, 'is_active') and u.is_active is not None else True,
            "bankDetails": bank,
            "createdAt": u.created_at.strftime("%Y-%m-%d") if u.created_at else "",
        })
    return result

@router.post("/users")
def create_user(req: UserCreateSchema, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not req.agencyName or not req.agencyName.strip():
        raise HTTPException(status_code=400, detail="Agency Name is required")
    if not req.password or len(req.password.strip()) < 3:
        raise HTTPException(status_code=400, detail="Password must be at least 3 characters long")

    agency_name = req.agencyName.strip()
    username = (req.username.strip() if req.username and req.username.strip() else agency_name)
    slug = "".join(c for c in username.lower() if c.isalnum() or c == "_") or "agency"
    email = f"{slug}@lucky10.com"

    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Username '{username}' already exists. Please choose a different username.")

    new_user = User(
        id=f"user_{uuid.uuid4().hex[:12]}",
        name=agency_name,
        email=email,
        username=username,
        password_hash=get_password_hash(req.password.strip()),
        role=UserRole.CUSTOMER,
        balance=1000.0,
        mode=req.mode or "With Commission",
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "username": new_user.username,
        "mode": new_user.mode,
        "balance": new_user.balance,
        "isActive": new_user.is_active,
        "bankDetails": None,
        "createdAt": new_user.created_at.strftime("%Y-%m-%d"),
    }

@router.put("/users/status-all")
@router.patch("/users/status-all")
def set_all_users_status(status_payload: dict, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    is_active = status_payload.get("isActive", True)
    db.query(User).filter(User.role == UserRole.CUSTOMER).update({"is_active": is_active}, synchronize_session=False)
    db.commit()
    return {"message": f"All users status updated to {'Active' if is_active else 'Deactivated'}"}

@router.put("/users/{user_id}/status")
@router.patch("/users/{user_id}/status")
def toggle_user_status(user_id: str, status_payload: Optional[dict] = None, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter((User.name == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if status_payload and "isActive" in status_payload and status_payload["isActive"] is not None:
        user.is_active = bool(status_payload["isActive"])
    else:
        user.is_active = not user.is_active
        
    db.commit()
    db.refresh(user)
    return {"id": user.id, "isActive": user.is_active, "message": "User status updated successfully"}

@router.put("/users/{user_id}/password")
@router.patch("/users/{user_id}/password")
def change_user_password(user_id: str, payload: dict, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    new_password = payload.get("password")
    if not new_password or len(str(new_password).strip()) < 1:
        raise HTTPException(status_code=400, detail="Password cannot be empty")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter((User.name == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = get_password_hash(str(new_password).strip())
    db.commit()
    return {"message": "Password updated successfully", "id": user.id}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter((User.name == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clean up any related TransactionLog records
    db.query(TransactionLog).filter((TransactionLog.user_id == user.id) | (TransactionLog.user_name == user.name)).delete(synchronize_session=False)
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.delete("/users")
def clear_all_users(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == UserRole.CUSTOMER).all()
    for u in users:
        db.query(TransactionLog).filter((TransactionLog.user_id == u.id) | (TransactionLog.user_name == u.name)).delete(synchronize_session=False)
        db.delete(u)
    db.commit()
    return {"message": "All users deleted successfully"}

def evaluate_ticket_win(ticket: Ticket, result: GameResult) -> float:
    flat_comps = get_flat_compliments(result.compliments_json)
    res = evaluate_ticket_items(
        items=ticket.items,
        p1=result.prize1 or "",
        p2=result.prize2 or "",
        p3=result.prize3 or "",
        p4=result.prize4 or "",
        p5=result.prize5 or "",
        p6=result.prize6 or "",
        compliments=flat_comps,
    )
    return res["total_win_amount"]

@router.post("/results")
def publish_results(req: GameResultPublishSchema, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    target_date = req.date.strip() if req.date and req.date.strip() else datetime.now(timezone.utc).strftime("%Y-%m-%d")
    compliments_json = json.dumps(req.compliments or [])

    try:
        # Check if result already exists for slot on target date
        existing = db.query(GameResult).filter(
            GameResult.date == target_date,
            GameResult.game_slot == req.gameSlot
        ).first()

        if existing:
            existing.prize1 = req.prize1
            existing.prize2 = req.prize2
            existing.prize3 = req.prize3
            existing.prize4 = req.prize4
            existing.prize5 = req.prize5 or ""
            existing.prize6 = req.prize6 or ""
            existing.compliments_json = compliments_json
            existing.published_at = datetime.now(timezone.utc)
            target_res = existing
        else:
            target_res = GameResult(
                id=f"res_{int(datetime.now().timestamp() * 1000)}",
                date=target_date,
                game_slot=req.gameSlot,
                prize1=req.prize1,
                prize2=req.prize2,
                prize3=req.prize3,
                prize4=req.prize4,
                prize5=req.prize5 or "",
                prize6=req.prize6 or "",
                compliments_json=compliments_json,
                published_at=datetime.now(timezone.utc),
            )
            db.add(target_res)

        db.flush()

        # Automatically calculate winners and update all tickets for this slot on this date
        slot_tickets = (
            db.query(Ticket)
            .options(selectinload(Ticket.items))
            .filter(Ticket.game_slot == req.gameSlot)
            .all()
        )
        for tkt in slot_tickets:
            t_date = tkt.placed_at.strftime("%Y-%m-%d") if tkt.placed_at else target_date
            if t_date == target_date:
                calculated_win = evaluate_ticket_win(tkt, target_res)
                tkt.win_amount = calculated_win
                tkt.status = "WON" if calculated_win > 0 else "LOST"

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
            "prize6": target_res.prize6 or "",
            "compliments": req.compliments,
            "publishedAt": target_res.published_at.isoformat(),
        }
    except Exception as exc:
        db.rollback()
        raise exc

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

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Payout amount must be greater than zero.")

    # Prevent accidental rapid double-payouts within 5 seconds for the same user and amount
    recent_payout = db.query(PayoutRequest).filter(
        PayoutRequest.user_id == user.id,
        PayoutRequest.amount == req.amount,
        PayoutRequest.created_at >= datetime.now(timezone.utc) - timedelta(seconds=5)
    ).first()
    if recent_payout:
        return {
            "id": recent_payout.id,
            "userId": recent_payout.user_id,
            "userName": recent_payout.user_name,
            "amount": recent_payout.amount,
            "bankAccount": recent_payout.bank_account,
            "status": recent_payout.status,
            "date": recent_payout.created_at.strftime("%Y-%m-%d") if recent_payout.created_at else "",
        }

    try:
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
    except Exception as exc:
        db.rollback()
        raise exc

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

@router.get("/tickets")
def get_all_admin_tickets(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    tickets = (
        db.query(Ticket)
        .options(joinedload(Ticket.user), selectinload(Ticket.items))
        .order_by(Ticket.placed_at.desc())
        .all()
    )
    out = []
    for t in tickets:
        user_name = t.user.name if t.user else ""
        agency_name = t.user.username if t.user else ""
        out.append({
            "id": t.id,
            "ticketId": t.id,
            "userId": t.user_id,
            "userName": user_name,
            "agencyName": agency_name,
            "customerName": t.customer_name or "",
            "gameSlot": t.game_slot,
            "items": [
                {
                    "id": item.id,
                    "number": item.number,
                    "count": item.count,
                    "amount": item.total_amount,
                    "totalAmount": item.total_amount,
                    "unitPrice": item.unit_price,
                    "type": item.type,
                }
                for item in t.items
            ],
            "totalAmount": t.total_amount,
            "actionType": "PAY" if (t.id and t.id.startswith("PAY")) else "SAVE",
            "status": t.status,
            "winAmount": t.win_amount,
            "placedAt": t.placed_at.strftime("%Y-%m-%d %H:%M:%S") if t.placed_at else "",
            "createdAt": t.placed_at.strftime("%Y-%m-%d %H:%M:%S") if t.placed_at else "",
        })
    return out

@router.get("/reports")
def get_reports(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    start_of_today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_today = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=999999)

    today_gross_res = db.query(func.coalesce(func.sum(Ticket.total_amount), 0.0), func.count(Ticket.id)).filter(
        Ticket.placed_at >= start_of_today,
        Ticket.placed_at <= end_of_today
    ).first()
    today_gross = float(today_gross_res[0] if today_gross_res else 0.0)
    today_bets_count = int(today_gross_res[1] if today_gross_res else 0)

    today_payouts_res = db.query(func.coalesce(func.sum(PayoutRequest.amount), 0.0)).filter(
        PayoutRequest.created_at >= start_of_today,
        PayoutRequest.created_at <= end_of_today
    ).scalar()
    today_payout_amount = float(today_payouts_res or 0.0)
    today_net = today_gross - today_payout_amount

    return {
        "todayStr": today_str,
        "todayGross": today_gross,
        "todayPayouts": today_payout_amount,
        "todayNet": today_net,
        "todayBetsCount": today_bets_count,
    }

# ── Limit & Block Rules API Endpoints ──────────────────────────────────────────

@router.get("/limits/agency")
def get_agency_limits(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    limits = db.query(AgencyNumberLimit).order_by(AgencyNumberLimit.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "agencyId": l.agency_id,
            "agencyName": l.agency_name,
            "number": l.number,
            "gameSlot": l.game_slot,
            "maxCount": l.max_count,
            "createdAt": l.created_at.strftime("%Y-%m-%d") if l.created_at else "",
        }
        for l in limits
    ]

@router.post("/limits/agency")
def create_agency_limit(req: AgencyLimitCreate, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    new_limit = AgencyNumberLimit(
        id=f"lim_{int(datetime.now().timestamp() * 1000)}",
        agency_id=req.agencyId,
        agency_name=req.agencyName,
        number=req.number.strip(),
        game_slot=req.gameSlot or "ALL",
        max_count=req.maxCount,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_limit)
    db.commit()
    db.refresh(new_limit)
    return {
        "id": new_limit.id,
        "agencyId": new_limit.agency_id,
        "agencyName": new_limit.agency_name,
        "number": new_limit.number,
        "gameSlot": new_limit.game_slot,
        "maxCount": new_limit.max_count,
        "createdAt": new_limit.created_at.strftime("%Y-%m-%d"),
    }

@router.delete("/limits/agency/{limit_id}")
def delete_agency_limit(limit_id: str, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    item = db.query(AgencyNumberLimit).filter(AgencyNumberLimit.id == limit_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Agency limit rule not found")
    db.delete(item)
    db.commit()
    return {"message": "Agency limit removed"}

@router.get("/limits/blocked")
def get_blocked_numbers(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    blocked = db.query(BlockedNumberRule).order_by(BlockedNumberRule.created_at.desc()).all()
    return [
        {
            "id": b.id,
            "number": b.number,
            "gameSlot": b.game_slot,
            "reason": b.reason or "",
            "createdAt": b.created_at.strftime("%Y-%m-%d") if b.created_at else "",
        }
        for b in blocked
    ]

@router.post("/limits/blocked")
def create_blocked_number(req: BlockedNumberCreate, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    new_rule = BlockedNumberRule(
        id=f"blk_{int(datetime.now().timestamp() * 1000)}",
        number=req.number.strip(),
        game_slot=req.gameSlot or "ALL",
        reason=req.reason or "",
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return {
        "id": new_rule.id,
        "number": new_rule.number,
        "gameSlot": new_rule.game_slot,
        "reason": new_rule.reason,
        "createdAt": new_rule.created_at.strftime("%Y-%m-%d"),
    }

@router.delete("/limits/blocked/{blocked_id}")
def delete_blocked_number(blocked_id: str, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    rule = db.query(BlockedNumberRule).filter(BlockedNumberRule.id == blocked_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Blocked number rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Blocked number rule removed"}

@router.get("/limits/global")
def get_global_limit(admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    rule = db.query(GlobalLimitRule).first()
    if not rule:
        return {"defaultMaxCount": 100.0, "isEnabled": False, "gameSlot": "ALL"}
    return {
        "id": rule.id,
        "defaultMaxCount": rule.default_max_count,
        "isEnabled": rule.is_enabled,
        "gameSlot": rule.game_slot,
    }

@router.put("/limits/global")
def update_global_limit(req: GlobalLimitUpdate, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    rule = db.query(GlobalLimitRule).first()
    if not rule:
        rule = GlobalLimitRule(
            id="global_limit_main",
            default_max_count=req.defaultMaxCount if req.defaultMaxCount is not None else 100.0,
            is_enabled=req.isEnabled if req.isEnabled is not None else False,
            game_slot=req.gameSlot or "ALL",
        )
        db.add(rule)
    else:
        if req.defaultMaxCount is not None:
            rule.default_max_count = req.defaultMaxCount
        if req.isEnabled is not None:
            rule.is_enabled = req.isEnabled
        if req.gameSlot is not None:
            rule.game_slot = req.gameSlot
    db.commit()
    db.refresh(rule)
    return {
        "id": rule.id,
        "defaultMaxCount": rule.default_max_count,
        "isEnabled": rule.is_enabled,
        "gameSlot": rule.game_slot,
    }

