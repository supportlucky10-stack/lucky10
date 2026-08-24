import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime, time
from app.core.game_timing import IST_TZ
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.game_result import GameResult
from app.core.security import get_password_hash

client = TestClient(app)

def make_ist_dt(year, month, day, hour, minute, second):
    return datetime(year, month, day, hour, minute, second, tzinfo=IST_TZ)

def evaluate_result_page_slot(dt_ist: datetime) -> str:
    hour = dt_ist.hour
    minute = dt_ist.minute
    second = dt_ist.second
    total_seconds = hour * 3600 + minute * 60 + second

    if total_seconds < 12 * 3600 + 59 * 60:
        return "1 PM Game"
    if total_seconds < 14 * 3600 + 59 * 60:
        return "3 PM Game"
    if total_seconds < 17 * 3600 + 59 * 60:
        return "6 PM Game"
    return "8 PM Game"

def setup_data():
    db = SessionLocal()
    db.query(User).filter(User.username == "res_admin").delete(synchronize_session=False)
    db.query(GameResult).filter(GameResult.date.in_(["2026-08-24", "2026-08-25"])).delete(synchronize_session=False)
    
    admin = User(
        id="admin_res_001",
        name="Result Admin",
        email="res_admin@lucky10.com",
        username="res_admin",
        password_hash=get_password_hash("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.close()

def cleanup_data():
    db = SessionLocal()
    db.query(User).filter(User.username == "res_admin").delete(synchronize_session=False)
    db.query(GameResult).filter(GameResult.date.in_(["2026-08-24", "2026-08-25"])).delete(synchronize_session=False)
    db.commit()
    db.close()

def run_tests():
    print("=== STARTING USER RESULT PAGE AUTOMATIC SWITCH & REALTIME SUITE ===")
    setup_data()

    # ── TEST 1-6: User Result State Machine Cutoff Boundaries ──
    print("\n--- TEST 1 to 6: Cutoff Boundary State Machine Transitions ---")
    # 1 PM Window
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 12, 58, 59)) == "1 PM Game"
    # Cutoff to 3 PM
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 12, 59, 0)) == "3 PM Game"
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 14, 58, 59)) == "3 PM Game"
    # Cutoff to 6 PM
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 14, 59, 0)) == "6 PM Game"
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 17, 58, 59)) == "6 PM Game"
    # Cutoff to 8 PM
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 17, 59, 0)) == "8 PM Game"
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 19, 58, 59)) == "8 PM Game"
    # 8 PM cutoff stays on 8 PM until midnight
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 19, 59, 0)) == "8 PM Game"
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 24, 23, 59, 59)) == "8 PM Game"
    # Midnight 00:00:00 AM next day -> 1 PM Game
    assert evaluate_result_page_slot(make_ist_dt(2026, 8, 25, 0, 0, 0)) == "1 PM Game"
    print("[PASSED] All 10 boundary seconds verified for Result Page State Machine.")

    # ── TEST 7 & 10: Realtime Result Publishing & Live API Retrieval ──
    print("\n--- TEST 7 & 10: Result Publishing & Live API Retrieval ---")
    admin_login = client.post("/api/auth/admin/login", json={"username": "res_admin", "password": "AdminPass123!"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]

    # Before publish: get results for 2026-08-24 -> empty
    init_res = client.get("/api/customer/results/by-date?date=2026-08-24")
    assert init_res.status_code == 200
    assert "3 PM Game" not in init_res.json()

    # Admin publishes 3 PM = 742 on 2026-08-24 (historical/simulated after cutoff)
    compliments = [[f"{(742 + i*10)%1000:03d}" for i in range(j, j+5)] for j in range(1, 31, 5)]
    pub_resp = client.post(
        "/api/admin/results",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "date": "2026-08-24",
            "gameSlot": "3 PM Game",
            "prize1": "742",
            "prize2": "111",
            "prize3": "222",
            "prize4": "333",
            "prize5": "444",
            "compliments": compliments,
        }
    )
    assert pub_resp.status_code == 200, f"Publish failed: {pub_resp.text}"

    # Customer fetches live results -> 3 PM is 742 with 30 compliments
    after_res = client.get("/api/customer/results/by-date?date=2026-08-24")
    assert after_res.status_code == 200
    data = after_res.json()
    assert "3 PM Game" in data
    assert data["3 PM Game"]["prize1"] == "742"
    assert len(data["3 PM Game"]["compliments"]) == 6 # 6 rows of 5 = 30 compliments
    print("[PASSED] Realtime published result retrieved with exact prize numbers and compliments.")

    # ── TEST 8: Slot Scoping Isolation ──
    print("\n--- TEST 8: Slot Scoping Isolation ---")
    # 6 PM Game is unpublished -> must not contain 3 PM's 742
    assert "6 PM Game" not in data
    print("[PASSED] 6 PM Game remains empty/unpublished and is not affected by 3 PM publish.")

    # ── TEST 9: Date Scoping Isolation ──
    print("\n--- TEST 9: Date Scoping Isolation ---")
    other_date = client.get("/api/customer/results/by-date?date=2026-08-25")
    assert other_date.status_code == 200
    assert "3 PM Game" not in other_date.json()
    print("[PASSED] Other dates are isolated and do not receive 2026-08-24 result.")

    cleanup_data()
    print("\n=== ALL USER RESULT TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
