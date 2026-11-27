import pytest
from datetime import datetime, timezone
import json
from app.core.game_timing import set_mock_ist_now, IST_TZ
from app.models.user import User, UserRole
from app.models.game_result import GameResult
from app.core.security import create_access_token, get_password_hash

def make_ist_dt(year, month, day, hour, minute, second):
    return datetime(year, month, day, hour, minute, second, tzinfo=IST_TZ)

@pytest.fixture
def auth_cust(db_session):
    u = User(
        id="cust_rec_01",
        name="Agency Recovery",
        email="rec@lucky10.com",
        username="agencyrec",
        password_hash=get_password_hash("pass123"),
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
        id="admin_rec_01",
        name="Admin Recovery",
        email="admin_rec@lucky10.com",
        username="adminrec",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    token = create_access_token(data={"sub": a.id, "role": "ADMIN"})
    return {"user": a, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

SAMPLE_30_COMPLIMENTS = [
    ["000", "018", "021", "070", "085"],
    ["085", "091", "092", "182", "259"],
    ["307", "326", "335", "372", "389"],
    ["399", "464", "487", "541", "554"],
    ["561", "585", "603", "638", "714"],
    ["782", "789", "847", "871", "008"]
]

# 1. Publishing OTHER prizes preserves existing First Prize
def test_publishing_other_prizes_preserves_existing_first_prize(client, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 10, 0))
    test_date = "2026-08-23"

    # Stage 1: Publish 1st Prize = 942
    res1 = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "3 PM Game",
            "date": test_date,
            "prize1": "942",
            "targetSection": "1ST"
        },
        headers=auth_admin["headers"],
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["prize1"] == "942"
    assert data1["prize2"] == ""
    assert data1["publishedAt1st"] is not None
    assert data1["publishedAtOther"] is None

    # Stage 2: Publish OTHER prizes (prize1 omitted or empty)
    res2 = client.post(
        "/api/admin/results",
        json={
            "gameSlot": "3 PM Game",
            "date": test_date,
            "prize1": "",  # Intentionally omitted / empty in OTHER stage
            "prize2": "944",
            "prize3": "140",
            "prize4": "079",
            "prize5": "072",
            "compliments": SAMPLE_30_COMPLIMENTS,
            "targetSection": "OTHER"
        },
        headers=auth_admin["headers"],
    )
    assert res2.status_code == 200
    data2 = res2.json()

    # Verify 1st Prize remains intact
    assert data2["prize1"] == "942"
    assert data2["prize2"] == "944"
    assert data2["prize3"] == "140"
    assert data2["prize4"] == "079"
    assert data2["prize5"] == "072"
    assert data2["publishedAt1st"] is not None
    assert data2["publishedAtOther"] is not None

    # Verify customer API reads the complete merged result
    res_cust = client.get(f"/api/customer/results/by-date?date={test_date}").json()
    slot_res = res_cust["3 PM Game"]
    assert slot_res["prize1"] == "942"
    assert slot_res["prize2"] == "944"
    assert slot_res["prize3"] == "140"
    assert slot_res["prize4"] == "079"
    assert slot_res["prize5"] == "072"
    assert len(slot_res["compliments"]) == 6
    flat = [num for sub in slot_res["compliments"] for num in sub]
    assert len(flat) == 30
    assert flat[0] == "000"
    assert flat[-1] == "008"


# 2. Ticket settlement correctly preserves 1st prize winnings after OTHER prizes are published
def test_two_stage_publishing_preserves_ticket_settlement(client, auth_cust, auth_admin):
    # Customer places ticket on 3 PM Game before cutoff
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 14, 30, 0))
    test_date = "2026-08-23"

    ticket_payload = {
        "gameSlot": "3 PM Game",
        "customerName": "Ramesh",
        "items": [
            # 1st prize match (942) -> 1 * 5000 = 5000
            {"number": "942", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0},
            # 2nd prize match (944) -> 1 * 500 = 500
            {"number": "944", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0},
            # Duplicate compliment match (085 appears twice) -> 1 * 20 * 2 = 40
            {"number": "085", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0},
            # Non-winning number
            {"number": "111", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0},
        ],
        "totalAmount": 40.0,
    }
    tkt_resp = client.post("/api/customer/tickets", json=ticket_payload, headers=auth_cust["headers"])
    assert tkt_resp.status_code == 200
    tkt_id = tkt_resp.json()["id"]

    # Stage 1: Publish 1st Prize ONLY at 15:05
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "3 PM Game", "date": test_date, "prize1": "942", "targetSection": "1ST"},
        headers=auth_admin["headers"],
    )

    # Verify ticket won 1st prize (5000)
    rep1 = client.get(f"/api/admin/reports?date={test_date}&game_slot=3 PM Game", headers=auth_admin["headers"]).json()
    assert rep1["totalWinningAmount"] == 5000.0
    assert rep1["winningTickets"] == 1
    assert rep1["isSettled"] is True

    # Stage 2: Publish OTHER prizes at 15:15 (with prize1 empty in payload)
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 15, 0))
    client.post(
        "/api/admin/results",
        json={
            "gameSlot": "3 PM Game",
            "date": test_date,
            "prize1": "",  # Empty in payload
            "prize2": "944",
            "prize3": "140",
            "prize4": "079",
            "prize5": "072",
            "compliments": SAMPLE_30_COMPLIMENTS,
            "targetSection": "OTHER",
        },
        headers=auth_admin["headers"],
    )

    # Verify ticket maintained 1st prize (5000) PLUS 2nd prize (500) PLUS 2x compliments on 085 (40) = 5540
    rep2 = client.get(f"/api/admin/reports?date={test_date}&game_slot=3 PM Game", headers=auth_admin["headers"]).json()
    assert rep2["totalWinningAmount"] == 5540.0
    assert rep2["winningTickets"] == 1
    assert rep2["isSettled"] is True
    assert rep2["totalSales"] == 40.0
    assert rep2["netAmount"] == 40.0 - 5540.0

    # Ensure clean mock reset
    set_mock_ist_now(None)


# 3. Timezone serialization helper tests for to_utc_iso
def test_to_utc_iso_serialization():
    from app.routers.customer import to_utc_iso, format_result

    # Case 1: None returns None
    assert to_utc_iso(None) is None

    # Case 2: Timezone-naive UTC datetime (typical DB reload) gets explicit +00:00 offset
    naive_dt = datetime(2026, 11, 27, 9, 30, 0, 123456)
    res_naive = to_utc_iso(naive_dt)
    assert res_naive == "2026-11-27T09:30:00.123456+00:00"
    assert res_naive.endswith("+00:00")

    # Case 3: Timezone-aware IST datetime converts correctly to UTC instant
    ist_dt = datetime(2026, 11, 27, 15, 0, 0, tzinfo=IST_TZ)
    res_ist = to_utc_iso(ist_dt)
    assert res_ist == "2026-11-27T09:30:00+00:00"
    assert res_ist.endswith("+00:00")

    # Case 4: Timezone-aware UTC datetime preserves UTC instant
    utc_dt = datetime(2026, 11, 27, 9, 30, 0, tzinfo=timezone.utc)
    res_utc = to_utc_iso(utc_dt)
    assert res_utc == "2026-11-27T09:30:00+00:00"

    # Case 5: format_result applies to_utc_iso consistently
    test_gr = GameResult(
        id="res_test_tz",
        date="2026-11-27",
        game_slot="3 PM Game",
        prize1="942",
        published_at=naive_dt,
        published_at_1st=naive_dt,
        published_at_other=None,
    )
    formatted = format_result(test_gr)
    assert formatted["publishedAt"] == "2026-11-27T09:30:00.123456+00:00"
    assert formatted["publishedAt1st"] == "2026-11-27T09:30:00.123456+00:00"
    assert formatted["publishedAtOther"] is None

