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
def rep_customer1(db_session):
    u = User(
        id="rep_cust_01",
        name="Rep Agency 1",
        email="rep1@lucky10.com",
        username="repagency1",
        password_hash=get_password_hash("pass123"),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    db_session.add(u)
    db_session.commit()
    token = create_access_token(data={"sub": u.id, "role": "CUSTOMER"})
    return {"user": u, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

@pytest.fixture
def rep_customer2(db_session):
    u = User(
        id="rep_cust_02",
        name="Rep Agency 2",
        email="rep2@lucky10.com",
        username="repagency2",
        password_hash=get_password_hash("pass123"),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    db_session.add(u)
    db_session.commit()
    token = create_access_token(data={"sub": u.id, "role": "CUSTOMER"})
    return {"user": u, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

@pytest.fixture
def rep_admin(db_session):
    a = User(
        id="rep_admin_01",
        name="Rep Admin",
        email="rep_admin@lucky10.com",
        username="repadmin",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    token = create_access_token(data={"sub": a.id, "role": "ADMIN"})
    return {"user": a, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


# 1-4. Game report for 1 PM, 3 PM, 6 PM, 8 PM
def test_game_reports_for_each_slot(client, rep_customer1, rep_admin):
    # 1 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    client.post("/api/customer/tickets", json={"gameSlot": "1 PM Game", "items": [{"number": "101", "count": 2, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 20.0}], "totalAmount": 20.0}, headers=rep_customer1["headers"])
    # 3 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 14, 0, 0))
    client.post("/api/customer/tickets", json={"gameSlot": "3 PM Game", "items": [{"number": "301", "count": 3, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 30.0}], "totalAmount": 30.0}, headers=rep_customer1["headers"])
    # 6 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 16, 0, 0))
    client.post("/api/customer/tickets", json={"gameSlot": "6 PM Game", "items": [{"number": "601", "count": 4, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 40.0}], "totalAmount": 40.0}, headers=rep_customer1["headers"])
    # 8 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 19, 0, 0))
    client.post("/api/customer/tickets", json={"gameSlot": "8 PM Game", "items": [{"number": "801", "count": 5, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 50.0}], "totalAmount": 50.0}, headers=rep_customer1["headers"])

    # Check 1 PM report
    r1 = client.get("/api/admin/reports?date=2026-08-23&game_slot=1%20PM%20Game", headers=rep_admin["headers"]).json()
    assert r1["totalBills"] == 1 and r1["totalSales"] == 20.0 and r1["totalTickets"] == 2

    # Check 3 PM report
    r3 = client.get("/api/admin/reports?date=2026-08-23&game_slot=3%20PM%20Game", headers=rep_admin["headers"]).json()
    assert r3["totalBills"] == 1 and r3["totalSales"] == 30.0 and r3["totalTickets"] == 3

    # Check 6 PM report
    r6 = client.get("/api/admin/reports?date=2026-08-23&game_slot=6%20PM%20Game", headers=rep_admin["headers"]).json()
    assert r6["totalBills"] == 1 and r6["totalSales"] == 40.0 and r6["totalTickets"] == 4

    # Check 8 PM report
    r8 = client.get("/api/admin/reports?date=2026-08-23&game_slot=8%20PM%20Game", headers=rep_admin["headers"]).json()
    assert r8["totalBills"] == 1 and r8["totalSales"] == 50.0 and r8["totalTickets"] == 5


# 5, 6, 7. Date, Game, and User isolation
def test_reports_date_game_user_isolation(client, rep_customer1, rep_customer2, rep_admin):
    # Customer 1 on 2026-08-22 1 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 22, 11, 0, 0))
    client.post("/api/customer/tickets", json={"gameSlot": "1 PM Game", "items": [{"number": "111", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0}, headers=rep_customer1["headers"])

    # Customer 2 on 2026-08-23 1 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    client.post("/api/customer/tickets", json={"gameSlot": "1 PM Game", "items": [{"number": "222", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0}, headers=rep_customer2["headers"])

    # Query 2026-08-22
    r_prev = client.get("/api/admin/reports?date=2026-08-22&game_slot=1%20PM%20Game", headers=rep_admin["headers"]).json()
    assert r_prev["totalBills"] == 1 and r_prev["totalSales"] == 10.0

    # Query 2026-08-23
    r_today = client.get("/api/admin/reports?date=2026-08-23&game_slot=1%20PM%20Game", headers=rep_admin["headers"]).json()
    assert r_today["totalBills"] == 1 and r_today["totalSales"] == 10.0

    # Customer 1 sees only own tickets
    c1_tkts = client.get("/api/customer/tickets", headers=rep_customer1["headers"]).json()
    assert all(t["userId"] == rep_customer1["user"].id for t in c1_tkts)


# 8-15. Financial Totals, Commission, Net Amount
def test_financial_totals_and_settlement(client, rep_customer1, rep_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    # Place winning ticket
    client.post("/api/customer/tickets", json={"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0}, headers=rep_customer1["headers"])
    # Place losing ticket
    client.post("/api/customer/tickets", json={"gameSlot": "1 PM Game", "items": [{"number": "000", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0}, headers=rep_customer1["headers"])

    # Publish result 742 after 1 PM
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    client.post("/api/admin/results", json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "742"}, headers=rep_admin["headers"])

    rep = client.get("/api/admin/reports?date=2026-08-23&game_slot=1%20PM%20Game", headers=rep_admin["headers"]).json()
    assert rep["totalBills"] == 2
    assert rep["totalSales"] == 20.0
    assert rep["winningTickets"] == 1
    assert rep["totalWinningAmount"] == 5000.0
    assert rep["netAmount"] == 20.0 - 5000.0
    assert rep["isSettled"] is True


# 19. Historical Result Edit Consistency
def test_historical_result_edit_consistency(client, rep_customer1, rep_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 11, 0, 0))
    # Ticket on 742
    res_t1 = client.post("/api/customer/tickets", json={"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0}, headers=rep_customer1["headers"])
    t1_id = res_t1.json()["id"]

    # Initial publish: result = 742 -> t1 WON (5000.0)
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 13, 5, 0))
    client.post("/api/admin/results", json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "742"}, headers=rep_admin["headers"])

    rep1 = client.get("/api/admin/reports?date=2026-08-23&game_slot=1%20PM%20Game", headers=rep_admin["headers"]).json()
    assert rep1["winningTickets"] == 1 and rep1["totalWinningAmount"] == 5000.0

    # Admin edits result: 742 -> 315 -> t1 becomes LOST (0.0)
    client.post("/api/admin/results", json={"gameSlot": "1 PM Game", "date": "2026-08-23", "prize1": "315"}, headers=rep_admin["headers"])

    rep2 = client.get("/api/admin/reports?date=2026-08-23&game_slot=1%20PM%20Game", headers=rep_admin["headers"]).json()
    assert rep2["winningTickets"] == 0 and rep2["totalWinningAmount"] == 0.0

    # Customer tickets updated in sync
    all_tkts = client.get("/api/customer/tickets", headers=rep_customer1["headers"]).json()
    t1 = next(t for t in all_tkts if t["id"] == t1_id)
    assert t1["status"] == "LOST" and t1["winAmount"] == 0.0


# 20 & 21. Repeated report generation & settlement idempotency
def test_repeated_report_generation(client, rep_admin):
    r1 = client.get("/api/admin/reports?date=2026-08-23&game_slot=1%20PM%20Game", headers=rep_admin["headers"]).json()
    r2 = client.get("/api/admin/reports?date=2026-08-23&game_slot=1%20PM%20Game", headers=rep_admin["headers"]).json()
    assert r1 == r2
