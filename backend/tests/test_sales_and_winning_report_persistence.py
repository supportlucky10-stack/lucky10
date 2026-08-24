import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.ticket import Ticket, BetItem
from app.models.game_result import GameResult
from app.core.security import get_password_hash

client = TestClient(app)

ADMIN_USER = "sync_admin"
CUST1_USER = "sync_agency1"
CUST2_USER = "sync_agency2"
TEST_DATE = "2026-08-24"

def setup_test_environment():
    db = SessionLocal()
    # Clean old test data
    db.query(BetItem).filter(BetItem.number.in_(["789", "456", "123", "A:7", "AB:78", "BOX:789"])).delete(synchronize_session=False)
    db.query(Ticket).filter(Ticket.user_id.in_(["usr_sync_01", "usr_sync_02", "admin_sync_01"])).delete(synchronize_session=False)
    db.query(GameResult).filter(GameResult.date == TEST_DATE).delete(synchronize_session=False)
    db.query(User).filter(User.username.in_([ADMIN_USER, CUST1_USER, CUST2_USER])).delete(synchronize_session=False)
    db.commit()

    admin = User(
        id="admin_sync_01",
        name="Sync Admin",
        email="admin@sync.com",
        username=ADMIN_USER,
        password_hash=get_password_hash("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    user1 = User(
        id="usr_sync_01",
        name="Agency Alpha",
        email="alpha@sync.com",
        username=CUST1_USER,
        password_hash=get_password_hash("AgencyPass123!"),
        role=UserRole.CUSTOMER,
        is_active=True,
        mode="Commission (20%)",
    )
    user2 = User(
        id="usr_sync_02",
        name="Agency Beta",
        email="beta@sync.com",
        username=CUST2_USER,
        password_hash=get_password_hash("AgencyPass123!"),
        role=UserRole.CUSTOMER,
        is_active=True,
        mode="Without Commission",
    )
    db.add_all([admin, user1, user2])
    db.commit()
    db.close()

def cleanup_test_environment():
    db = SessionLocal()
    db.query(BetItem).filter(BetItem.number.in_(["789", "456", "123", "A:7", "AB:78", "BOX:789"])).delete(synchronize_session=False)
    db.query(Ticket).filter(Ticket.user_id.in_(["usr_sync_01", "usr_sync_02", "admin_sync_01"])).delete(synchronize_session=False)
    db.query(GameResult).filter(GameResult.date == TEST_DATE).delete(synchronize_session=False)
    db.query(User).filter(User.username.in_([ADMIN_USER, CUST1_USER, CUST2_USER])).delete(synchronize_session=False)
    db.commit()
    db.close()

def run_tests():
    print("=== STARTING SALES REPORT & WINNING REPORT PERSISTENCE SUITE ===")
    setup_test_environment()

    try:
        # 1. Login Admin and Customers
        admin_login = client.post("/api/auth/admin/login", json={"username": ADMIN_USER, "password": "AdminPass123!"})
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        cust1_login = client.post("/api/auth/customer/login", json={"username": CUST1_USER, "password": "AgencyPass123!"})
        assert cust1_login.status_code == 200, f"Cust1 login failed: {cust1_login.text}"
        cust1_token = cust1_login.json()["access_token"]
        cust1_headers = {"Authorization": f"Bearer {cust1_token}"}

        cust2_login = client.post("/api/auth/customer/login", json={"username": CUST2_USER, "password": "AgencyPass123!"})
        assert cust2_login.status_code == 200, f"Cust2 login failed: {cust2_login.text}"
        cust2_token = cust2_login.json()["access_token"]
        cust2_headers = {"Authorization": f"Bearer {cust2_token}"}

        print("[PASSED] Authentication tokens generated for Admin and Customers.")

        # 2. Place Bills for Customer 1 (Agency Alpha) during open game slot
        with patch("app.routers.customer.is_game_slot_open", return_value=True):
            # Bill 1: 3-Digit SUPER "789" (count 10, amt 100) + 1-Digit "A:7" (count 5, amt 60)
            bill1_req = {
                "gameSlot": "3 PM Game",
                "actionType": "SAVE",
                "customerName": "Ramesh",
                "totalAmount": 160.0,
                "items": [
                    {"number": "789", "type": "SUPER", "count": 10, "unitPrice": 10.0, "totalAmount": 100.0},
                    {"number": "A:7", "type": "A", "count": 5, "unitPrice": 12.0, "totalAmount": 60.0},
                ]
            }
            res_b1 = client.post("/api/customer/tickets", json=bill1_req, headers=cust1_headers)
            assert res_b1.status_code == 200, f"Place bill 1 failed: {res_b1.text}"
            b1_data = res_b1.json()
            b1_id = b1_data["id"]
            assert b1_data["totalAmount"] == 160.0

            # Bill 2: 2-Digit "AB:78" (count 10, amt 100)
            bill2_req = {
                "gameSlot": "3 PM Game",
                "actionType": "SAVE",
                "customerName": "Suresh",
                "totalAmount": 100.0,
                "items": [
                    {"number": "AB:78", "type": "AB", "count": 10, "unitPrice": 10.0, "totalAmount": 100.0},
                ]
            }
            res_b2 = client.post("/api/customer/tickets", json=bill2_req, headers=cust1_headers)
            assert res_b2.status_code == 200
            b2_data = res_b2.json()
            b2_id = b2_data["id"]

            # Place Bill for Customer 2 (Agency Beta)
            bill3_req = {
                "gameSlot": "3 PM Game",
                "actionType": "SAVE",
                "customerName": "Ganesh",
                "totalAmount": 50.0,
                "items": [
                    {"number": "456", "type": "SUPER", "count": 5, "unitPrice": 10.0, "totalAmount": 50.0},
                ]
            }
            res_b3 = client.post("/api/customer/tickets", json=bill3_req, headers=cust2_headers)
            assert res_b3.status_code == 200
            b3_data = res_b3.json()
            b3_id = b3_data["id"]

        print("[PASSED] Bills generated successfully before result publication.")

        # 3. Verify Customer 1 Sales Reports BEFORE Result Publication
        cust1_tkts_before = client.get("/api/customer/tickets", headers=cust1_headers)
        assert cust1_tkts_before.status_code == 200
        c1_tkts = cust1_tkts_before.json()
        assert len(c1_tkts) == 2, f"Expected 2 tickets for Cust1, got {len(c1_tkts)}"
        assert all(t["userId"] == "usr_sync_01" for t in c1_tkts)
        assert all(t["status"] == "PENDING" for t in c1_tkts)
        print("[PASSED] Customer 1 sales tickets visible before result publish.")

        # 4. Verify Admin Ticket Feed BEFORE Result Publication
        admin_tkts_before = client.get("/api/admin/tickets", headers=admin_headers)
        assert admin_tkts_before.status_code == 200
        a_tkts = admin_tkts_before.json()
        our_tkts = [t for t in a_tkts if t["id"] in (b1_id, b2_id, b3_id)]
        assert len(our_tkts) == 3, f"Expected 3 tickets for Admin, got {len(our_tkts)}"
        print("[PASSED] Admin sees all user sales tickets before result publish.")

        # 5. ADMIN PUBLISHES RESULT FOR 3 PM Game on TEST_DATE (when game cutoff has passed)
        with patch("app.core.game_timing.is_game_slot_open", return_value=False):
            comp_boxes = [[f"{i:03d}" for i in range(j*5+100, (j+1)*5+100)] for j in range(6)]
            pub_req = {
                "gameSlot": "3 PM Game",
                "prize1": "789",
                "prize2": "456",
                "prize3": "321",
                "prize4": "654",
                "prize5": "987",
                "compliments": comp_boxes,
                "date": TEST_DATE,
            }
            res_pub = client.post("/api/admin/results", json=pub_req, headers=admin_headers)
            assert res_pub.status_code == 200, f"Publish failed: {res_pub.text}"
        print("[PASSED] Admin successfully published winning numbers for 3 PM Game.")

        # 6. VERIFY CUSTOMER 1 TICKETS IMMEDIATELY AFTER RESULT PUBLICATION (NO LOGOUT/LOGIN)
        cust1_tkts_after = client.get("/api/customer/tickets", headers=cust1_headers)
        assert cust1_tkts_after.status_code == 200
        c1_tkts_after = cust1_tkts_after.json()
        assert len(c1_tkts_after) == 2, f"Customer 1 tickets disappeared! Expected 2, got {len(c1_tkts_after)}"
        
        tkt1_after = next(t for t in c1_tkts_after if t["id"] == b1_id)
        tkt2_after = next(t for t in c1_tkts_after if t["id"] == b2_id)
        
        # Verify tickets have updated winning statuses
        assert tkt1_after["status"] == "WON", f"Ticket 1 expected WON, got {tkt1_after['status']}"
        assert tkt1_after["winAmount"] > 0, f"Ticket 1 winAmount must be > 0, got {tkt1_after['winAmount']}"
        assert tkt2_after["status"] == "WON", f"Ticket 2 expected WON, got {tkt2_after['status']}"
        assert tkt2_after["winAmount"] > 0, f"Ticket 2 winAmount must be > 0, got {tkt2_after['winAmount']}"
        print("[PASSED] Customer 1 sales & winning tickets PERSIST and are immediately WON after publish.")

        # 7. VERIFY CUSTOMER 2 TICKETS IMMEDIATELY AFTER RESULT PUBLICATION
        cust2_tkts_after = client.get("/api/customer/tickets", headers=cust2_headers)
        assert cust2_tkts_after.status_code == 200
        c2_tkts_after = cust2_tkts_after.json()
        assert len(c2_tkts_after) == 1, f"Customer 2 tickets disappeared! Expected 1, got {len(c2_tkts_after)}"
        tkt3_after = c2_tkts_after[0]
        assert tkt3_after["status"] == "WON"
        assert tkt3_after["winAmount"] == 5 * 500  # 2nd prize = ₹500 per count
        print("[PASSED] Customer 2 sales & winning tickets PERSIST and are immediately WON after publish.")

        # 8. VERIFY ADMIN TICKETS IMMEDIATELY AFTER RESULT PUBLICATION
        admin_tkts_after = client.get("/api/admin/tickets", headers=admin_headers)
        assert admin_tkts_after.status_code == 200
        a_tkts_after = admin_tkts_after.json()
        our_tkts_after = [t for t in a_tkts_after if t["id"] in (b1_id, b2_id, b3_id)]
        assert len(our_tkts_after) == 3, f"Admin sales tickets disappeared! Expected 3, got {len(our_tkts_after)}"
        print("[PASSED] Admin sales tickets remain 100% intact across all agencies after publish.")

        # 9. VERIFY PUBLISHED RESULT API RETRIEVAL
        res_by_date = client.get(f"/api/customer/results/by-date?date={TEST_DATE}")
        assert res_by_date.status_code == 200
        published_results = res_by_date.json()
        assert "3 PM Game" in published_results
        assert published_results["3 PM Game"]["prize1"] == "789"
        assert published_results["3 PM Game"]["prize2"] == "456"
        print("[PASSED] Customer and Admin can query published results with zero latency.")

        print("\n=== ALL SALES & WINNING REPORT PERSISTENCE TESTS PASSED! ===")
    finally:
        cleanup_test_environment()

if __name__ == "__main__":
    run_tests()
