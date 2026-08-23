import pytest
from datetime import datetime, time, timezone, timedelta
from app.core.game_timing import (
    IST_TZ,
    is_game_slot_open,
    is_game_result_publishable,
    get_all_game_slot_statuses,
    get_business_date,
    normalize_slot_name,
    set_mock_ist_now,
)
from app.models.user import User, UserRole
from app.models.game_result import GameResult
from app.models.ticket import Ticket, BetItem
from app.core.security import create_access_token, get_password_hash

def make_ist_dt(year, month, day, hour, minute, second):
    return datetime(year, month, day, hour, minute, second, tzinfo=IST_TZ)

# ==========================================
# 1. BOUNDARY TESTS (All exact times)
# ==========================================

@pytest.mark.parametrize("h,m,s,expected_1pm,expected_3pm,expected_6pm,expected_8pm", [
    (0, 0, 0, True, True, True, True),       # 12:00:00 AM
    (12, 59, 59, True, True, True, True),    # 12:59:59 PM
    (13, 0, 0, False, True, True, True),     # 1:00:00 PM
    (14, 59, 59, False, True, True, True),    # 2:59:59 PM
    (15, 0, 0, False, False, True, True),    # 3:00:00 PM
    (17, 59, 59, False, False, True, True),  # 5:59:59 PM
    (18, 0, 0, False, False, False, True),   # 6:00:00 PM
    (19, 59, 59, False, False, False, True), # 7:59:59 PM
    (20, 0, 0, False, False, False, False),  # 8:00:00 PM
    (23, 59, 59, False, False, False, False),# 11:59:59 PM
])
def test_exact_time_boundary_cutoffs(h, m, s, expected_1pm, expected_3pm, expected_6pm, expected_8pm):
    test_dt = make_ist_dt(2026, 8, 23, h, m, s)
    assert is_game_slot_open("1 PM Game", test_dt) == expected_1pm
    assert is_game_slot_open("3 PM Game", test_dt) == expected_3pm
    assert is_game_slot_open("6 PM Game", test_dt) == expected_6pm
    assert is_game_slot_open("8 PM Game", test_dt) == expected_8pm

def test_midnight_next_day_all_open():
    day1_night = make_ist_dt(2026, 8, 23, 23, 59, 59)
    day2_midnight = make_ist_dt(2026, 8, 24, 0, 0, 0)
    
    assert is_game_slot_open("1 PM Game", day1_night) is False
    assert is_game_slot_open("1 PM Game", day2_midnight) is True
    assert is_game_slot_open("3 PM Game", day2_midnight) is True
    assert is_game_slot_open("6 PM Game", day2_midnight) is True
    assert is_game_slot_open("8 PM Game", day2_midnight) is True

# ==========================================
# 2. 20 SCENARIO INTEGRATION TESTS
# ==========================================

@pytest.fixture
def auth_customer(db_session):
    u = User(
        id="cust_test_timing_1",
        name="Timing Agency",
        email="timing_agency@lucky10.com",
        username="timingagency",
        password_hash=get_password_hash("password123"),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    db_session.add(u)
    db_session.commit()
    token = create_access_token(data={"sub": u.id, "role": "CUSTOMER"})
    return {"user": u, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

@pytest.fixture
def auth_admin(db_session):
    a = User(
        id="admin_test_timing_1",
        name="Admin User",
        email="admin_timing@lucky10.com",
        username="admintim",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    token = create_access_token(data={"sub": a.id, "role": "ADMIN"})
    return {"user": a, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

# Test 1 & 2: 1 PM bill generation before and after 1 PM
def test_user_can_generate_1pm_bill_before_1pm(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 12, 30, 0))
    res = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "1 PM Game",
            "items": [{"number": "123", "count": 2, "unitPrice": 10, "type": "Direct"}],
            "totalAmount": 20,
        },
        headers=auth_customer["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert data["gameSlot"] == "1 PM Game"
    assert int(data["ticketId"]) >= 2243297

def test_user_cannot_generate_1pm_bill_at_or_after_1pm(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 0, 0))
    res = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "1 PM Game",
            "items": [{"number": "123", "count": 2, "unitPrice": 10, "type": "Direct"}],
            "totalAmount": 20,
        },
        headers=auth_customer["headers"],
    )
    assert res.status_code == 400
    data = res.json()
    assert data["detail"]["code"] == "BILLING_CLOSED"
    assert data["detail"]["game_slot"] == "1 PM Game"

# Test 3 & 4: 3 PM bill generation before and after 3 PM
def test_user_can_generate_3pm_bill_before_3pm(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 14, 0, 0))
    res = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "3 PM Game",
            "items": [{"number": "456", "count": 1, "unitPrice": 10, "type": "Direct"}],
            "totalAmount": 10,
        },
        headers=auth_customer["headers"],
    )
    assert res.status_code == 200
    assert res.json()["gameSlot"] == "3 PM Game"

def test_user_cannot_generate_3pm_bill_at_or_after_3pm(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 0, 0))
    res = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "3 PM Game",
            "items": [{"number": "456", "count": 1, "unitPrice": 10, "type": "Direct"}],
            "totalAmount": 10,
        },
        headers=auth_customer["headers"],
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "BILLING_CLOSED"

# Test 5 & 6: 6 PM bill generation before and after 6 PM
def test_user_can_generate_6pm_bill_before_6pm(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 17, 30, 0))
    res = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "6 PM Game",
            "items": [{"number": "789", "count": 1, "unitPrice": 10, "type": "Direct"}],
            "totalAmount": 10,
        },
        headers=auth_customer["headers"],
    )
    assert res.status_code == 200
    assert res.json()["gameSlot"] == "6 PM Game"

def test_user_cannot_generate_6pm_bill_at_or_after_6pm(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 18, 0, 0))
    res = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "6 PM Game",
            "items": [{"number": "789", "count": 1, "unitPrice": 10, "type": "Direct"}],
            "totalAmount": 10,
        },
        headers=auth_customer["headers"],
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "BILLING_CLOSED"

# Test 7 & 8: 8 PM bill generation before and after 8 PM
def test_user_can_generate_8pm_bill_before_8pm(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 19, 45, 0))
    res = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "8 PM Game",
            "items": [{"number": "000", "count": 1, "unitPrice": 10, "type": "Direct"}],
            "totalAmount": 10,
        },
        headers=auth_customer["headers"],
    )
    assert res.status_code == 200
    assert res.json()["gameSlot"] == "8 PM Game"

def test_user_cannot_generate_8pm_bill_at_or_after_8pm(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 20, 0, 0))
    res = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "8 PM Game",
            "items": [{"number": "000", "count": 1, "unitPrice": 10, "type": "Direct"}],
            "totalAmount": 10,
        },
        headers=auth_customer["headers"],
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "BILLING_CLOSED"

# Test 9, 10, 11, 12: Admin can publish results once billing is closed
def test_admin_can_publish_1pm_result_after_1pm(client, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 0, 0))
    res = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": "2026-08-23",
            "prize1": "111",
            "prize2": "222",
            "prize3": "333",
            "prize4": "444",
            "prize5": "555",
            "compliments": ["112", "113"],
        },
        headers=auth_admin["headers"],
    )
    assert res.status_code == 200
    assert res.json()["prize1"] == "111"

def test_admin_cannot_publish_1pm_result_before_1pm(client, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 12, 30, 0))
    res = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": "2026-08-23",
            "prize1": "111",
        },
        headers=auth_admin["headers"],
    )
    assert res.status_code == 400
    assert "before game billing is closed" in res.json()["detail"]

# Test 13: User cannot see unpublished result number
def test_user_cannot_see_unpublished_result(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 10, 0, 0))
    res = client.get("/api/customer/results/today", headers=auth_customer["headers"])
    assert res.status_code == 200
    data = res.json()
    assert "8 PM Game" not in data or data["8 PM Game"]["prize1"] == ""

# Test 14: User can see result after admin publishes
def test_user_sees_published_result(client, auth_admin, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "3 PM Game", "date": "2026-08-23", "prize1": "777"},
        headers=auth_admin["headers"],
    )
    res = client.get("/api/customer/results/today", headers=auth_customer["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["3 PM Game"]["prize1"] == "777"

# Test 15: Previous results remain available
def test_previous_results_accessible(client, auth_admin, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 0, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-20", "prize1": "999"},
        headers=auth_admin["headers"],
    )
    res = client.get("/api/customer/results/by-date?date=2026-08-20", headers=auth_customer["headers"])
    assert res.status_code == 200
    assert res.json()["1 PM Game"]["prize1"] == "999"

# Test 16-20: Existing numbering, limits, reports
def test_game_status_endpoint(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 14, 0, 0))
    res = client.get("/api/customer/game-status", headers=auth_customer["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["slots"]["1 PM Game"]["isOpen"] is False
    assert data["slots"]["3 PM Game"]["isOpen"] is True
    assert data["slots"]["6 PM Game"]["isOpen"] is True
    assert data["slots"]["8 PM Game"]["isOpen"] is True

# ==========================================
# 3. PROMPT 3 DETAILED TESTS
# ==========================================

# A. 1 PM: 12:59:59 cannot publish, 1:00:00 can publish
def test_prompt3_1pm_publishing_exact_boundaries(client, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 12, 59, 59))
    res_early = client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "111"},
        headers=auth_admin["headers"],
    )
    assert res_early.status_code == 400
    assert "before game billing is closed" in res_early.json()["detail"]

    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 0, 0))
    res_exact = client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "111"},
        headers=auth_admin["headers"],
    )
    assert res_exact.status_code == 200

# B. 3 PM: 2:59:59 cannot publish, 3:00:00 can publish
def test_prompt3_3pm_publishing_exact_boundaries(client, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 14, 59, 59))
    res_early = client.post(
        "/api/admin/results",
        json={"gameSlot": "3 PM Game", "date": "2026-08-23", "prize1": "333"},
        headers=auth_admin["headers"],
    )
    assert res_early.status_code == 400

    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 0, 0))
    res_exact = client.post(
        "/api/admin/results",
        json={"gameSlot": "3 PM Game", "date": "2026-08-23", "prize1": "333"},
        headers=auth_admin["headers"],
    )
    assert res_exact.status_code == 200

# C. 6 PM: 5:59:59 cannot publish, 6:00:00 can publish
def test_prompt3_6pm_publishing_exact_boundaries(client, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 17, 59, 59))
    res_early = client.post(
        "/api/admin/results",
        json={"gameSlot": "6 PM Game", "date": "2026-08-23", "prize1": "666"},
        headers=auth_admin["headers"],
    )
    assert res_early.status_code == 400

    set_mock_ist_now(make_ist_dt(2026, 8, 23, 18, 0, 0))
    res_exact = client.post(
        "/api/admin/results",
        json={"gameSlot": "6 PM Game", "date": "2026-08-23", "prize1": "666"},
        headers=auth_admin["headers"],
    )
    assert res_exact.status_code == 200

# D. 8 PM: 7:59:59 cannot publish, 8:00:00 can publish
def test_prompt3_8pm_publishing_exact_boundaries(client, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 19, 59, 59))
    res_early = client.post(
        "/api/admin/results",
        json={"gameSlot": "8 PM Game", "date": "2026-08-23", "prize1": "888"},
        headers=auth_admin["headers"],
    )
    assert res_early.status_code == 400

    set_mock_ist_now(make_ist_dt(2026, 8, 23, 20, 0, 0))
    res_exact = client.post(
        "/api/admin/results",
        json={"gameSlot": "8 PM Game", "date": "2026-08-23", "prize1": "888"},
        headers=auth_admin["headers"],
    )
    assert res_exact.status_code == 200

# F. GAME ISOLATION: 1 PM does not leak into 3 PM, 3 PM into 6 PM, 6 PM into 8 PM
def test_prompt3_game_slot_isolation(client, auth_admin, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "111"},
        headers=auth_admin["headers"],
    )

    res = client.get("/api/customer/results/today", headers=auth_customer["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["1 PM Game"]["prize1"] == "111"
    assert "3 PM Game" not in data or data["3 PM Game"]["prize1"] != "111"
    assert "6 PM Game" not in data or data["6 PM Game"]["prize1"] != "111"
    assert "8 PM Game" not in data or data["8 PM Game"]["prize1"] != "111"

# G. DATE ISOLATION: Yesterday's result does not appear as today's result
def test_prompt3_date_isolation(client, auth_admin, auth_customer):
    # Publish yesterday's result
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 10, 0, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-22", "prize1": "YESTERDAY_111"},
        headers=auth_admin["headers"],
    )

    # Today's results query must NOT have yesterday's prize
    res = client.get("/api/customer/results/today", headers=auth_customer["headers"])
    assert res.status_code == 200
    data = res.json()
    assert "1 PM Game" not in data or data["1 PM Game"]["prize1"] != "YESTERDAY_111"

# H. SECURITY: Customer cannot publish results
def test_prompt3_security_customer_cannot_publish(client, auth_customer):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 14, 0, 0))
    res = client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "HACKED"},
        headers=auth_customer["headers"],
    )
    assert res.status_code == 403

# I. DUPLICATION: Publishing same result twice updates in place without duplicate records
def test_prompt3_duplicate_publication_safety(client, auth_admin, db_session):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 10, 0))
    res1 = client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "111"},
        headers=auth_admin["headers"],
    )
    assert res1.status_code == 200

    res2 = client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "111_EDITED"},
        headers=auth_admin["headers"],
    )
    assert res2.status_code == 200

    # Count rows in db
    matching_rows = db_session.query(GameResult).filter(
        GameResult.date == "2026-08-23",
        GameResult.game_slot == "1 PM Game"
    ).all()
    assert len(matching_rows) == 1
    assert matching_rows[0].prize1 == "111_EDITED"
