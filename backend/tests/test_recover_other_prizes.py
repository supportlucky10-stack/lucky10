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
    assert "000" in flat
    assert "008" in flat

# 2. Correct ticket settlement after OTHER publishing (effective_p1 protects tickets)
def test_ticket_settlement_preserved_and_evaluated_during_other_publishing(client, auth_cust, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 14, 0, 0))
    test_date = "2026-08-23"

    # Ticket A: Bets on 1st Prize 942
    tkt_a = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "3 PM Game", "items": [{"number": "942", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_cust["headers"],
    ).json()["id"]

    # Ticket B: Bets on 2nd Prize 944
    tkt_b = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "3 PM Game", "items": [{"number": "944", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_cust["headers"],
    ).json()["id"]

    # Ticket C: Bets on Compliment 018
    tkt_c = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "3 PM Game", "items": [{"number": "018", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_cust["headers"],
    ).json()["id"]

    # Ticket D: Bets on Duplicate Compliment 085 (occurs twice in SAMPLE_30_COMPLIMENTS)
    tkt_d = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "3 PM Game", "items": [{"number": "085", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_cust["headers"],
    ).json()["id"]

    # Ticket E: Bets on losing number 999
    tkt_e = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "3 PM Game", "items": [{"number": "999", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}], "totalAmount": 10.0},
        headers=auth_cust["headers"],
    ).json()["id"]

    # Step 1: Publish 1st Prize = 942
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "3 PM Game", "date": test_date, "prize1": "942", "targetSection": "1ST"},
        headers=auth_admin["headers"],
    )

    tkts_stage1 = client.get("/api/customer/tickets", headers=auth_cust["headers"]).json()
    get_t = lambda tid, tkts: next(t for t in tkts if t["id"] == tid)

    assert get_t(tkt_a, tkts_stage1)["status"] == "WON"
    assert get_t(tkt_a, tkts_stage1)["winAmount"] == 5000.0
    assert get_t(tkt_b, tkts_stage1)["status"] == "LOST"
    assert get_t(tkt_c, tkts_stage1)["status"] == "LOST"
    assert get_t(tkt_d, tkts_stage1)["status"] == "LOST"
    assert get_t(tkt_e, tkts_stage1)["status"] == "LOST"

    # Step 2: Publish OTHER Prizes (req.prize1 is empty, effective_p1 ensures 1st prize stays active)
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 10, 0))
    client.post(
        "/api/admin/results",
        json={
            "gameSlot": "3 PM Game",
            "date": test_date,
            "prize1": "",
            "prize2": "944",
            "prize3": "140",
            "prize4": "079",
            "prize5": "072",
            "compliments": SAMPLE_30_COMPLIMENTS,
            "targetSection": "OTHER"
        },
        headers=auth_admin["headers"],
    )

    tkts_stage2 = client.get("/api/customer/tickets", headers=auth_cust["headers"]).json()

    # Ticket A must STILL be WON with 5000.0 (NOT reset to PENDING or 0.0)
    assert get_t(tkt_a, tkts_stage2)["status"] == "WON"
    assert get_t(tkt_a, tkts_stage2)["winAmount"] == 5000.0

    # Ticket B must be WON with 500.0 (2nd prize)
    assert get_t(tkt_b, tkts_stage2)["status"] == "WON"
    assert get_t(tkt_b, tkts_stage2)["winAmount"] == 500.0

    # Ticket C must be WON with 20.0 (compliment prize: count 1 x 20)
    assert get_t(tkt_c, tkts_stage2)["status"] == "WON"
    assert get_t(tkt_c, tkts_stage2)["winAmount"] == 20.0

    # Ticket D must be WON with 40.0 (duplicate compliments: 2 matches x 20.0)
    assert get_t(tkt_d, tkts_stage2)["status"] == "WON"
    assert get_t(tkt_d, tkts_stage2)["winAmount"] == 40.0

    # Ticket E must remain LOST
    assert get_t(tkt_e, tkts_stage2)["status"] == "LOST"
    assert get_t(tkt_e, tkts_stage2)["winAmount"] == 0.0

# 3. Saving and retrieving all 30 compliments with leading zeros and duplicates
def test_saving_and_retrieving_30_compliments_with_leading_zeros(client, auth_admin):
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 10, 0))
    test_date = "2026-08-23"

    compliments_with_zeros = [
        ["000", "008", "095", "070", "085"],
        ["085", "001", "002", "003", "004"],
        ["005", "006", "007", "009", "010"],
        ["011", "012", "013", "014", "015"],
        ["016", "017", "018", "019", "020"],
        ["022", "023", "024", "025", "026"]
    ]

    client.post(
        "/api/admin/results",
        json={
            "gameSlot": "3 PM Game",
            "date": test_date,
            "prize1": "942",
            "prize2": "002",
            "prize3": "003",
            "prize4": "004",
            "prize5": "005",
            "compliments": compliments_with_zeros,
            "targetSection": "OTHER"
        },
        headers=auth_admin["headers"],
    )

    res = client.get(f"/api/customer/results/by-date?date={test_date}").json()
    retrieved = res["3 PM Game"]["compliments"]
    flat_retrieved = [n for sub in retrieved for n in sub]

    assert len(flat_retrieved) == 30
    assert flat_retrieved[0] == "000"
    assert flat_retrieved[1] == "008"
    assert flat_retrieved[2] == "095"
    # Duplicate preservation check
    assert flat_retrieved.count("085") == 2
    # Ensure all strings are exactly 3 characters
    for num in flat_retrieved:
        assert len(num) == 3

# 4. Another game slot's result (e.g. 6 PM) remains completely untouched
def test_another_game_slot_unaffected_during_3pm_other_publish(client, auth_admin):
    test_date = "2026-08-23"

    # Setup 6 PM Game with full results
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 18, 5, 0))
    client.post(
        "/api/admin/results",
        json={
            "gameSlot": "6 PM Game",
            "date": test_date,
            "prize1": "543",
            "prize2": "766",
            "prize3": "855",
            "prize4": "262",
            "prize5": "095",
            "compliments": SAMPLE_30_COMPLIMENTS,
        },
        headers=auth_admin["headers"],
    )

    # Setup 3 PM Game with only 1st prize
    set_mock_ist_now(make_ist_dt(2026, 8, 23, 15, 5, 0))
    client.post(
        "/api/admin/results",
        json={"gameSlot": "3 PM Game", "date": test_date, "prize1": "942", "targetSection": "1ST"},
        headers=auth_admin["headers"],
    )

    # Now update 3 PM Game other prizes
    client.post(
        "/api/admin/results",
        json={
            "gameSlot": "3 PM Game",
            "date": test_date,
            "prize1": "",
            "prize2": "944",
            "prize3": "140",
            "prize4": "079",
            "prize5": "072",
            "compliments": SAMPLE_30_COMPLIMENTS,
            "targetSection": "OTHER"
        },
        headers=auth_admin["headers"],
    )

    # Check 6 PM Game
    res = client.get(f"/api/customer/results/by-date?date={test_date}").json()
    res_6pm = res["6 PM Game"]

    assert res_6pm["prize1"] == "543"
    assert res_6pm["prize2"] == "766"
    assert res_6pm["prize3"] == "855"
    assert res_6pm["prize4"] == "262"
    assert res_6pm["prize5"] == "095"
    assert len(res_6pm["compliments"]) == 6
