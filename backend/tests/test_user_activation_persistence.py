import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

def setup_users():
    db = SessionLocal()
    db.query(User).filter(User.username.in_(["test1", "test_admin_act", "test2_agency"])).delete(synchronize_session=False)
    
    admin = User(
        id="admin_act_001",
        name="Admin Activation Tester",
        email="admin_act@lucky10.com",
        username="test_admin_act",
        password_hash=get_password_hash("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    test1 = User(
        id="user_test1_001",
        name="Test 1 Agency",
        email="test1@lucky10.com",
        username="test1",
        password_hash=get_password_hash("test1pass"),
        role=UserRole.CUSTOMER,
        mode="With Commission (20%)",
        is_active=False,
    )
    db.add(admin)
    db.add(test1)
    db.commit()
    db.close()

def cleanup_users():
    db = SessionLocal()
    db.query(User).filter(User.username.in_(["test1", "test_admin_act", "test2_agency"])).delete(synchronize_session=False)
    db.commit()
    db.close()

def run_all_tests():
    print("=== STARTING USER ACTIVATION STATUS PERSISTENCE SUITE ===")
    setup_users()
    
    # ── TEST 1: Deactivated user rejected on login ──
    print("\n--- TEST 1: Deactivated user login rejected ---")
    resp = client.post("/api/auth/customer/login", json={"username": "test1", "password": "test1pass"})
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}: {resp.text}"
    assert "deactivated" in resp.json()["detail"].lower()
    print("[PASSED] TEST 1 PASSED: 403 Forbidden received with 'deactivated' message.")

    # ── TEST 2 & 8: Admin activates test1 -> test1 logs in -> 200 OK Active ──
    print("\n--- TEST 2 & 8: Admin activates test1 -> test1 login ---")
    admin_login = client.post("/api/auth/admin/login", json={"username": "test_admin_act", "password": "AdminPass123!"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    
    toggle_resp = client.put(
        "/api/admin/users/user_test1_001/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"isActive": True}
    )
    assert toggle_resp.status_code == 200, f"Toggle failed: {toggle_resp.text}"
    assert toggle_resp.json()["isActive"] is True
    
    db = SessionLocal()
    db_user = db.query(User).filter(User.id == "user_test1_001").first()
    assert db_user is not None
    assert db_user.is_active is True
    db.close()
    print("[PASSED] Authoritative DB state verified: test1 is_active=True")
    
    # test1 logs in
    user_login = client.post("/api/auth/customer/login", json={"username": "test1", "password": "test1pass"})
    assert user_login.status_code == 200, f"Login failed: {user_login.text}"
    user_data = user_login.json()["user"]
    assert user_data["username"] == "test1"
    assert user_data["isActive"] is True
    print("[PASSED] TEST 2 & 8 PASSED: test1 logged in successfully with Active status.")

    # ── TEST 3: /api/auth/me token profile persistence ──
    print("\n--- TEST 3: /api/auth/me token profile persistence ---")
    token = user_login.json()["access_token"]
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["isActive"] is True
    print("[PASSED] TEST 3 PASSED: /api/auth/me returns isActive=True.")

    # ── TEST 4 & 5: Deactivate test1 -> token immediately blocked from operations ──
    print("\n--- TEST 4 & 5: Deactivate test1 -> existing token blocked ---")
    toggle_deact = client.put(
        "/api/admin/users/user_test1_001/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"isActive": False}
    )
    assert toggle_deact.status_code == 200
    assert toggle_deact.json()["isActive"] is False
    
    tkt_resp = client.get("/api/customer/tickets", headers={"Authorization": f"Bearer {token}"})
    assert tkt_resp.status_code == 403, f"Expected 403, got {tkt_resp.status_code}: {tkt_resp.text}"
    assert "deactivated" in tkt_resp.json()["detail"].lower()
    
    place_resp = client.post(
        "/api/customer/tickets",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "gameSlot": "1 PM Game",
            "items": [{"number": "123", "count": 5, "type": "SUPER"}]
        }
    )
    assert place_resp.status_code == 403
    assert "deactivated" in place_resp.json()["detail"].lower()
    print("[PASSED] TEST 4 & 5 PASSED: Deactivated account blocked from ticket access and ticket creation.")

    # ── TEST 6: Status-All bulk activation/deactivation ──
    print("\n--- TEST 6: Status-all bulk activation/deactivation ---")
    all_act = client.put(
        "/api/admin/users/status-all",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"isActive": True}
    )
    assert all_act.status_code == 200
    
    # Login again as test1 -> must be active
    re_login = client.post("/api/auth/customer/login", json={"username": "test1", "password": "test1pass"})
    assert re_login.status_code == 200
    assert re_login.json()["user"]["isActive"] is True
    print("[PASSED] TEST 6 PASSED: Bulk activate restores test1 login.")

    cleanup_users()
    print("\n=== ALL 8 USER ACTIVATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_all_tests()
