import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.ticket import Ticket
from app.models.game_result import GameResult
from app.core.security import get_password_hash

client = TestClient(app)

def setup_data():
    db = SessionLocal()
    db.query(Ticket).filter(Ticket.user_id.in_(["daily_user_1", "daily_user_001"])).delete(synchronize_session=False)
    db.query(User).filter(User.username.in_(["daily_user_1", "daily_admin"])).delete(synchronize_session=False)
    db.query(GameResult).filter(GameResult.date == "2026-08-24").delete(synchronize_session=False)

    admin = User(
        id="daily_admin_001",
        name="Daily Admin",
        email="daily_admin@lucky10.com",
        username="daily_admin",
        password_hash=get_password_hash("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    user = User(
        id="daily_user_001",
        name="Daily Player Agency",
        email="daily_user@lucky10.com",
        username="daily_user_1",
        password_hash=get_password_hash("UserPass123!"),
        role=UserRole.CUSTOMER,
        is_active=True,
        mode="A", # Commission mode
    )
    db.add_all([admin, user])
    db.commit()
    db.close()

def cleanup_data():
    db = SessionLocal()
    db.query(Ticket).filter(Ticket.user_id.in_(["daily_user_001", "daily_user_1"])).delete(synchronize_session=False)
    db.query(User).filter(User.username.in_(["daily_user_1", "daily_admin"])).delete(synchronize_session=False)
    db.query(GameResult).filter(GameResult.date == "2026-08-24").delete(synchronize_session=False)
    db.commit()
    db.close()

from app.core.game_timing import set_mock_ist_now, IST_TZ

def run_tests():
    print("=== STARTING DAILY REPORT REALTIME SYNCHRONIZATION TEST ===")
    setup_data()

    # Set mock time to 10:00 AM IST (All games open for billing)
    set_mock_ist_now(datetime(2026, 8, 24, 10, 0, 0, tzinfo=IST_TZ))

    # 1. Login user & admin
    user_login = client.post("/api/auth/customer/login", json={"username": "daily_user_1", "password": "UserPass123!"})
    assert user_login.status_code == 200, f"User login failed: {user_login.text}"
    user_token = user_login.json()["access_token"]

    admin_login = client.post("/api/auth/admin/login", json={"username": "daily_admin", "password": "AdminPass123!"})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]

    # 2. Place tickets for 1 PM, 3 PM, 6 PM, 8 PM
    slots = ["1 PM Game", "3 PM Game", "6 PM Game", "8 PM Game"]
    for slot in slots:
        tkt_resp = client.post(
            "/api/customer/tickets",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "gameSlot": slot,
                "items": [
                    {"number": "742", "count": 2, "type": "SUPER", "unitPrice": 11, "totalAmount": 22},
                    {"number": "AB:74", "count": 3, "type": "PAIR", "unitPrice": 10, "totalAmount": 30},
                ],
                "totalAmount": 52,
                "customerName": "Test Customer",
            }
        )
        assert tkt_resp.status_code == 200, f"Ticket creation failed for {slot}: {tkt_resp.text}"

    # 3. Verify user tickets before result publication
    user_tkts_before = client.get("/api/customer/tickets", headers={"Authorization": f"Bearer {user_token}"}).json()
    assert len(user_tkts_before) == 4
    total_sales_before = sum(t["totalAmount"] for t in user_tkts_before)
    assert total_sales_before == 50.0 * 4 # 200.0

    # Advance mock time to 1:05 PM IST (after 1 PM cutoff)
    set_mock_ist_now(datetime(2026, 8, 24, 13, 5, 0, tzinfo=IST_TZ))

    # 4. Admin publishes 1 PM Game result: 742 (1st Prize)
    compliments = [[f"{(742 + i*10)%1000:03d}" for i in range(j, j+5)] for j in range(1, 31, 5)]
    pub_resp = client.post(
        "/api/admin/results",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "date": "2026-08-24",
            "gameSlot": "1 PM Game",
            "prize1": "742",
            "prize2": "111",
            "prize3": "222",
            "prize4": "333",
            "prize5": "444",
            "compliments": compliments,
        }
    )
    assert pub_resp.status_code == 200, f"Publish result failed: {pub_resp.text}"

    # 5. Verify authoritative data post-publication
    user_tkts_after = client.get("/api/customer/tickets", headers={"Authorization": f"Bearer {user_token}"}).json()
    assert len(user_tkts_after) == 4, "Ticket count must not change or disappear after publish!"
    
    # 6. Verify total sales did NOT disappear
    total_sales_after = sum(t["totalAmount"] for t in user_tkts_after)
    assert total_sales_after == total_sales_before, "Total sales must remain exactly identical after publish!"

    # 7. Check 1 PM winning ticket
    tkt_1pm = next(t for t in user_tkts_after if t["gameSlot"] == "1 PM Game")
    assert tkt_1pm["status"] == "WON", "1 PM ticket must be marked as WON!"
    assert tkt_1pm["winAmount"] > 0, "1 PM winning amount must be calculated!"

    # 8. Check 3 PM, 6 PM, 8 PM tickets remain PENDING with intact sales
    for pending_slot in ["3 PM Game", "6 PM Game", "8 PM Game"]:
        tkt = next(t for t in user_tkts_after if t["gameSlot"] == pending_slot)
        assert tkt["status"] == "PENDING"
        assert tkt["totalAmount"] == 50.0

    # 9. Verify results by date endpoint returns the 1 PM published results immediately
    results_by_date = client.get("/api/customer/results/by-date?date=2026-08-24").json()
    assert "1 PM Game" in results_by_date
    assert results_by_date["1 PM Game"]["prize1"] == "742"

    cleanup_data()
    set_mock_ist_now(None)
    print("[PASSED] Daily Report backend & realtime data synchronization verified 100%!")

if __name__ == "__main__":
    run_tests()
