import concurrent.futures
import pytest
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token
from app.models.ticket import Ticket, BetItem

from datetime import datetime, timezone

def test_50_concurrent_customers_ticket_creation_and_isolation(client, db_session):
    """
    SUCCESS CONDITION:
    Simulate 50 customers simultaneously placing tickets.
    Verify:
    1. All 50 ticket placements succeed with HTTP 200.
    2. Exactly 50 unique ticket IDs are generated.
    3. NO primary-key collisions.
    4. NO duplicate ticket IDs.
    5. Each customer's ticket history returns ONLY that customer's tickets (0 cross-customer leaks).
    """
    # 1. Create 50 distinct customer users
    num_customers = 50
    customers = []
    tokens = {}

    for i in range(num_customers):
        user_id = f"cust_concur_{i:03d}"
        username = f"agency_{i:03d}"
        email = f"cust_{i:03d}@lucky10.test"
        existing = db_session.query(User).filter(User.id == user_id).first()
        if not existing:
            user = User(
                id=user_id,
                email=email,
                username=username,
                name=f"Customer {i}",
                password_hash=get_password_hash("pass123"),
                role=UserRole.CUSTOMER,
                balance=50000.0,
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db_session.add(user)
        customers.append(user_id)
        token = create_access_token({"sub": user_id, "role": "CUSTOMER"})
        tokens[user_id] = {"Authorization": f"Bearer {token}"}

    db_session.commit()

    # 2. Concurrently place 50 tickets
    import threading
    results = {}
    errors = []
    _client_lock = threading.Lock()

    def place_ticket_for_user(cust_id):
        headers = tokens[cust_id]
        payload = {
            "customerName": f"Punter_{cust_id}",
            "gameSlot": "3 PM Game",
            "actionType": "SAVE",
            "totalAmount": 20.0,
            "items": [
                {
                    "number": f"{(int(cust_id.split('_')[-1]) * 7) % 900 + 100:03d}",
                    "count": 2,
                    "type": "SUPER",
                    "unitPrice": 10.0,
                    "totalAmount": 20.0,
                }
            ],
        }
        with _client_lock:
            res = client.post("/api/customer/tickets", json=payload, headers=headers)
            return cust_id, res.status_code, res.json()

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(place_ticket_for_user, cid) for cid in customers]
        for f in concurrent.futures.as_completed(futures):
            try:
                cust_id, status_code, data = f.result()
                results[cust_id] = (status_code, data)
            except Exception as e:
                errors.append(str(e))

    assert len(errors) == 0, f"Thread errors occurred: {errors}"
    assert len(results) == num_customers, f"Expected {num_customers} responses, got {len(results)}"

    # 3. Verify HTTP 200 and collect Ticket IDs
    ticket_ids = []
    for cust_id, (status_code, data) in results.items():
        assert status_code == 200, f"Customer {cust_id} failed with status {status_code}: {data}"
        assert "id" in data, f"Missing id in response: {data}"
        assert "ticketId" in data
        assert data["userId"] == cust_id
        ticket_ids.append(data["id"])

    # 4. Strict uniqueness check: All 50 ticket IDs must be unique
    assert len(ticket_ids) == num_customers
    assert len(set(ticket_ids)) == num_customers, f"Duplicate ticket IDs found: {ticket_ids}"

    # 5. Strict customer isolation check: Each customer history has exactly 1 ticket (their own)
    for cust_id in customers:
        headers = tokens[cust_id]
        res = client.get("/api/customer/tickets", headers=headers)
        assert res.status_code == 200
        user_tickets = res.json()
        assert len(user_tickets) == 1, f"Customer {cust_id} expected 1 ticket, got {len(user_tickets)}"
        assert user_tickets[0]["userId"] == cust_id
        assert user_tickets[0]["id"] == results[cust_id][1]["id"]


def test_idempotency_duplicate_guard(client, test_customer_user, customer_token_headers):
    """
    Ensure existing duplicate-request idempotency within 3 seconds returns the existing ticket.
    """
    payload = {
        "customerName": "IdempotentTest",
        "gameSlot": "1 PM Game",
        "actionType": "SAVE",
        "totalAmount": 10.0,
        "items": [
            {
                "number": "777",
                "count": 1,
                "type": "SUPER",
                "unitPrice": 10.0,
                "totalAmount": 10.0,
            }
        ],
    }

    res1 = client.post("/api/customer/tickets", json=payload, headers=customer_token_headers)
    assert res1.status_code == 200
    t1 = res1.json()

    # Immediate second call with identical payload returns the same ticket
    res2 = client.post("/api/customer/tickets", json=payload, headers=customer_token_headers)
    assert res2.status_code == 200
    t2 = res2.json()

    assert t1["id"] == t2["id"]
