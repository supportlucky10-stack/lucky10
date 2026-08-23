import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from app.core.database import get_db, get_next_ticket_id
from app.core.security import get_current_customer
from app.models.user import User
from app.models.game_result import GameResult
from app.models.ticket import Ticket, BetItem
from app.models.issue import IssueTicket
from app.models.limit_rule import AgencyNumberLimit, BlockedNumberRule, GlobalLimitRule
from app.schemas.user import UserAccountResponse
from app.schemas.ticket import TicketCreateSchema, PlacedTicketResponse, BetItemSchema
from app.schemas.issue import IssueCreateSchema, IssueResponseSchema
from app.core.game_rules import evaluate_ticket_items, get_flat_compliments
from app.core.game_timing import (
    get_ist_now,
    get_business_date,
    is_game_slot_open,
    get_all_game_slot_statuses,
)

router = APIRouter(prefix="/api/customer", tags=["Customer Domain"])

def format_ticket(ticket: Ticket) -> dict:
    cust_name = getattr(ticket, "customer_name", "") or ""
    if cust_name.lower() == "customer":
        cust_name = ""
    user_name = ticket.user.username if getattr(ticket, "user", None) else ""
    agency_name = (ticket.user.name or ticket.user.username) if getattr(ticket, "user", None) else ""
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
        "placedAt": safe_format_dt(ticket.placed_at, "%Y-%m-%d %H:%M:%S"),
        "status": ticket.status,
        "winAmount": ticket.win_amount,
        "createdAt": safe_format_dt(ticket.placed_at, "%Y-%m-%d %H:%M:%S"),
    }

def format_result(res: GameResult) -> dict:
    compliments = []
    if res.compliments_json:
        try:
            compliments = json.loads(res.compliments_json)
        except Exception:
            compliments = []
    return {
        "id": res.id,
        "date": safe_format_dt(res.date, "%Y-%m-%d"),
        "gameSlot": res.game_slot,
        "prize1": res.prize1 or "",
        "prize2": res.prize2 or "",
        "prize3": res.prize3 or "",
        "prize4": res.prize4 or "",
        "prize5": res.prize5 or "",
        "prize6": res.prize6 or "",
        "compliments": compliments,
        "publishedAt": safe_format_dt(res.published_at, "%Y-%m-%d %H:%M:%S"),
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
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "isActive": user.is_active if hasattr(user, 'is_active') and user.is_active is not None else True,
        "createdAt": safe_format_dt(user.created_at, "%Y-%m-%d"),
    }

@router.get("/profile")
def get_customer_profile(current_user: User = Depends(get_current_customer)):
    return format_user_account(current_user)

@router.get("/game-status")
def get_game_status():
    """Returns authoritative IST game timing, business date, and slot open/locked statuses."""
    return get_all_game_slot_statuses()

@router.get("/results/today")
def get_today_results(date: Optional[str] = None, db: Session = Depends(get_db)):
    today_str = date.strip() if date and date.strip() else get_business_date()
    results = db.query(GameResult).filter(GameResult.date == today_str).all()
    out = {}
    for r in results:
        out[r.game_slot] = format_result(r)
        out[f"{r.date}_{r.game_slot}"] = format_result(r)
    return out

@router.get("/results/by-date")
def get_results_by_date(date: Optional[str] = None, db: Session = Depends(get_db)):
    target_date = date.strip() if date and date.strip() else get_business_date()
    results = db.query(GameResult).filter(GameResult.date == target_date).all()
    out = {}
    for r in results:
        out[r.game_slot] = format_result(r)
        out[f"{r.date}_{r.game_slot}"] = format_result(r)
    return out

@router.get("/results/all")
def get_all_results(db: Session = Depends(get_db)):
    results = db.query(GameResult).order_by(GameResult.published_at.desc()).all()
    out = {}
    for r in results:
        key = f"{r.date}_{r.game_slot}"
        formatted = format_result(r)
        if key not in out:
            out[key] = formatted
        if r.game_slot not in out:
            out[r.game_slot] = formatted
    return out

@router.get("/results/previous")
def get_previous_results(db: Session = Depends(get_db)):
    today_str = get_business_date()
    results = db.query(GameResult).filter(GameResult.date != today_str).all()
    return [format_result(r) for r in results]

@router.post("/tickets")
def place_ticket(req: TicketCreateSchema, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    if not req.items or len(req.items) == 0:
        raise HTTPException(status_code=400, detail="Your bet slip is empty!")

    # ── 1. AUTHORITATIVE BILLING CUTOFF VALIDATION ──
    now_ist = get_ist_now()
    business_date = get_business_date(now_ist)
    if not is_game_slot_open(req.gameSlot, now_ist):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "BILLING_CLOSED",
                "message": "Billing time has ended for this game.",
                "game_slot": req.gameSlot,
                "business_date": business_date,
            }
        )

    # ── SERVER-SIDE FINANCIAL VALIDATION ──
    for item in req.items:
        item.totalAmount = float(item.unitPrice) * float(item.count)
    server_total = sum(item.totalAmount for item in req.items)
    req.totalAmount = server_total

    user = current_user

    # ── DUPLICATE / RETRY IDEMPOTENCY GUARD (3-Second Window) ──
    c_req_clean = (req.customerName or "").strip().lower()
    if c_req_clean == "customer":
        c_req_clean = ""

    recent_same_ticket = db.query(Ticket).options(joinedload(Ticket.items)).filter(
        Ticket.user_id == user.id,
        Ticket.game_slot == req.gameSlot,
        Ticket.total_amount == req.totalAmount,
        Ticket.placed_at >= (now_ist.astimezone(timezone.utc) - timedelta(seconds=3))
    ).first()
    if recent_same_ticket and len(recent_same_ticket.items) == len(req.items):
        rec_cust_clean = (recent_same_ticket.customer_name or "").strip().lower()
        if rec_cust_clean == "customer":
            rec_cust_clean = ""
        if rec_cust_clean == c_req_clean:
            req_nums = sorted([f"{i.number}:{i.count}:{i.type}" for i in req.items])
            rec_nums = sorted([f"{i.number}:{i.count}:{i.type}" for i in recent_same_ticket.items])
            if req_nums == rec_nums:
                return format_ticket(recent_same_ticket)

    # ── SERVER-SIDE LIMIT & BLOCKED NUMBERS VALIDATION ──
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # 1. Fetch blocked numbers for this slot or ALL
    blocked_rules = db.query(BlockedNumberRule).filter(
        (BlockedNumberRule.game_slot == "ALL") | (BlockedNumberRule.game_slot == req.gameSlot)
    ).all()
    blocked_set = {b.number.strip() for b in blocked_rules}

    # 2. Fetch agency limits for this user/username or ALL
    agency_limits = db.query(AgencyNumberLimit).filter(
        (AgencyNumberLimit.agency_id == user.id) |
        (AgencyNumberLimit.agency_name.ilike(user.username)) |
        (AgencyNumberLimit.agency_name.ilike(user.name)) |
        (AgencyNumberLimit.agency_id == "ALL"),
        (AgencyNumberLimit.game_slot == "ALL") | (AgencyNumberLimit.game_slot == req.gameSlot)
    ).all()

    # 3. Fetch global limit rule
    global_limit = db.query(GlobalLimitRule).first()

    def norm_type(t: str) -> str:
        if not t:
            return ""
        u = t.upper()
        if u in ("SUPER", "DIRECT"):
            return "DIRECT"
        if u in ("BOX", "SHUFFLE"):
            return "BOX"
        return u

    # Calculate user's existing placed count today only if limits exist
    placed_count_by_key: dict[str, float] = {}
    if agency_limits or (global_limit and global_limit.is_enabled and (global_limit.game_slot == "ALL" or global_limit.game_slot == req.gameSlot)):
        today_start_dt = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        items_rows = (
            db.query(BetItem.number, BetItem.type, BetItem.count)
            .join(Ticket, BetItem.ticket_id == Ticket.id)
            .filter(
                Ticket.user_id == user.id,
                Ticket.game_slot == req.gameSlot,
                Ticket.placed_at >= today_start_dt,
            )
            .all()
        )
        for num_val, type_val, cnt_val in items_rows:
            bi_key = f"{num_val.strip()}_{norm_type(type_val)}"
            placed_count_by_key[bi_key] = placed_count_by_key.get(bi_key, 0.0) + float(cnt_val)

    # Track newly requested counts within this incoming batch
    batch_counts: dict[str, float] = {}

    for item in req.items:
        raw_num = item.number.strip()
        clean_num = raw_num.split(":")[1].strip() if ":" in raw_num else raw_num
        item_key = f"{raw_num}_{norm_type(item.type)}"
        
        # Check if number or clean_num is blocked
        if clean_num in blocked_set or raw_num in blocked_set:
            raise HTTPException(
                status_code=400,
                detail="Number cant be played"
            )

        current_placed = placed_count_by_key.get(item_key, 0.0)
        current_batch = batch_counts.get(item_key, 0.0)
        total_requested = current_placed + current_batch + float(item.count)

        # Check agency limit rule
        spec_lim = next((l for l in agency_limits if l.number.strip() == raw_num or l.number.strip() == clean_num), None)
        if spec_lim:
            if total_requested > spec_lim.max_count:
                raise HTTPException(
                    status_code=400,
                    detail="Number Overloaded! Not in Booked."
                )

        # Check global limit rule ("Limit All")
        if global_limit and global_limit.is_enabled:
            if global_limit.game_slot == "ALL" or global_limit.game_slot == req.gameSlot:
                if total_requested > global_limit.default_max_count:
                    raise HTTPException(
                        status_code=400,
                        detail="Number Overloaded! Not in Booked."
                    )

        batch_counts[item_key] = current_batch + float(item.count)

    # Authoritative calculation of financial values
    calculated_items = []
    calculated_total_amount = 0.0
    for item in req.items:
        num_str = item.number.strip()
        cnt = float(item.count)
        if cnt <= 0:
            raise HTTPException(status_code=400, detail="Count must be greater than 0")
        
        # 1-digit mode (e.g. A:1, B:5): ₹12 per count; 2-digit / 3-digit: ₹10 per count
        if (":" in num_str and len(num_str.split(":")[1].strip()) == 1) or item.type.upper() == "POSITION":
            unit_price = 12.0
        else:
            unit_price = 10.0

        item_total = cnt * unit_price
        calculated_total_amount += item_total
        calculated_items.append({
            "number": num_str,
            "count": cnt,
            "type": item.type,
            "unit_price": unit_price,
            "total_amount": item_total,
        })


    c_name = req.customerName.strip() if req.customerName and req.customerName.strip() else ""
    if c_name.lower() == "customer":
        c_name = ""

    # Check if result is already published for today
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing_res = db.query(GameResult).filter(
        GameResult.date == today_str,
        GameResult.game_slot == req.gameSlot
    ).first()

    status_val = "PENDING"
    win_val = 0.0

    if existing_res and existing_res.prize1:
        flat_comps = get_flat_compliments(existing_res.compliments_json)
        eval_res = evaluate_ticket_items(
            items=req.items,
            p1=existing_res.prize1 or "",
            p2=existing_res.prize2 or "",
            p3=existing_res.prize3 or "",
            p4=existing_res.prize4 or "",
            p5=existing_res.prize5 or "",
            p6=existing_res.prize6 or "",
            compliments=flat_comps,
        )
        win_val = eval_res["total_win_amount"]
        status_val = "WON" if win_val > 0 else "LOST"

    # Save ticket with concurrency retry protection
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Generate atomic, concurrency-safe sequential ticket ID
            ticket_id = get_next_ticket_id(db)
            placed_at_dt = now_ist.astimezone(timezone.utc)

            new_ticket = Ticket(
                id=ticket_id,
                user_id=user.id,
                customer_name=c_name,
                game_slot=req.gameSlot,
                total_amount=calculated_total_amount,
                status=status_val,
                win_amount=win_val,
                placed_at=placed_at_dt,
            )
            db.add(new_ticket)

            bet_objs = [
                BetItem(
                    id=f"bet_{uuid.uuid4().hex}",
                    ticket_id=ticket_id,
                    number=item_data["number"],
                    count=item_data["count"],
                    type=item_data["type"],
                    unit_price=item_data["unit_price"],
                    total_amount=item_data["total_amount"],
                )
                for item_data in calculated_items
            ]
            db.add_all(bet_objs)


            db.commit()
            return {
                "id": ticket_id,
                "ticketId": ticket_id,
                "userId": user.id,
                "userName": user.name or "",
                "agencyName": user.username or "",
                "customerName": c_name,
                "gameSlot": req.gameSlot,
                "items": [
                    {
                        "id": b.id,
                        "number": b.number,
                        "count": b.count,
                        "type": b.type,
                        "unitPrice": b.unit_price,
                        "totalAmount": b.total_amount,
                    }
                    for b in bet_objs
                ],
                "totalAmount": calculated_total_amount,
                "placedAt": placed_at_dt.isoformat(),
                "status": status_val,
                "winAmount": win_val,
            }
        except Exception as exc:
            db.rollback()
            if attempt < max_retries - 1 and ("unique" in str(exc).lower() or "integrity" in str(exc).lower() or "primary" in str(exc).lower()):
                continue
            raise exc

@router.get("/tickets")
def get_user_tickets(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    tickets = (
        db.query(Ticket)
        .options(joinedload(Ticket.user), selectinload(Ticket.items))
        .filter(Ticket.user_id == current_user.id)
        .order_by(Ticket.placed_at.desc())
        .limit(200)
        .all()
    )
    return [format_ticket(t) for t in tickets]

@router.delete("/tickets/{ticket_id}")
def delete_user_ticket(ticket_id: str, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.user_id == current_user.id
    ).first()
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



@router.post("/issues")
def submit_issue(req: IssueCreateSchema, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    user = current_user

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

@router.get("/limits")
def get_customer_limits(db: Session = Depends(get_db)):
    blocked_rules = db.query(BlockedNumberRule).all()
    agency_limits = db.query(AgencyNumberLimit).all()
    global_limit = db.query(GlobalLimitRule).first()
    return {
        "blockedNumbers": [
            {
                "id": b.id,
                "number": b.number,
                "gameSlot": b.game_slot,
                "reason": b.reason or "",
            }
            for b in blocked_rules
        ],
        "agencyLimits": [
            {
                "id": l.id,
                "agencyId": l.agency_id,
                "agencyName": l.agency_name,
                "number": l.number,
                "gameSlot": l.game_slot,
                "maxCount": l.max_count,
            }
            for l in agency_limits
        ],
        "globalLimit": {
            "defaultMaxCount": global_limit.default_max_count if global_limit else 100.0,
            "isEnabled": global_limit.is_enabled if global_limit else False,
            "gameSlot": global_limit.game_slot if global_limit else "ALL",
        } if global_limit else None,
    }
