import pytest
from datetime import datetime, timezone
from app.models.limit_rule import BlockedNumberRule, AgencyNumberLimit, GlobalLimitRule
from app.models.ticket import Ticket
from app.models.user import User

def test_negative_ticket_amount_rejected(client, customer_token_headers):
    # Attempting to submit a negative ticket total
    response = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "3 PM Game",
            "actionType": "PAY",
            "totalAmount": -50.0,
            "items": [{"number": "123", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": -50.0}]
        },
        headers=customer_token_headers
    )
    assert response.status_code in (400, 422)

def test_zero_item_count_rejected(client, customer_token_headers):
    response = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "3 PM Game",
            "actionType": "PAY",
            "totalAmount": 0.0,
            "items": [{"number": "123", "count": 0, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 0.0}]
        },
        headers=customer_token_headers
    )
    assert response.status_code in (400, 422)

def test_tampered_client_total_corrected(client, db_session, test_customer_user, customer_token_headers):
    # Client sends fake totalAmount = 10, but 5 items @ 10 = 50
    response = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "3 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "123", "count": 5, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        },
        headers=customer_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["totalAmount"] == 50.0

def test_blocked_number_rejected(client, db_session, customer_token_headers):
    # Admin blocks number 777
    rule = BlockedNumberRule(
        id="block_777",
        number="777",
        game_slot="3 PM Game",
        reason="Blocked by Admin",
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(rule)
    db_session.commit()

    response = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "3 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "777", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        },
        headers=customer_token_headers
    )
    assert response.status_code == 400
    assert "number cant be played" in response.json()["detail"].lower() or "blocked" in response.json()["detail"].lower() or "overloaded" in response.json()["detail"].lower()

def test_agency_number_limit_enforced(client, db_session, test_customer_user, customer_token_headers):
    # Set agency limit of max 2 count on number 999
    limit_rule = AgencyNumberLimit(
        id="lim_999",
        agency_id=test_customer_user.id,
        agency_name=test_customer_user.username,
        number="999",
        max_count=2.0,
        game_slot="3 PM Game",
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(limit_rule)
    db_session.commit()

    # Attempt to place 5 count on 999
    response = client.post(
        "/api/customer/tickets",
        json={
            "gameSlot": "3 PM Game",
            "actionType": "SAVE",
            "totalAmount": 50.0,
            "items": [{"number": "999", "count": 5, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 50.0}]
        },
        headers=customer_token_headers
    )
    assert response.status_code == 400
    assert "overloaded" in response.json()["detail"].lower() or "limit" in response.json()["detail"].lower()

def test_duplicate_ticket_placement_idempotency(client, db_session, test_customer_user, customer_token_headers):
    ticket_payload = {
        "gameSlot": "6 PM Game",
        "actionType": "SAVE",
        "totalAmount": 20.0,
        "items": [{"number": "456", "count": 2, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 20.0}]
    }

    # First placement
    res1 = client.post("/api/customer/tickets", json=ticket_payload, headers=customer_token_headers)
    assert res1.status_code == 200
    tkt1 = res1.json()

    # Immediate rapid retry (e.g. double click)
    res2 = client.post("/api/customer/tickets", json=ticket_payload, headers=customer_token_headers)
    assert res2.status_code == 200
    tkt2 = res2.json()

    # Must return same ticket ID
    assert tkt1["id"] == tkt2["id"]

def test_result_edit_and_winner_recalculation(client, test_customer_user, customer_token_headers, admin_token_headers):
    from app.core.game_timing import set_mock_ist_now, IST_TZ
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. Place a ticket on 111 before 8 PM
    set_mock_ist_now(datetime(2026, 8, 23, 19, 30, 0, tzinfo=IST_TZ))
    res = client.post(
        "/api/customer/tickets",
        json={
            "customerName": "RecalcPlayer",
            "gameSlot": "8 PM Game",
            "actionType": "PAY",
            "totalAmount": 10.0,
            "items": [{"number": "111", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        },
        headers=customer_token_headers
    )
    assert res.status_code == 200

    # 2. Admin publishes initial result 999 after 8 PM (ticket 111 is LOST)
    set_mock_ist_now(datetime(2026, 8, 23, 20, 5, 0, tzinfo=IST_TZ))
    client.post(
        "/api/admin/results",
        json={
            "date": today_str,
            "gameSlot": "8 PM Game",
            "prize1": "999",
            "prize2": "888",
            "prize3": "777",
            "prize4": "666",
            "prize5": "555",
            "compliments": [],
        },
        headers=admin_token_headers
    )

    tkts_res = client.get("/api/customer/tickets", headers=customer_token_headers)
    tkt = next((t for t in tkts_res.json() if t["items"][0]["number"] == "111"), None)
    assert tkt["status"] == "LOST"
    assert tkt["winAmount"] == 0.0

    # 3. Admin corrects result to 111 (ticket 111 is now WON)
    client.post(
        "/api/admin/results",
        json={
            "date": today_str,
            "gameSlot": "8 PM Game",
            "prize1": "111",
            "prize2": "888",
            "prize3": "777",
            "prize4": "666",
            "prize5": "555",
            "compliments": [],
        },
        headers=admin_token_headers
    )

    tkts_res_updated = client.get("/api/customer/tickets", headers=customer_token_headers)
    tkt_updated = next((t for t in tkts_res_updated.json() if t["items"][0]["number"] == "111"), None)
    assert tkt_updated["status"] == "WON"
    assert tkt_updated["winAmount"] == 5000.0
