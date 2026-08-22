import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from app.core.database import get_db, get_next_ticket_id
from app.core.security import get_current_customer
from app.models.user import User
from app.models.bank_details import BankDetails
from app.models.game_result import GameResult
from app.models.ticket import Ticket, BetItem
from app.models.issue import IssueTicket
from app.models.transaction import TransactionLog
from app.models.limit_rule import AgencyNumberLimit, BlockedNumberRule, GlobalLimitRule
from app.schemas.user import BankDetailsSchema, UserAccountResponse
from app.schemas.ticket import TicketCreateSchema, PlacedTicketResponse, BetItemSchema
from app.schemas.issue import IssueCreateSchema, IssueResponseSchema
from app.core.game_rules import evaluate_ticket_items, get_flat_compliments

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
def get_today_results(date: Optional[str] = None, db: Session = Depends(get_db)):
    today_str = date.strip() if date and date.strip() else datetime.now(timezone.utc).strftime("%Y-%m-%d")
    results = db.query(GameResult).filter(GameResult.date == today_str).all()
    out = {}
    for r in results:
        out[r.game_slot] = format_result(r)
        out[f"{r.date}_{r.game_slot}"] = format_result(r)
    
    # Fill in any missing game slots with the most recently published result
    all_slots = ["1 PM Game", "3 PM Game", "6 PM Game", "8 PM Game"]
    missing_slots = [s for s in all_slots if s not in out]
    if missing_slots:
        recent_results = db.query(GameResult).order_by(GameResult.published_at.desc()).all()
        for r in recent_results:
            if r.game_slot in missing_slots and r.game_slot not in out:
                out[r.game_slot] = format_result(r)
                out[f"{r.date}_{r.game_slot}"] = format_result(r)
                
    return out

@router.get("/results/by-date")
def get_results_by_date(date: Optional[str] = None, db: Session = Depends(get_db)):
    target_date = date.strip() if date and date.strip() else datetime.now(timezone.utc).strftime("%Y-%m-%d")
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
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    results = db.query(GameResult).filter(GameResult.date != today_str).all()
    return [format_result(r) for r in results]

@router.post("/tickets")
def place_ticket(req: TicketCreateSchema, payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    if not req.items or len(req.items) == 0:
        raise HTTPException(status_code=400, detail="Your bet slip is empty!")

    user_id = payload["sub"]

    # ── SERVER-SIDE FINANCIAL VALIDATION ──
    for item in req.items:
        item.totalAmount = float(item.unitPrice) * float(item.count)
    server_total = sum(item.totalAmount for item in req.items)
    req.totalAmount = server_total

    # Lock user row if paying to prevent concurrent balance race conditions
    if req.actionType == "PAY":
        user = db.query(User).filter(User.id == user_id).with_for_update().first()
    else:
        user = db.query(User).filter(User.id == user_id).first()

    user = check_user_active(user)

    # ── DUPLICATE / RETRY IDEMPOTENCY GUARD (3-Second Window) ──
    c_req_clean = (req.customerName or "").strip().lower()
    if c_req_clean == "customer":
        c_req_clean = ""

    recent_same_ticket = db.query(Ticket).options(selectinload(Ticket.items)).filter(
        Ticket.user_id == user.id,
        Ticket.game_slot == req.gameSlot,
        Ticket.total_amount == req.totalAmount,
        Ticket.placed_at >= datetime.now(timezone.utc) - timedelta(seconds=3)
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

    # Calculate user's existing placed count today for this game slot across all previous tickets in this agency
    existing_tickets = db.query(Ticket).filter(
        Ticket.user_id == user.id,
        Ticket.game_slot == req.gameSlot
    ).all()

    def norm_type(t: str) -> str:
        if not t:
            return ""
        u = t.upper()
        if u in ("SUPER", "DIRECT"):
            return "DIRECT"
        if u in ("BOX", "SHUFFLE"):
            return "BOX"
        return u

    placed_count_by_key: dict[str, float] = {}
    for tkt in existing_tickets:
        if tkt.placed_at and hasattr(tkt.placed_at, "strftime"):
            tkt_date = tkt.placed_at.strftime("%Y-%m-%d")
        elif tkt.placed_at:
            tkt_date = str(tkt.placed_at)[:10]
        else:
            tkt_date = today_str

        if tkt_date == today_str:
            for bi in tkt.items:
                bi_raw = bi.number.strip()
                bi_key = f"{bi_raw}_{norm_type(bi.type)}"
                placed_count_by_key[bi_key] = placed_count_by_key.get(bi_key, 0.0) + float(bi.count)

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

    # Validate balance if paying
    if req.actionType == "PAY":
        user_q = db.query(User).filter(User.id == user.id)
        bind = db.get_bind()
        if bind and bind.dialect.name == "postgresql":
            user_q = user_q.with_for_update()
        db_user = user_q.first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        if db_user.balance < calculated_total_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance (Available: ₹{db_user.balance:.2f}). Total needed: ₹{calculated_total_amount:.2f}",
            )
        db_user.balance -= calculated_total_amount

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
            placed_at_dt = datetime.now(timezone.utc)

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

            bet_objs = []
            for item_data in calculated_items:
                bet = BetItem(
                    id=f"bet_{uuid.uuid4().hex}",
                    ticket_id=ticket_id,
                    number=item_data["number"],
                    count=item_data["count"],
                    type=item_data["type"],
                    unit_price=item_data["unit_price"],
                    total_amount=item_data["total_amount"],
                )
                db.add(bet)
                bet_objs.append(bet)

            # Add transaction log if paid
            if req.actionType == "PAY":
                txn = TransactionLog(
                    id=f"TXN_{uuid.uuid4().hex[:6].upper()}",
                    user_id=user.id,
                    user_name=user.name,
                    type="Ticket Purchase",
                    amount=f"₹ {calculated_total_amount:.0f}",
                    account="Wallet Deposit",
                    status="SUCCESS",
                    timestamp=placed_at_dt,
                )
                db.add(txn)

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
def get_user_tickets(payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    user = check_user_active(db.query(User).filter(User.id == payload["sub"]).first())
    tickets = (
        db.query(Ticket)
        .options(joinedload(Ticket.user), selectinload(Ticket.items))
        .filter(Ticket.user_id == user.id)
        .order_by(Ticket.placed_at.desc())
        .all()
    )
    return [format_ticket(t) for t in tickets]

@router.delete("/tickets/{ticket_id}")
def delete_user_ticket(ticket_id: str, payload: dict = Depends(get_current_customer), db: Session = Depends(get_db)):
    user = check_user_active(db.query(User).filter(User.id == payload["sub"]).first())
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.user_id == user.id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    try:
        db.query(BetItem).filter(BetItem.ticket_id == ticket.id).delete()
        db.delete(ticket)
        db.commit()
        return {"success": True, "message": f"Bill #{ticket_id} deleted successfully"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete ticket: {str(exc)}")

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
