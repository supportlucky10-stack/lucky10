import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User,
    Game,
    GameResult,
    Ticket,
    BetItem,
    IssueTicket,
)
from app.models.user import UserRole

def generate_30_compliments(base_num: str, offset: int = 1) -> list:
    base = int(base_num) if base_num.isdigit() else 100
    res = []
    for i in range(1, 31):
        num = (base + i * offset) % 1000
        res.append(f"{num:03d}")
    return [res[i:i+5] for i in range(0, 30, 5)]

def validate_admin_password(password: str) -> None:
    """Validate password strength for production admin credentials."""
    if not password or len(password) < 8:
        raise ValueError("ADMIN_PASSWORD must be at least 8 characters long.")
    weak_passwords = {"123", "123456", "admin123", "demo123", "password", "admin", "lucky10"}
    if password.lower() in weak_passwords:
        raise ValueError("ADMIN_PASSWORD is too weak or is a generic demo password.")

def provision_first_admin(db: Session):
    """
    Provision or safely reset the ADMIN account.
    If ADMIN_RESET_PASSWORD is true (1/true), safely updates the existing ADMIN user's password.
    Otherwise, if an ADMIN already exists, skips overwrite to protect production data.
    """
    admin_username = os.getenv("ADMIN_USERNAME", "").strip()
    admin_password = os.getenv("ADMIN_PASSWORD", "").strip()
    reset_requested = os.getenv("ADMIN_RESET_PASSWORD", "").lower() in ("true", "1")
    is_prod = os.getenv("ENVIRONMENT", "").lower() in ("production", "prod") or os.getenv("RAILWAY_ENVIRONMENT") is not None

    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()

    if reset_requested:
        if not admin_username or not admin_password:
            print("[Lucky10 Admin Init] ADMIN_RESET_PASSWORD is true, but ADMIN_USERNAME or ADMIN_PASSWORD is not set. Password reset skipped.")
            return

        try:
            validate_admin_password(admin_password)
        except ValueError as err:
            print(f"[Lucky10 Admin Init] Password reset validation failed: {err}")
            return

        new_hash = get_password_hash(admin_password)

        if existing_admin:
            existing_admin.username = admin_username
            existing_admin.email = f"{admin_username.lower()}@lucky10.com" if "@" not in admin_username else admin_username.lower()
            existing_admin.password_hash = new_hash
            existing_admin.is_active = True
            existing_admin.role = UserRole.ADMIN
            db.commit()
            print(f"[Lucky10 Admin Init] SUCCESS: Admin password reset completed for '{admin_username}'.")
        else:
            new_admin = User(
                id=f"user_admin_{int(datetime.now().timestamp() * 1000)}",
                name="System Admin",
                email=f"{admin_username.lower()}@lucky10.com" if "@" not in admin_username else admin_username.lower(),
                username=admin_username,
                password_hash=new_hash,
                role=UserRole.ADMIN,
                mode="With Commission",
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
            db.add(new_admin)
            db.commit()
            print(f"[Lucky10 Admin Init] SUCCESS: Admin user '{admin_username}' provisioned via reset flag.")
        return

    if existing_admin:
        print("[Lucky10 Admin Init] Admin user already exists. Overwrite skipped.")
        return

    if admin_username and admin_password:
        try:
            validate_admin_password(admin_password)
        except ValueError as err:
            print(f"[Lucky10 Admin Init] Admin password validation failed: {err}")
            return

        print(f"[Lucky10 Admin Init] Provisioning first admin user '{admin_username}' from environment variables...")
        new_admin = User(
            id=f"user_admin_{int(datetime.now().timestamp() * 1000)}",
            name="System Admin",
            email=f"{admin_username.lower()}@lucky10.com" if "@" not in admin_username else admin_username.lower(),
            username=admin_username,
            password_hash=get_password_hash(admin_password),
            role=UserRole.ADMIN,
            mode="With Commission",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(new_admin)
        db.commit()
        print(f"[Lucky10 Admin Init] SUCCESS: Admin user '{admin_username}' provisioned successfully.")
    elif not is_prod:
        print("[Lucky10 Admin Init] Provisioning default local dev admin 'admin'...")
        new_admin = User(
            id="user_admin_001",
            name="System Admin",
            email="admin@lucky10.com",
            username="admin",
            password_hash=get_password_hash("admin_dev_pass_2026"),
            role=UserRole.ADMIN,
            mode="With Commission",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(new_admin)
        db.commit()
        print("[Lucky10 Admin Init] Local dev admin created.")
    else:
        print("[Lucky10 Admin Init] No ADMIN_USERNAME / ADMIN_PASSWORD set in production. First admin provisioning skipped.")

def seed_db(force: bool = False, dev: bool = False):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # First ensure admin user is provisioned
        provision_first_admin(db)

        is_prod = os.getenv("ENVIRONMENT", "").lower() in ("production", "prod") or os.getenv("RAILWAY_ENVIRONMENT") is not None
        force_env = os.getenv("FORCE_SEED", "").lower() in ("true", "1")

        if is_prod and not force and not force_env and not dev:
            print("[Lucky10 Seed] Production environment detected. Demo user seeding skipped.")
            return

        if not force and not force_env and not dev:
            existing_count = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
            if existing_count > 0:
                print("[Lucky10 Seed] Customer user data already exists. Demo seeding skipped.")
                return

        now_utc = datetime.now(timezone.utc)
        today_str = now_utc.strftime("%Y-%m-%d")
        yesterday_str = (now_utc - timedelta(days=1)).strftime("%Y-%m-%d")
        day_before_str = (now_utc - timedelta(days=2)).strftime("%Y-%m-%d")

        # ── 1. Seed Initial Agencies ──
        agencies_data = [
            {
                "id": "user_sriganesh_002",
                "name": "Sri Ganesh Agency",
                "email": "sriganesh@lucky10.com",
                "username": "sriganesh",
                "password": "123",
                "role": UserRole.CUSTOMER,
                "mode": "With Commission (20%)",
            },
            {
                "id": "user_luckystar_003",
                "name": "Lucky Star Agency",
                "email": "luckystar@lucky10.com",
                "username": "luckystar",
                "password": "123",
                "role": UserRole.CUSTOMER,
                "mode": "With Commission (30%)",
            },
            {
                "id": "user_balaji_004",
                "name": "Balaji Lottery Agency",
                "email": "balaji_agency@lucky10.com",
                "username": "balaji_agency",
                "password": "123",
                "role": UserRole.CUSTOMER,
                "mode": "Without Commission",
            },
            {
                "id": "user_royal_005",
                "name": "Royal Fortune Agency",
                "email": "royal_fortune@lucky10.com",
                "username": "royal_fortune",
                "password": "123",
                "role": UserRole.CUSTOMER,
                "mode": "With Commission (20%)",
            },
        ]

        for u_data in agencies_data:
            existing = db.query(User).filter((User.id == u_data["id"]) | (User.username == u_data["username"])).first()
            if not existing:
                u = User(
                    id=u_data["id"],
                    name=u_data["name"],
                    email=u_data["email"],
                    username=u_data["username"],
                    password_hash=get_password_hash(u_data["password"]),
                    role=u_data["role"],
                    mode=u_data["mode"],
                    is_active=True,
                    created_at=now_utc - timedelta(days=15),
                )
                db.add(u)
            else:
                existing.name = u_data["name"]
                existing.mode = u_data["mode"]

        print("--> Seeded Agencies successfully")

        # ── 2. Seed Games ──
        slots = ["1 PM Game", "3 PM Game", "6 PM Game", "8 PM Game"]
        for slot in slots:
            g = db.query(Game).filter(Game.name == slot).first()
            if not g:
                db.add(Game(id=f"game_{slot.replace(' ', '_').lower()}", name=slot, slot_time=slot.split(" ")[0]))

        # ── 3. Seed Game Results for Today, Yesterday & Day Before ──
        results_dataset = [
            # YESTERDAY
            {
                "id": f"res_{yesterday_str}_1pm",
                "date": yesterday_str,
                "game_slot": "1 PM Game",
                "prize1": "418",
                "prize2": "725",
                "prize3": "291",
                "prize4": "634",
                "prize5": "802",
                "prize6": "153",
                "compliments_json": json.dumps(generate_30_compliments("418", 1)),
            },
            {
                "id": f"res_{yesterday_str}_3pm",
                "date": yesterday_str,
                "game_slot": "3 PM Game",
                "prize1": "893",
                "prize2": "314",
                "prize3": "570",
                "prize4": "129",
                "prize5": "468",
                "prize6": "721",
                "compliments_json": json.dumps(generate_30_compliments("893", 2)),
            },
            {
                "id": f"res_{yesterday_str}_6pm",
                "date": yesterday_str,
                "game_slot": "6 PM Game",
                "prize1": "165",
                "prize2": "902",
                "prize3": "438",
                "prize4": "781",
                "prize5": "250",
                "prize6": "394",
                "compliments_json": json.dumps(generate_30_compliments("165", 1)),
            },
            {
                "id": f"res_{yesterday_str}_8pm",
                "date": yesterday_str,
                "game_slot": "8 PM Game",
                "prize1": "730",
                "prize2": "249",
                "prize3": "615",
                "prize4": "382",
                "prize5": "904",
                "prize6": "517",
                "compliments_json": json.dumps(generate_30_compliments("730", 3)),
            },
            # DAY BEFORE YESTERDAY
            {
                "id": f"res_{day_before_str}_1pm",
                "date": day_before_str,
                "game_slot": "1 PM Game",
                "prize1": "951",
                "prize2": "184",
                "prize3": "637",
                "prize4": "420",
                "prize5": "319",
                "prize6": "806",
                "compliments_json": json.dumps(generate_30_compliments("951", 1)),
            },
            {
                "id": f"res_{day_before_str}_3pm",
                "date": day_before_str,
                "game_slot": "3 PM Game",
                "prize1": "268",
                "prize2": "593",
                "prize3": "841",
                "prize4": "715",
                "prize5": "032",
                "prize6": "495",
                "compliments_json": json.dumps(generate_30_compliments("268", 2)),
            },
        ]

        for res in results_dataset:
            existing = db.query(GameResult).filter(GameResult.date == res["date"], GameResult.game_slot == res["game_slot"]).first()
            if not existing:
                db.add(GameResult(**res, published_at=now_utc))
            else:
                existing.prize1 = res["prize1"]
                existing.prize2 = res["prize2"]
                existing.prize3 = res["prize3"]
                existing.prize4 = res["prize4"]
                existing.prize5 = res["prize5"]
                existing.prize6 = res.get("prize6", "")
                existing.compliments_json = res["compliments_json"]

        print("--> Seeded Game Results for multiple dates and slots")

        # ── 4. Seed Placed Tickets Across Agencies and Customers ──
        sample_tickets = [
            # 1. Sri Ganesh Agency -> Customer: Raju Bhai (Winner: 1 PM 1st Prize 742)
            {
                "id": "PAY-108291",
                "user_id": "user_sriganesh_002",
                "customer_name": "Raju Bhai",
                "game_slot": "1 PM Game",
                "total_amount": 350.0,
                "status": "WON",
                "win_amount": 5000.0,
                "placed_at": now_utc - timedelta(hours=3),
                "items": [
                    {"id": "bet_001", "number": "742", "count": 10, "type": "SUPER", "unit_price": 10, "total_amount": 100},
                    {"id": "bet_002", "number": "819", "count": 15, "type": "SUPER", "unit_price": 10, "total_amount": 150},
                    {"id": "bet_003", "number": "AB:42", "count": 10, "type": "AB", "unit_price": 10, "total_amount": 100},
                ]
            },
            # 2. Sri Ganesh Agency -> Customer: Vikram Patel (Winner: 1 PM 2nd Prize 819)
            {
                "id": "PAY-108292",
                "user_id": "user_sriganesh_002",
                "customer_name": "Vikram Patel",
                "game_slot": "1 PM Game",
                "total_amount": 500.0,
                "status": "WON",
                "win_amount": 3750.0,
                "placed_at": now_utc - timedelta(hours=2, minutes=45),
                "items": [
                    {"id": "bet_004", "number": "819", "count": 15, "type": "SUPER", "unit_price": 10, "total_amount": 150},
                    {"id": "bet_005", "number": "350", "count": 20, "type": "SUPER", "unit_price": 10, "total_amount": 200},
                    {"id": "bet_006", "number": "A:7", "count": 15, "type": "A", "unit_price": 10, "total_amount": 150},
                ]
            },
            # 3. Lucky Star Agency -> Customer: Priya Sharma (Winner: 3 PM 1st Prize 512)
            {
                "id": "PAY-108293",
                "user_id": "user_luckystar_003",
                "customer_name": "Priya Sharma",
                "game_slot": "3 PM Game",
                "total_amount": 600.0,
                "status": "WON",
                "win_amount": 10000.0,
                "placed_at": now_utc - timedelta(hours=2),
                "items": [
                    {"id": "bet_007", "number": "512", "count": 20, "type": "SUPER", "unit_price": 10, "total_amount": 200},
                    {"id": "bet_008", "number": "934", "count": 20, "type": "BOX", "unit_price": 10, "total_amount": 200},
                    {"id": "bet_009", "number": "BC:12", "count": 20, "type": "BC", "unit_price": 10, "total_amount": 200},
                ]
            },
            # 4. Lucky Star Agency -> Customer: Suresh Raina (Winner: 3 PM 3rd Prize 601)
            {
                "id": "PAY-108294",
                "user_id": "user_luckystar_003",
                "customer_name": "Suresh Raina",
                "game_slot": "3 PM Game",
                "total_amount": 450.0,
                "status": "WON",
                "win_amount": 1500.0,
                "placed_at": now_utc - timedelta(hours=1, minutes=50),
                "items": [
                    {"id": "bet_010", "number": "601", "count": 15, "type": "SUPER", "unit_price": 10, "total_amount": 150},
                    {"id": "bet_011", "number": "287", "count": 15, "type": "SUPER", "unit_price": 10, "total_amount": 150},
                    {"id": "bet_012", "number": "739", "count": 15, "type": "SUPER", "unit_price": 10, "total_amount": 150},
                ]
            },
            # 5. Balaji Lottery Agency -> Customer: Anil Kumar (Winner: 6 PM 1st Prize 389)
            {
                "id": "PAY-108295",
                "user_id": "user_balaji_004",
                "customer_name": "Anil Kumar",
                "game_slot": "6 PM Game",
                "total_amount": 700.0,
                "status": "WON",
                "win_amount": 12500.0,
                "placed_at": now_utc - timedelta(hours=1, minutes=20),
                "items": [
                    {"id": "bet_013", "number": "389", "count": 25, "type": "SUPER", "unit_price": 10, "total_amount": 250},
                    {"id": "bet_014", "number": "145", "count": 20, "type": "BOX", "unit_price": 10, "total_amount": 200},
                    {"id": "bet_015", "number": "AB:38", "count": 25, "type": "AB", "unit_price": 10, "total_amount": 250},
                ]
            },
            # 6. Balaji Lottery Agency -> Customer: Amit Shah (Pending)
            {
                "id": "PAY-108296",
                "user_id": "user_balaji_004",
                "customer_name": "Amit Shah",
                "game_slot": "6 PM Game",
                "total_amount": 300.0,
                "status": "PENDING",
                "win_amount": 0.0,
                "placed_at": now_utc - timedelta(minutes=45),
                "items": [
                    {"id": "bet_016", "number": "720", "count": 10, "type": "SUPER", "unit_price": 10, "total_amount": 100},
                    {"id": "bet_017", "number": "963", "count": 10, "type": "SUPER", "unit_price": 10, "total_amount": 100},
                    {"id": "bet_018", "number": "521", "count": 10, "type": "SUPER", "unit_price": 10, "total_amount": 100},
                ]
            },
            # 7. Royal Fortune Agency -> Customer: Deepak Verma (Winner: 8 PM 1st Prize 624)
            {
                "id": "PAY-108297",
                "user_id": "user_royal_005",
                "customer_name": "Deepak Verma",
                "game_slot": "8 PM Game",
                "total_amount": 800.0,
                "status": "WON",
                "win_amount": 15000.0,
                "placed_at": now_utc - timedelta(minutes=30),
                "items": [
                    {"id": "bet_019", "number": "624", "count": 30, "type": "SUPER", "unit_price": 10, "total_amount": 300},
                    {"id": "bet_020", "number": "471", "count": 25, "type": "BOX", "unit_price": 10, "total_amount": 250},
                    {"id": "bet_021", "number": "AC:64", "count": 25, "type": "AC", "unit_price": 10, "total_amount": 250},
                ]
            },
            # 8. Royal Fortune Agency -> Customer: Kavita Rao (Winner: 8 PM 2nd Prize 471)
            {
                "id": "PAY-108298",
                "user_id": "user_royal_005",
                "customer_name": "Kavita Rao",
                "game_slot": "8 PM Game",
                "total_amount": 400.0,
                "status": "WON",
                "win_amount": 2500.0,
                "placed_at": now_utc - timedelta(minutes=20),
                "items": [
                    {"id": "bet_022", "number": "471", "count": 10, "type": "SUPER", "unit_price": 10, "total_amount": 100},
                    {"id": "bet_023", "number": "809", "count": 15, "type": "SUPER", "unit_price": 10, "total_amount": 150},
                    {"id": "bet_024", "number": "B:7", "count": 15, "type": "B", "unit_price": 10, "total_amount": 150},
                ]
            },
            # 9. Sri Ganesh Agency -> Customer: Sunil Shetty (Yesterday 1 PM Winner 418)
            {
                "id": "PAY-107101",
                "user_id": "user_sriganesh_002",
                "customer_name": "Sunil Shetty",
                "game_slot": "1 PM Game",
                "total_amount": 400.0,
                "status": "WON",
                "win_amount": 10000.0,
                "placed_at": now_utc - timedelta(days=1, hours=4),
                "items": [
                    {"id": "bet_030", "number": "418", "count": 20, "type": "SUPER", "unit_price": 10, "total_amount": 200},
                    {"id": "bet_031", "number": "725", "count": 20, "type": "SUPER", "unit_price": 10, "total_amount": 200},
                ]
            },
            # 12. Lucky Star Agency -> Customer: Pooja Hegde (Yesterday 3 PM Winner 893)
            {
                "id": "PAY-107102",
                "user_id": "user_luckystar_003",
                "customer_name": "Pooja Hegde",
                "game_slot": "3 PM Game",
                "total_amount": 500.0,
                "status": "WON",
                "win_amount": 7500.0,
                "placed_at": now_utc - timedelta(days=1, hours=2),
                "items": [
                    {"id": "bet_032", "number": "893", "count": 15, "type": "SUPER", "unit_price": 10, "total_amount": 150},
                    {"id": "bet_033", "number": "314", "count": 20, "type": "SUPER", "unit_price": 10, "total_amount": 200},
                    {"id": "bet_034", "number": "AB:89", "count": 15, "type": "AB", "unit_price": 10, "total_amount": 150},
                ]
            },
        ]

        for tkt_data in sample_tickets:
            existing = db.query(Ticket).filter(Ticket.id == tkt_data["id"]).first()
            if not existing:
                t = Ticket(
                    id=tkt_data["id"],
                    user_id=tkt_data["user_id"],
                    customer_name=tkt_data["customer_name"],
                    game_slot=tkt_data["game_slot"],
                    total_amount=tkt_data["total_amount"],
                    status=tkt_data["status"],
                    win_amount=tkt_data["win_amount"],
                    placed_at=tkt_data["placed_at"],
                )
                db.add(t)
                db.flush()

                for item in tkt_data["items"]:
                    b = BetItem(
                        id=item["id"],
                        ticket_id=t.id,
                        number=item["number"],
                        count=item["count"],
                        type=item["type"],
                        unit_price=item["unit_price"],
                        total_amount=item["total_amount"],
                    )
                    db.add(b)
            else:
                existing.customer_name = tkt_data["customer_name"]
                existing.status = tkt_data["status"]
                existing.win_amount = tkt_data["win_amount"]

        print("--> Seeded Placed Tickets with diverse Customers & Agencies")

        # ── 5. Seed Issue Support Tickets ──
        issues_data = [
            {
                "id": "ISS_109281",
                "user_id": "user_sriganesh_002",
                "user_name": "Sri Ganesh Agency",
                "user_email": "sriganesh@lucky10.com",
                "category": "Payment Issues",
                "description": "Payout of ₹5,000 successfully processed, requesting formal receipt for accounts.",
                "attachment": "payment_receipt.pdf",
                "status": "RESOLVED",
                "created_at": now_utc - timedelta(hours=4),
            },
            {
                "id": "ISS_109282",
                "user_id": "user_luckystar_003",
                "user_name": "Lucky Star Agency",
                "user_email": "luckystar@lucky10.com",
                "category": "Game Related",
                "description": "Customer Raju Bhai won 1st Prize in 1 PM Game, prize confirmation and wallet credit verification requested.",
                "attachment": "ticket_scan.jpg",
                "status": "RESOLVED",
                "created_at": now_utc - timedelta(hours=2, minutes=30),
            },
            {
                "id": "ISS_109283",
                "user_id": "user_balaji_004",
                "user_name": "Balaji Lottery Agency",
                "user_email": "balaji_agency@lucky10.com",
                "category": "Account Issues",
                "description": "Request to update new IFSC code and branch name for our bank account.",
                "attachment": "bank_cheque.png",
                "status": "PENDING",
                "created_at": now_utc - timedelta(minutes=50),
            },
            {
                "id": "ISS_109284",
                "user_id": "user_royal_005",
                "user_name": "Royal Fortune Agency",
                "user_email": "royal_fortune@lucky10.com",
                "category": "Other Queries",
                "description": "Inquiry regarding bulk ticket booking options for festive special slots.",
                "attachment": None,
                "status": "PENDING",
                "created_at": now_utc - timedelta(minutes=15),
            },
        ]

        for i in issues_data:
            existing = db.query(IssueTicket).filter(IssueTicket.id == i["id"]).first()
            if not existing:
                db.add(IssueTicket(**i))

        db.commit()
        print("--> Seeding completed successfully with all rich sample datasets!")
    except Exception as e:
        print(f"Error seeding db: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Lucky10 Database Initialization & Seeding")
    parser.add_argument("--dev", action="store_true", help="Seed development demo data")
    parser.add_argument("--prod-init", action="store_true", help="Initialize production admin user only")
    parser.add_argument("--force", action="store_true", help="Force re-seeding demo data")
    args = parser.parse_args()

    db_session = SessionLocal()
    try:
        if args.prod_init:
            provision_first_admin(db_session)
        else:
            seed_db(force=args.force, dev=args.dev)
    finally:
        db_session.close()
