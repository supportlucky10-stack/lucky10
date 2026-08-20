import pytest
from app.models.user import User

def test_ticket_creation_and_balance_deduction(client, test_customer_user, customer_token_headers, db_session):
    initial_balance = test_customer_user.balance  # 5000.0

    payload = {
        "customerName": "Raju",
        "gameSlot": "3 PM Game",
        "actionType": "PAY",
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

    # Verify user balance updated in database
    db_user = db_session.query(User).filter(User.id == test_customer_user.id).first()
    assert db_user.balance == initial_balance - 100.0

def test_ticket_creation_insufficient_balance(client, test_customer_user, customer_token_headers):
    payload = {
        "customerName": "Big Spender",
        "gameSlot": "3 PM Game",
        "actionType": "PAY",
        "totalAmount": 99999.0,
        "items": [
            {
                "number": "742",
                "count": 9999.9,
                "type": "SUPER",
                "unitPrice": 10.0,
                "totalAmount": 99999.0,
            }
        ]
    }

    response = client.post("/api/customer/tickets", json=payload, headers=customer_token_headers)
    assert response.status_code == 400
    assert "Insufficient balance" in response.json()["detail"]

def test_result_publication_and_winner_calculation(client, test_customer_user, customer_token_headers, admin_token_headers):
    from datetime import datetime, timezone
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. Place a ticket on 742 (SUPER 1st prize)
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

    # 2. Admin publishes result 742 for 3 PM Game on today's UTC date
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
