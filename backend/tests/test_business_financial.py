import pytest
from app.models.user import User

def test_ticket_creation_authoritative_save(client, test_customer_user, customer_token_headers, db_session):
    payload = {
        "customerName": "Raju",
        "gameSlot": "3 PM Game",
        "actionType": "SAVE",
        "totalAmount": 100.0,
        "items": [
            {
                "number": "742",
                "count": 10,
                "type": "SUPER",
                "unitPrice": 10.0,
                "totalAmount": 100.0,
            }
        ]
    }

    response = client.post("/api/customer/tickets", json=payload, headers=customer_token_headers)
    assert response.status_code == 200
    ticket_data = response.json()
    assert ticket_data["totalAmount"] == 100.0
    assert ticket_data["status"] == "PENDING"
    assert ticket_data["id"] is not None

def test_ticket_creation_zero_count_rejected(client, test_customer_user, customer_token_headers):
    payload = {
        "customerName": "Invalid Count",
        "gameSlot": "3 PM Game",
        "actionType": "SAVE",
        "totalAmount": 0.0,
        "items": [
            {
                "number": "742",
                "count": 0,
                "type": "SUPER",
                "unitPrice": 10.0,
                "totalAmount": 0.0,
            }
        ]
    }

    response = client.post("/api/customer/tickets", json=payload, headers=customer_token_headers)
    assert response.status_code in (400, 422)

def test_result_publication_and_winner_calculation(client, test_customer_user, customer_token_headers, admin_token_headers):
    from datetime import datetime, timezone
    from app.core.game_timing import set_mock_ist_now, IST_TZ
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. Place a ticket on 742 (SUPER 1st prize) before 3 PM
    set_mock_ist_now(datetime(2026, 8, 23, 14, 0, 0, tzinfo=IST_TZ))
    client.post(
        "/api/customer/tickets",
        json={
            "customerName": "Winner",
            "gameSlot": "3 PM Game",
            "actionType": "PAY",
            "totalAmount": 10.0,
            "items": [{"number": "742", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        },
        headers=customer_token_headers
    )

    # 2. Admin publishes result 742 for 3 PM Game after 3 PM
    set_mock_ist_now(datetime(2026, 8, 23, 15, 5, 0, tzinfo=IST_TZ))
    res = client.post(
        "/api/admin/results",
        json={
            "date": today_str,
            "gameSlot": "3 PM Game",
            "prize1": "742",
            "prize2": "381",
            "prize3": "915",
            "prize4": "264",
            "prize5": "530",
            "compliments": [],
        },
        headers=admin_token_headers
    )
    assert res.status_code == 200

    # 3. Check customer tickets status updated to WON
    tkts_res = client.get("/api/customer/tickets", headers=customer_token_headers)
    assert tkts_res.status_code == 200
    tkts = tkts_res.json()
    assert len(tkts) >= 1
    won_tkt = next((t for t in tkts if t["items"][0]["number"] == "742"), None)
    assert won_tkt is not None
    assert won_tkt["status"] == "WON"
    assert won_tkt["winAmount"] == 5000.0
