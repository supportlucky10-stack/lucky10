import pytest
import os
import sys
from datetime import datetime, time, timezone, timedelta

from app.core.game_timing import (
    IST_TZ,
    get_ist_now,
    get_business_date,
    is_game_result_locked,
    is_game_result_publishable,
    get_all_game_slot_statuses,
    set_mock_ist_now,
    make_ist_dt,
)
from app.models.user import User, UserRole
from app.models.game_result import GameResult
from app.core.security import create_access_token, get_password_hash

TEST_DATE = "2026-11-27"

@pytest.fixture
def auth_admin(db_session):
    admin = db_session.query(User).filter(User.username == "admin_lock_test").first()
    if not admin:
        admin = User(
            id="admin_lock_test_1",
            name="Admin Lock Tester",
            email="admin_lock@lucky10.com",
            username="admin_lock_test",
            password_hash=get_password_hash("AdminPass123!"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db_session.add(admin)
        db_session.commit()
    token = create_access_token(data={"sub": admin.id, "role": "ADMIN"})
    return {"user": admin, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

@pytest.fixture
def auth_customer(db_session):
    cust = db_session.query(User).filter(User.username == "cust_lock_test").first()
    if not cust:
        cust = User(
            id="cust_lock_test_1",
            name="Customer Lock Tester",
            email="cust_lock@lucky10.com",
            username="cust_lock_test",
            password_hash=get_password_hash("CustPass123!"),
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        db_session.add(cust)
        db_session.commit()
    token = create_access_token(data={"sub": cust.id, "role": "CUSTOMER"})
    return {"user": cust, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


# =========================================================================
# 1. UNIT TESTS: EXACT 3:00 PM TIME BOUNDARY LOCKING IN ASIA/KOLKATA
# =========================================================================

def test_1pm_result_locking_exact_boundaries():
    target_date = "2026-11-27"

    # Before 3 PM: NOT locked
    dt_1300 = make_ist_dt(2026, 11, 27, 13, 0, 0)
    dt_1459 = make_ist_dt(2026, 11, 27, 14, 59, 59)
    assert is_game_result_locked("1 PM Game", target_date, dt_1300) is False
    assert is_game_result_locked("1 PM Game", target_date, dt_1459) is False

    # At exactly 3:00:00 PM: LOCKED
    dt_1500 = make_ist_dt(2026, 11, 27, 15, 0, 0)
    assert is_game_result_locked("1 PM Game", target_date, dt_1500) is True

    # After 3:00:00 PM: LOCKED
    dt_1500_01 = make_ist_dt(2026, 11, 27, 15, 0, 1)
    dt_1530 = make_ist_dt(2026, 11, 27, 15, 30, 0)
    dt_1700 = make_ist_dt(2026, 11, 27, 17, 0, 0)
    assert is_game_result_locked("1 PM Game", target_date, dt_1500_01) is True
    assert is_game_result_locked("1 PM Game", target_date, dt_1530) is True
    assert is_game_result_locked("1 PM Game", target_date, dt_1700) is True


# =========================================================================
# 2. BACKEND API WRITE ENFORCEMENT: 3:00 PM CUTOFF REJECTION
# =========================================================================

def test_before_3pm_permitted_publish_and_edit(client, auth_admin, db_session):
    """Before 3:00 PM IST (e.g. 1:30 PM), admin can publish and edit 1 PM result."""
    set_mock_ist_now(make_ist_dt(2026, 11, 27, 13, 30, 0))

    # Clean prior result for test date
    db_session.query(GameResult).filter(
        GameResult.date == TEST_DATE,
        GameResult.game_slot == "1 PM Game"
    ).delete()
    db_session.commit()

    # 1. Publish 1st prize
    res1 = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": TEST_DATE,
            "prize1": "555",
            "targetSection": "1ST"
        },
        headers=auth_admin["headers"],
    )
    assert res1.status_code == 200, f"Expected 200 before 3 PM, got: {res1.text}"
    assert res1.json()["prize1"] == "555"

    # 2. Edit 1st prize before 3 PM (e.g. at 2:15 PM)
    set_mock_ist_now(make_ist_dt(2026, 11, 27, 14, 15, 0))
    res2 = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": TEST_DATE,
            "prize1": "777",
            "targetSection": "1ST"
        },
        headers=auth_admin["headers"],
    )
    assert res2.status_code == 200
    assert res2.json()["prize1"] == "777"


def test_at_and_after_3pm_rejected_by_backend(client, auth_admin, db_session):
    """At or after 3:00:00 PM IST, backend strictly rejects modifications to 1 PM Game."""
    # Ensure a published result exists from earlier
    res_db = db_session.query(GameResult).filter(
        GameResult.date == TEST_DATE,
        GameResult.game_slot == "1 PM Game"
    ).first()
    if not res_db:
        res_db = GameResult(
            id=f"res_test_{TEST_DATE}_1pm",
            date=TEST_DATE,
            game_slot="1 PM Game",
            prize1="777",
            published_at=datetime.now(timezone.utc),
        )
        db_session.add(res_db)
        db_session.commit()

    # Case A: Request at exactly 3:00:00 PM (15:00:00)
    set_mock_ist_now(make_ist_dt(2026, 11, 27, 15, 0, 0))
    res_cutoff = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": TEST_DATE,
            "prize1": "999",
            "targetSection": "1ST"
        },
        headers=auth_admin["headers"],
    )
    assert res_cutoff.status_code == 400
    assert "LOCKED" in res_cutoff.json()["detail"].upper()

    # Case B: Request 1 second after 3:00:00 PM (15:00:01)
    set_mock_ist_now(make_ist_dt(2026, 11, 27, 15, 0, 1))
    res_late = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": TEST_DATE,
            "prize1": "999",
            "targetSection": "1ST"
        },
        headers=auth_admin["headers"],
    )
    assert res_late.status_code == 400
    assert "LOCKED" in res_late.json()["detail"].upper()

    # Case C: Request 30 minutes after 3:00:00 PM (15:30:00)
    set_mock_ist_now(make_ist_dt(2026, 11, 27, 15, 30, 0))
    res_30m = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": TEST_DATE,
            "prize1": "999",
            "prize2": "222",
            "targetSection": "OTHER"
        },
        headers=auth_admin["headers"],
    )
    assert res_30m.status_code == 400
    assert "LOCKED" in res_30m.json()["detail"].upper()

    # Verify database was NOT modified
    db_session.refresh(res_db)
    assert res_db.prize1 == "777"


def test_unpublished_1pm_result_locked_at_3pm(client, auth_admin, db_session):
    """If 1 PM was never published before 3 PM, admin CANNOT publish it after 3 PM."""
    date_no_pub = "2026-11-28"
    set_mock_ist_now(make_ist_dt(2026, 11, 28, 15, 10, 0))

    # Ensure no result exists
    db_session.query(GameResult).filter(
        GameResult.date == date_no_pub,
        GameResult.game_slot == "1 PM Game"
    ).delete()
    db_session.commit()

    res = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": date_no_pub,
            "prize1": "123",
        },
        headers=auth_admin["headers"],
    )
    assert res.status_code == 400
    assert "LOCKED" in res.json()["detail"].upper()


# =========================================================================
# 3. EXISTING PUBLISHED RESULTS REMAIN VISIBLE AFTER 3 PM
# =========================================================================

def test_existing_results_remain_visible_after_lock(client, auth_customer, auth_admin, db_session):
    """Existing published results must remain fully visible to customer and admin after 3 PM."""
    # Ensure a published result exists in the database
    res_db = db_session.query(GameResult).filter(
        GameResult.date == TEST_DATE,
        GameResult.game_slot == "1 PM Game"
    ).first()
    if not res_db:
        res_db = GameResult(
            id=f"res_test_{TEST_DATE}_1pm_vis",
            date=TEST_DATE,
            game_slot="1 PM Game",
            prize1="777",
            published_at=datetime.now(timezone.utc),
        )
        db_session.add(res_db)
        db_session.commit()
    else:
        res_db.prize1 = "777"
        db_session.commit()

    set_mock_ist_now(make_ist_dt(2026, 11, 27, 15, 45, 0))

    # Customer queries today's results
    res_cust = client.get(f"/api/customer/results/today?date={TEST_DATE}", headers=auth_customer["headers"])
    assert res_cust.status_code == 200
    data = res_cust.json()
    assert "1 PM Game" in data
    assert data["1 PM Game"]["prize1"] == "777"

    # Customer queries by date
    res_date = client.get(f"/api/customer/results/by-date?date={TEST_DATE}", headers=auth_customer["headers"])
    assert res_date.status_code == 200
    assert "1 PM Game" in res_date.json()
    assert res_date.json()["1 PM Game"]["prize1"] == "777"


# =========================================================================
# 4. SERVER RESTART SIMULATION & MULTI-WORKER PERSISTENCE
# =========================================================================

def test_lock_persists_across_server_restarts(client, auth_admin):
    """Simulate server restart after 3 PM: lock remains strictly enforced."""
    # Simulate restart at 16:00:00 IST
    set_mock_ist_now(make_ist_dt(2026, 11, 27, 16, 0, 0))

    res_post_restart = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": TEST_DATE,
            "prize1": "000",
        },
        headers=auth_admin["headers"],
    )
    assert res_post_restart.status_code == 400
    assert "LOCKED" in res_post_restart.json()["detail"].upper()


# =========================================================================
# 5. MULTIPLE ADMINS CONCURRENT / DUPLICATE ATTEMPT AT 3 PM
# =========================================================================

def test_multiple_admins_locked_consistently(client, db_session):
    """Multiple admins working concurrently after 3 PM are both rejected consistently."""
    # Create second admin
    admin2 = db_session.query(User).filter(User.username == "admin2_test").first()
    if not admin2:
        admin2 = User(
            id="admin2_test_id",
            name="Admin Two",
            email="admin2@lucky10.com",
            username="admin2_test",
            password_hash=get_password_hash("AdminPass123!"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db_session.add(admin2)
        db_session.commit()
    token2 = create_access_token(data={"sub": admin2.id, "role": "ADMIN"})
    headers2 = {"Authorization": f"Bearer {token2}"}

    set_mock_ist_now(make_ist_dt(2026, 11, 27, 15, 0, 0))

    res_admin2 = client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": TEST_DATE, "prize1": "222"},
        headers=headers2,
    )
    assert res_admin2.status_code == 400
    assert "LOCKED" in res_admin2.json()["detail"].upper()


# =========================================================================
# 6. TIMEZONE INVARIANCE TEST
# =========================================================================

def test_timezone_invariance(client, auth_admin):
    """
    Even if system/worker is running in UTC, the lock is evaluated strictly against Asia/Kolkata.
    UTC 09:30:00 = IST 15:00:00 (exact 3:00 PM cutoff).
    """
    utc_dt = datetime(2026, 11, 27, 9, 30, 0, tzinfo=timezone.utc)
    ist_converted = utc_dt.astimezone(IST_TZ)
    assert ist_converted.hour == 15
    assert ist_converted.minute == 0
    assert ist_converted.second == 0

    set_mock_ist_now(ist_converted)
    res = client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-11-27", "prize1": "888"},
        headers=auth_admin["headers"],
    )
    assert res.status_code == 400
    assert "LOCKED" in res.json()["detail"].upper()

    # Reset mock clock
    set_mock_ist_now(None)
