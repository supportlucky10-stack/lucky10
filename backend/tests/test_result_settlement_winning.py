import pytest
from datetime import datetime, timezone, timedelta
from app.core.game_timing import set_mock_ist_now, IST_TZ
from app.models.user import User, UserRole
from app.models.game_result import GameResult
from app.models.ticket import Ticket, BetItem
from app.core.security import create_access_token, get_password_hash

def make_ist_dt(year, month, day, hour, minute, second):
    return datetime(year, month, day, hour, minute, second, tzinfo=IST_TZ)

@pytest.fixture
def auth_customer1(db_session):
    u1 = User(
        id="cust_settle_01",
        name="Agency Alpha",
        email="alpha@lucky10.com",
        username="agencyalpha",
        password_hash=get_password_hash("pass123"),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    db_session.add(u1)
    db_session.commit()
    token = create_access_token(data={"sub": u1.id, "role": "CUSTOMER"})
    return {"user": u1, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

@pytest.fixture
def auth_customer2(db_session):
    u2 = User(
        id="cust_settle_02",
        name="Agency Beta",
        email="beta@lucky10.com",
        username="agencybeta",
        password_hash=get_password_hash("pass123"),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    db_session.add(u2)
    db_session.commit()
    token = create_access_token(data={"sub": u2.id, "role": "CUSTOMER"})
    return {"user": u2, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

@pytest.fixture
def auth_admin_user(db_session):
    a = User(
        id="admin_settle_01",
        name="Admin Boss",
        email="admin_boss@lucky10.com",
        username="adminboss",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    token = create_access_token(data={"sub": a.id, "role": "ADMIN"})
    return {"user": a, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


# 1. Published 1 PM result matches only 1 PM tickets
def test_1pm_result_matches_only_1pm_tickets(client, auth_customer1, auth_admin_user):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    # 1 PM ticket
    res1 = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    assert res1.status_code == 200
    t1_id = res1.json()["id"]

    # 3 PM ticket
    res2 = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "3 PM Game", "items": [{"number": "742", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    assert res2.status_code == 200
    t2_id = res2.json()["id"]

    # Publish 1 PM result = 742
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "742"},
        headers=auth_admin_user["headers"],
    )

    all_tkts = client.get("/api/customer/tickets", headers=auth_customer1["headers"]).json()
    t1 = next(t for t in all_tkts if t["id"] == t1_id)
    t2 = next(t for t in all_tkts if t["id"] == t2_id)

    assert t1["status"] == "WON"
    assert t1["winAmount"] == 5000.0
    assert t2["status"] == "PENDING"
    assert t2["winAmount"] == 0.0


# 2, 3, 4. Published 3 PM, 6 PM, 8 PM exact slot matching
def test_3pm_6pm_8pm_slot_matching(client, auth_customer1, auth_admin_user):
    # 3 PM ticket placed before 3 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 14, 0, 0))
    res3 = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "3 PM Game", "items": [{"number": "333", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    t3_id = res3.json()["id"]

    # 6 PM ticket placed before 6 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 16, 0, 0))
    res6 = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "6 PM Game", "items": [{"number": "666", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    t6_id = res6.json()["id"]

    # 8 PM ticket placed before 8 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 19, 0, 0))
    res8 = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "8 PM Game", "items": [{"number": "888", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    t8_id = res8.json()["id"]

    # Publish 3 PM result = 333
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "3 PM Game", "date": "2026-08-23", "prize1": "333"},
        headers=auth_admin_user["headers"],
    )

    # Publish 6 PM result = 666
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 18, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "6 PM Game", "date": "2026-08-23", "prize1": "666"},
        headers=auth_admin_user["headers"],
    )

    # Publish 8 PM result = 888
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 20, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "8 PM Game", "date": "2026-08-23", "prize1": "888"},
        headers=auth_admin_user["headers"],
    )

    all_tkts = client.get("/api/customer/tickets", headers=auth_customer1["headers"]).json()
    t3 = next(t for t in all_tkts if t["id"] == t3_id)
    t6 = next(t for t in all_tkts if t["id"] == t6_id)
    t8 = next(t for t in all_tkts if t["id"] == t8_id)

    assert t3["status"] == "WON" and t3["winAmount"] == 5000.0
    assert t6["status"] == "WON" and t6["winAmount"] == 5000.0
    assert t8["status"] == "WON" and t8["winAmount"] == 5000.0


# 5. Previous day's tickets never match today's result
def test_previous_days_tickets_never_match_today(client, auth_customer1, auth_admin_user):
    # Yesterday ticket placed on 2026-08-22
    set_mock_ist_now(make_ist_dt(2026, 8, 22, 11, 0, 0))
    res_y = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "999", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    ty_id = res_y.json()["id"]

    # Today 1 PM result = 999 on 2026-08-23
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "999"},
        headers=auth_admin_user["headers"],
    )

    all_tkts = client.get("/api/customer/tickets", headers=auth_customer1["headers"]).json()
    ty = next(t for t in all_tkts if t["id"] == ty_id)
    assert ty["status"] == "PENDING"
    assert ty["winAmount"] == 0.0


# 6. Winning calculation uses existing prize rules (1D, 2D, 3D Super, Box)
def test_prize_rules_1d_2d_3d_super_box(client, auth_customer1, auth_admin_user):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    # Direct 1D position A on 7
    res_1d = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "A:7", "count": 1, "type": "Position", "unitPrice": 12.0, "totalAmount": 12.0}], "totalAmount": 12.0},
        headers=auth_customer1["headers"],
    )
    t_1d_id = res_1d.json()["id"]

    # Direct 2D pair AB on 74
    res_2d = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "AB:74", "count": 1, "type": "Pair", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    t_2d_id = res_2d.json()["id"]

    # 3D Box (Shuffle) permutation on 427 for result 742 (Ulta-Turn: 80x = 800)
    res_box = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "427", "count": 1, "type": "BOX", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    t_box_id = res_box.json()["id"]

    # Publish 1 PM result = 742 (p1="742")
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "742"},
        headers=auth_admin_user["headers"],
    )

    all_tkts = client.get("/api/customer/tickets", headers=auth_customer1["headers"]).json()
    t_1d = next(t for t in all_tkts if t["id"] == t_1d_id)
    t_2d = next(t for t in all_tkts if t["id"] == t_2d_id)
    t_box = next(t for t in all_tkts if t["id"] == t_box_id)

    # A:7 matches 1st digit 7 -> win = 500 / 15 * 1 count = 500 / 15
    assert t_1d["status"] == "WON"
    # AB:74 matches pair 74 -> 700.0
    assert t_2d["status"] == "WON" and t_2d["winAmount"] == 700.0
    # 427 permutation of 742 -> 800.0
    assert t_box["status"] == "WON" and t_box["winAmount"] == 800.0


# 7. 30 Compliment calculation uses existing rules
def test_30_compliment_matching_rules(client, auth_customer1, auth_admin_user):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    # Place 3D bet on compliment number "105"
    res_comp = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "105", "count": 2, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 20.0}], "totalAmount": 20.0},
        headers=auth_customer1["headers"],
    )
    t_comp_id = res_comp.json()["id"]

    # Publish result with 105 in compliments
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    client.post(
        "/api/admin/results",
        json={
            "gameSlot": "1 PM Game",
            "date": "2026-08-23",
            "prize1": "742",
            "prize2": "111",
            "compliments": ["101", "102", "103", "104", "105", "106"],
        },
        headers=auth_admin_user["headers"],
    )

    all_tkts = client.get("/api/customer/tickets", headers=auth_customer1["headers"]).json()
    t_comp = next(t for t in all_tkts if t["id"] == t_comp_id)
    # Compliment prize: 20 per 1 count -> 2 counts = 40.0
    assert t_comp["status"] == "WON"
    assert t_comp["winAmount"] == 40.0


# 11 & 12. Idempotency: Running settlement twice creates no duplicates
def test_settlement_idempotency(client, auth_customer1, auth_admin_user, db_session):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    res = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    tkt_id = res.json()["id"]

    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    # Run publish 1
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "742"},
        headers=auth_admin_user["headers"],
    )
    # Run publish 2
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "742"},
        headers=auth_admin_user["headers"],
    )

    # Check only 1 GameResult row exists
    res_count = db_session.query(GameResult).filter(GameResult.date == "2026-08-23", GameResult.game_slot == "1 PM Game").count()
    assert res_count == 1

    tkt = db_session.query(Ticket).filter(Ticket.id == tkt_id).first()
    assert tkt.status == "WON"
    assert tkt.win_amount == 5000.0


# 13. User sees only own winning records
def test_user_isolation_for_winning_tickets(client, auth_customer1, auth_customer2, auth_admin_user):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    res1 = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_customer1["headers"],
    )
    res2 = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 2, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 20.0}], "totalAmount": 20.0},
        headers=auth_customer2["headers"],
    )

    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "742"},
        headers=auth_admin_user["headers"],
    )

    c1_tkts = client.get("/api/customer/tickets", headers=auth_customer1["headers"]).json()
    c2_tkts = client.get("/api/customer/tickets", headers=auth_customer2["headers"]).json()

    assert all(t["userId"] == auth_customer1["user"].id for t in c1_tkts)
    assert all(t["userId"] == auth_customer2["user"].id for t in c2_tkts)
    assert len(c1_tkts) == 1 and c1_tkts[0]["winAmount"] == 5000.0
    assert len(c2_tkts) == 1 and c2_tkts[0]["winAmount"] == 10000.0
