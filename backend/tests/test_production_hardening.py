import pytest
from app.models.user import User
from app.models.ticket import Ticket, BetItem

def test_health_check_database_probe(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Lucky10 Backend OK"
    assert data["status"] == "active"
    assert data["database"] == "connected"

def test_authoritative_financial_recalculation(client, test_customer_user, customer_token_headers, db_session):
    """
    Ensure backend never trusts frontend totalAmount or unitPrice,
    recalculates 1-digit mode as ₹12 and 3-digit mode as ₹10 authoritatively.
    """
    payload = {
        "customerName": "SecTest",
        "gameSlot": "3 PM Game",
        "actionType": "SAVE",
        "totalAmount": 1.0,  # Falsified low total amount from client
        "items": [
            {
                "number": "A:5",  # 1-digit position bet -> authoritative unit price is ₹12
                "count": 5,
                "type": "Position",
                "unitPrice": 1.0,  # Falsified
                "totalAmount": 5.0,  # Falsified
            },
            {
                "number": "358",  # 3-digit bet -> authoritative unit price is ₹10
                "count": 2,
                "type": "SUPER",
                "unitPrice": 1.0,  # Falsified
                "totalAmount": 2.0,  # Falsified
            }
        ]
    }

    response = client.post("/api/customer/tickets", json=payload, headers=customer_token_headers)
    assert response.status_code == 200
    ticket_data = response.json()

    # Expected: (5 * 12) + (2 * 10) = 60 + 20 = 80.0
    expected_total = 80.0
    assert ticket_data["totalAmount"] == expected_total

def test_save_ticket_persistence(client, test_customer_user, customer_token_headers, db_session):
    payload = {
        "customerName": "DraftCustomer",
        "gameSlot": "1 PM Game",
        "actionType": "SAVE",
        "totalAmount": 50.0,
        "items": [
            {
                "number": "912",
                "count": 5,
                "type": "SUPER",
                "unitPrice": 10.0,
                "totalAmount": 50.0,
            }
        ]
    }

    response = client.post("/api/customer/tickets", json=payload, headers=customer_token_headers)
    assert response.status_code == 200
    ticket_data = response.json()
    assert ticket_data["totalAmount"] == 50.0
    assert ticket_data["id"] is not None

def test_sequential_ticket_number_generation(client, test_customer_user, customer_token_headers):
    """
    Ensure consecutive tickets receive unique sequential ticket IDs starting from 2243297+.
    """
    ids = []
    for i in range(5):
        payload = {
            "customerName": f"SeqUser_{i}",
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [
                {
                    "number": "123",
                    "count": 1,
                    "type": "SUPER",
                    "unitPrice": 10.0,
                    "totalAmount": 10.0,
                }
            ]
        }
        res = client.post("/api/customer/tickets", json=payload, headers=customer_token_headers)
        assert res.status_code == 200
        ids.append(int(res.json()["id"]))

    # All IDs must be unique and strictly increasing
    assert len(set(ids)) == 5
    assert ids == sorted(ids)
    assert all(id_val >= 2243297 for id_val in ids)
