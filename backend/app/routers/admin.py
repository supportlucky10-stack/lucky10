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
from app.models.game_result import GameResult
from app.models.ticket import Ticket, BetItem
from app.models.issue import IssueTicket
from app.models.limit_rule import AgencyNumberLimit, BlockedNumberRule, GlobalLimitRule
from app.schemas.result import GameResultPublishSchema
from app.schemas.user import UserCreateSchema
from app.schemas.limit_rule import AgencyLimitCreate, BlockedNumberCreate, GlobalLimitUpdate
from app.core.game_rules import evaluate_ticket_items, get_flat_compliments
from app.core.game_timing import (
    get_ist_now,
    get_business_date,
    is_game_result_publishable,
    normalize_slot_name,
    IST_TZ,
)

router = APIRouter(prefix="/api/admin", tags=["Admin Domain"])

@router.get("/users")
def get_all_users(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == UserRole.CUSTOMER).order_by(User.created_at.desc(), User.id.asc()).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "username": u.username,
            "mode": getattr(u, "mode", None) or "With Commission",
            "isActive": u.is_active if hasattr(u, 'is_active') and u.is_active is not None else True,
            "createdAt": u.created_at.strftime("%Y-%m-%d") if u.created_at else "",
        })
    return result

@router.post("/users")
def create_user(req: UserCreateSchema, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    agency_name = req.agencyName.strip() if req.agencyName else ""
    if not agency_name:
        raise HTTPException(status_code=400, detail="Agency Name is required")
    if not req.password or len(req.password.strip()) < 3:
        raise HTTPException(status_code=400, detail="Password must be at least 3 characters long")

    # Authoritative normalized agency name uniqueness check
    normalized_agency = " ".join(agency_name.split()).lower()
    existing_agency = db.query(User).filter(
        func.lower(func.trim(User.name)) == normalized_agency
    ).first()
    if existing_agency:
        raise HTTPException(status_code=400, detail="Agency name already exists.")

    username = (req.username.strip() if req.username and req.username.strip() else agency_name)
    normalized_username = " ".join(username.split()).lower()
    
    # Check if username already exists - never mutate or overwrite existing accounts
    existing_username = db.query(User).filter(
        func.lower(func.trim(User.username)) == normalized_username
    ).first()
    if existing_username:
        raise HTTPException(status_code=400, detail=f"Username '{username}' already exists. Please choose a different username.")

    slug = "".join(c for c in username.lower() if c.isalnum() or c == "_") or "agency"
    email = f"{slug}_{uuid.uuid4().hex[:6]}@lucky10.com"

    try:
        new_user = User(
            id=f"user_{uuid.uuid4().hex[:12]}",
            name=agency_name,
            email=email,
            username=username,
            password_hash=get_password_hash(req.password.strip()),
            role=UserRole.CUSTOMER,
            mode=req.mode or "With Commission (20%)",
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
            "isActive": new_user.is_active,
            "createdAt": new_user.created_at.strftime("%Y-%m-%d"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create user: {str(exc)}")

@router.put("/users/status-all")
@router.patch("/users/status-all")
def set_all_users_status(status_payload: dict, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    is_active = bool(status_payload.get("isActive", True))
    db.query(User).filter(User.role == UserRole.CUSTOMER).update({"is_active": is_active}, synchronize_session="fetch")
    db.commit()
    return {"message": f"All users status updated to {'Active' if is_active else 'Deactivated'}"}

@router.put("/users/{user_id}/status")
@router.patch("/users/{user_id}/status")
def toggle_user_status(user_id: str, status_payload: Optional[dict] = None, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    clean_id = str(user_id).strip()
    user = db.query(User).filter(User.id == clean_id).first()
    if not user:
        user = db.query(User).filter(
            (func.lower(User.id) == clean_id.lower()) |
            (func.lower(User.name) == clean_id.lower()) |
            (func.lower(User.username) == clean_id.lower())
        ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if status_payload and "isActive" in status_payload and status_payload["isActive"] is not None:
        user.is_active = bool(status_payload["isActive"])
    else:
        user.is_active = not bool(user.is_active)
        
    db.commit()
    db.refresh(user)
    return {"id": user.id, "isActive": user.is_active, "message": "User status updated successfully"}

@router.put("/users/{user_id}/password")
@router.patch("/users/{user_id}/password")
def change_user_password(user_id: str, payload: dict, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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

@router.put("/users/{user_id}/mode")
@router.patch("/users/{user_id}/mode")
def update_user_mode(user_id: str, payload: dict, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    mode = payload.get("mode")
    if not mode:
        raise HTTPException(status_code=400, detail="Mode / Commission rate is required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter((User.name == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.mode = str(mode).strip()
    db.commit()
    db.refresh(user)
    return {"message": "Commission mode updated successfully", "id": user.id, "mode": user.mode}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter((User.name == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.delete("/users")
def clear_all_users(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == UserRole.CUSTOMER).all()
    for u in users:
        db.delete(u)
    db.commit()
    return {"message": "All users deleted successfully"}

def get_ticket_business_date(tkt: Ticket) -> str:
    if tkt.placed_at:
        dt = tkt.placed_at
        if dt.tzinfo is None:
            utc_dt = dt.replace(tzinfo=timezone.utc)
        else:
            utc_dt = dt.astimezone(timezone.utc)
        return utc_dt.astimezone(IST_TZ).strftime("%Y-%m-%d")
    return ""

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
def publish_results(req: GameResultPublishSchema, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    target_date = req.date.strip() if req.date and req.date.strip() else get_business_date()

    compliments_json = json.dumps(req.compliments or [])

    try:
        # Check if result already exists for slot on target date
        norm_target_slot = normalize_slot_name(req.gameSlot)
        existing = db.query(GameResult).filter(
            GameResult.date == target_date,
            (GameResult.game_slot == req.gameSlot) | (GameResult.game_slot == norm_target_slot)
        ).first()

        p1 = (req.prize1 or "").strip()
        p2 = (req.prize2 or "").strip()
        p3 = (req.prize3 or "").strip()
        p4 = (req.prize4 or "").strip()
        p5 = (req.prize5 or "").strip()
        p6 = (req.prize6 or "").strip()

        if existing:
            existing.game_slot = norm_target_slot
            if p1:
                existing.prize1 = p1
            if p2:
                existing.prize2 = p2
            if p3:
                existing.prize3 = p3
            if p4:
                existing.prize4 = p4
            if p5:
                existing.prize5 = p5
            if p6:
                existing.prize6 = p6
            if req.compliments and len(req.compliments) > 0:
                existing.compliments_json = compliments_json
            existing.published_at = datetime.now(timezone.utc)
            target_res = existing
        else:
            target_res = GameResult(
                id=f"res_{int(datetime.now().timestamp() * 1000)}",
                date=target_date,
                game_slot=norm_target_slot,
                prize1=p1,
                prize2=p2,
                prize3=p3,
                prize4=p4,
                prize5=p5,
                prize6=p6,
                compliments_json=compliments_json,
                published_at=datetime.now(timezone.utc),
            )
            db.add(target_res)

        db.flush()

        # Automatically calculate winners and update all tickets for this exact slot
        all_tickets = (
            db.query(Ticket)
            .options(selectinload(Ticket.items))
            .filter(
                (Ticket.game_slot == req.gameSlot) | (Ticket.game_slot == norm_target_slot)
            )
            .all()
        )
        for tkt in all_tickets:
            tkt_slot = normalize_slot_name(tkt.game_slot)
            t_date = get_ticket_business_date(tkt)

            if tkt_slot == norm_target_slot and t_date == target_date:
                if not p1:
                    tkt.win_amount = 0.0
                    tkt.status = "PENDING"
                else:
                    try:
                        calculated_win = evaluate_ticket_win(tkt, target_res)
                        tkt.win_amount = calculated_win
                        tkt.status = "WON" if calculated_win > 0 else "LOST"
                    except Exception:
                        pass

        db.commit()
        db.refresh(target_res)

        try:
            parsed_compliments = json.loads(target_res.compliments_json)
        except Exception:
            parsed_compliments = req.compliments or []

        return {
            "id": target_res.id,
            "date": target_res.date,
            "gameSlot": target_res.game_slot,
            "prize1": target_res.prize1,
            "prize2": target_res.prize2 or "",
            "prize3": target_res.prize3 or "",
            "prize4": target_res.prize4 or "",
            "prize5": target_res.prize5 or "",
            "prize6": target_res.prize6 or "",
            "compliments": parsed_compliments,
            "publishedAt": target_res.published_at.isoformat() if target_res.published_at else datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        db.rollback()
        raise exc



@router.get("/issues")
def get_all_issues(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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
def update_issue_status(issue_id: str, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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
def get_all_admin_tickets(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    tickets = (
        db.query(Ticket)
        .options(joinedload(Ticket.user), selectinload(Ticket.items))
        .order_by(Ticket.placed_at.desc())
        .all()
    )
    out = []
    for t in tickets:
        agency_name = (t.user.name or t.user.username) if t.user else ""
        user_name = agency_name
        ist_dt_str = ""
        if t.placed_at:
            dt = t.placed_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            from app.core.game_timing import IST_TZ
            ist_dt_str = dt.astimezone(IST_TZ).strftime("%Y-%m-%d %H:%M:%S")
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
            "placedAt": ist_dt_str,
            "createdAt": ist_dt_str,
        })
    return out

@router.get("/tickets/by-date")
def get_admin_tickets_by_date(date: Optional[str] = None, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Return ALL users' tickets for the requested IST business date only.
    Uses get_ticket_business_date() for correct UTC→IST conversion — same as the winning
    evaluation logic in publish_results(). This makes admin date-scoped queries authoritative."""
    target_date = date.strip() if date and date.strip() else get_business_date()

    all_tickets = (
        db.query(Ticket)
        .options(joinedload(Ticket.user), selectinload(Ticket.items))
        .order_by(Ticket.placed_at.desc())
        .all()
    )

    out = []
    for t in all_tickets:
        t_date = get_ticket_business_date(t)
        if t_date != target_date:
            continue
        agency_name = (t.user.name or t.user.username) if t.user else ""
        user_name = agency_name
        ist_dt_str = ""
        if t.placed_at:
            dt = t.placed_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            from app.core.game_timing import IST_TZ
            ist_dt_str = dt.astimezone(IST_TZ).strftime("%Y-%m-%d %H:%M:%S")
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
            "placedAt": ist_dt_str,
            "createdAt": ist_dt_str,
        })
    return out

@router.delete("/tickets/{ticket_id}")
def delete_admin_ticket(ticket_id: str, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    try:
        db.query(BetItem).filter(BetItem.ticket_id == ticket.id).delete(synchronize_session=False)
        db.delete(ticket)
        db.commit()
        return {"success": True, "message": f"Bill #{ticket_id} deleted successfully"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete ticket: {str(exc)}")

@router.get("/reports")
def get_reports(
    date: Optional[str] = None,
    game_slot: Optional[str] = None,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    target_date = date.strip() if date and date.strip() else get_business_date()
    norm_slot = normalize_slot_name(game_slot) if game_slot and game_slot != "ALL" else None

    # Fetch all tickets with items and user
    tickets = (
        db.query(Ticket)
        .options(selectinload(Ticket.items), selectinload(Ticket.user))
        .all()
    )

    filtered_tickets = []
    for t in tickets:
        t_date = get_ticket_business_date(t)
        t_slot = normalize_slot_name(t.game_slot)
        if t_date == target_date:
            if not norm_slot or t_slot == norm_slot:
                filtered_tickets.append(t)

    total_bills = len(filtered_tickets)
    total_sales = sum(t.total_amount for t in filtered_tickets)
    total_tickets = sum(sum(item.count for item in t.items) for t in filtered_tickets)
    
    winning_tickets = [t for t in filtered_tickets if t.status == "WON"]
    winning_ticket_count = len(winning_tickets)
    winning_user_count = len({t.user_id for t in winning_tickets if t.user_id})
    total_win_amount = sum(t.win_amount for t in winning_tickets)

    # Fetch published result for slot/date if specified
    res = None
    if norm_slot:
        res = db.query(GameResult).filter(GameResult.date == target_date, GameResult.game_slot == norm_slot).first()

    return {
        "date": target_date,
        "gameSlot": norm_slot or "ALL",
        "totalBills": total_bills,
        "totalTickets": total_tickets,
        "totalSales": total_sales,
        "winningTickets": winning_ticket_count,
        "winningUsers": winning_user_count,
        "totalWinningAmount": total_win_amount,
        "netAmount": total_sales - total_win_amount,
        "isSettled": bool(res and res.prize1),
        "todayGross": total_sales,
        "todayPayouts": total_win_amount,
        "todayNet": total_sales - total_win_amount,
        "todayBetsCount": total_bills,
    }

# ── Limit & Block Rules API Endpoints ──────────────────────────────────────────

@router.get("/limits/agency")
def get_agency_limits(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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
def create_agency_limit(req: AgencyLimitCreate, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    clean_num = req.number.strip()
    slot_val = req.gameSlot or "ALL"
    existing = db.query(AgencyNumberLimit).filter(
        AgencyNumberLimit.agency_id == req.agencyId,
        AgencyNumberLimit.number == clean_num,
        AgencyNumberLimit.game_slot == slot_val
    ).first()

    if existing:
        existing.max_count = req.maxCount
        existing.agency_name = req.agencyName
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "agencyId": existing.agency_id,
            "agencyName": existing.agency_name,
            "number": existing.number,
            "gameSlot": existing.game_slot,
            "maxCount": existing.max_count,
            "createdAt": existing.created_at.strftime("%Y-%m-%d") if existing.created_at else "",
        }

    new_limit = AgencyNumberLimit(
        id=f"lim_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:6]}",
        agency_id=req.agencyId,
        agency_name=req.agencyName,
        number=clean_num,
        game_slot=slot_val,
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
def delete_agency_limit(limit_id: str, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    target_id = limit_id.strip()
    item = db.query(AgencyNumberLimit).filter(AgencyNumberLimit.id == target_id).first()
    if not item:
        item = db.query(AgencyNumberLimit).filter(AgencyNumberLimit.number == target_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Agency limit rule not found")
    db.delete(item)
    db.commit()
    return {"message": "Agency limit removed"}

@router.get("/limits/blocked")
def get_blocked_numbers(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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
def create_blocked_number(req: BlockedNumberCreate, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    clean_num = req.number.strip()
    slot_val = req.gameSlot or "ALL"
    existing = db.query(BlockedNumberRule).filter(
        BlockedNumberRule.number == clean_num,
        BlockedNumberRule.game_slot == slot_val
    ).first()

    if existing:
        existing.reason = req.reason or ""
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "number": existing.number,
            "gameSlot": existing.game_slot,
            "reason": existing.reason,
            "createdAt": existing.created_at.strftime("%Y-%m-%d") if existing.created_at else "",
        }

    new_rule = BlockedNumberRule(
        id=f"blk_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:6]}",
        number=clean_num,
        game_slot=slot_val,
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
def delete_blocked_number(blocked_id: str, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    target_id = blocked_id.strip()
    rule = db.query(BlockedNumberRule).filter(BlockedNumberRule.id == target_id).first()
    if not rule:
        rule = db.query(BlockedNumberRule).filter(BlockedNumberRule.number == target_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Blocked number rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Blocked number rule removed"}

@router.get("/limits/global")
def get_global_limit(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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
def update_global_limit(req: GlobalLimitUpdate, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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


