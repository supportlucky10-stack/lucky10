import pytest
from app.models.user import User, UserRole
from app.models.ticket import Ticket, BetItem
from app.core.security import get_password_hash, create_access_token
from datetime import datetime, timezone
import uuid

@pytest.fixture
def admin_token(db_session):
    admin = db_session.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            id="admin_test_id",
            name="Super Admin",
            email="admin@lucky10.com",
            username="admin",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return create_access_token(data={"sub": admin.id, "role": "ADMIN"})

def test_agency_uniqueness_exact_duplicate(client, admin_token):
    # TEST A: Create agency "New_Alpha", Create second agency "New_Alpha" -> rejected
    suffix = uuid.uuid4().hex[:6]
    agency_name = f"Agency_Alpha_{suffix}"
    
    # First creation
    res1 = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "agencyName": agency_name,
            "username": f"user1_{suffix}",
            "password": "password123",
            "mode": "With Commission (20%)"
        }
    )
    assert res1.status_code == 200
    assert res1.json()["name"] == agency_name

    # Duplicate creation with same agency name
    res2 = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "agencyName": agency_name,
            "username": f"user2_{suffix}",
            "password": "password123",
            "mode": "With Commission (30%)"
        }
    )
    assert res2.status_code == 400
    assert "Agency name already exists" in res2.json()["detail"]

def test_agency_uniqueness_case_insensitive(client, admin_token):
    # TEST B & TEST M: Create "New_Bravo", Create "new_bravo" -> rejected
    suffix = uuid.uuid4().hex[:6]
    agency_name = f"Agency_Bravo_{suffix}"

    res1 = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "agencyName": agency_name,
            "username": f"user_b1_{suffix}",
            "password": "password123",
            "mode": "With Commission (20%)"
        }
    )
    assert res1.status_code == 200

    # Lowercase duplicate
    res2 = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "agencyName": agency_name.lower(),
            "username": f"user_b2_{suffix}",
            "password": "password123",
            "mode": "With Commission (20%)"
        }
    )
    assert res2.status_code == 400
    assert "Agency name already exists" in res2.json()["detail"]

def test_agency_uniqueness_whitespace_normalized(client, admin_token):
    # TEST C: Create "New_Charlie", Create "  New_Charlie  " -> rejected
    suffix = uuid.uuid4().hex[:6]
    agency_name = f"Agency_Charlie_{suffix}"

    res1 = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "agencyName": agency_name,
            "username": f"user_c1_{suffix}",
            "password": "password123",
            "mode": "With Commission (20%)"
        }
    )
    assert res1.status_code == 200

    # Whitespace-padded duplicate
    res2 = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "agencyName": f"   {agency_name}   ",
            "username": f"user_c2_{suffix}",
            "password": "password123",
            "mode": "With Commission (20%)"
        }
    )
    assert res2.status_code == 400
    assert "Agency name already exists" in res2.json()["detail"]

def test_distinct_agencies_allowed(client, admin_token):
    # TEST D: Create agency A and agency B -> allowed
    suffix = uuid.uuid4().hex[:6]
    res1 = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "agencyName": f"Delta_One_{suffix}",
            "username": f"user_d1_{suffix}",
            "password": "password123",
            "mode": "With Commission (20%)"
        }
    )
    assert res1.status_code == 200

    res2 = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "agencyName": f"Delta_Two_{suffix}",
            "username": f"user_d2_{suffix}",
            "password": "password123",
            "mode": "With Commission (30%)"
        }
    )
    assert res2.status_code == 200

def test_data_isolation_between_accounts(client, db_session, admin_token):
    # TEST E, F, G, H, I, J, K, L:
    # Setup two users (e.g. legacy duplicates with same agency name "Legacy_Agency")
    suffix = uuid.uuid4().hex[:6]
    agency_display = f"Legacy_Agency_{suffix}"

    user_a = User(
        id=f"user_a_{suffix}",
        name=agency_display,
        email=f"a_{suffix}@lucky10.com",
        username=f"cust_a_{suffix}",
        password_hash=get_password_hash("pass123"),
        role=UserRole.CUSTOMER,
        mode="With Commission (20%)",
    )
    user_b = User(
        id=f"user_b_{suffix}",
        name=agency_display,
        email=f"b_{suffix}@lucky10.com",
        username=f"cust_b_{suffix}",
        password_hash=get_password_hash("pass123"),
        role=UserRole.CUSTOMER,
        mode="With Commission (30%)",
    )
    db_session.add_all([user_a, user_b])
    db_session.commit()

    token_a = create_access_token(data={"sub": user_a.id, "role": "CUSTOMER"})
    token_b = create_access_token(data={"sub": user_b.id, "role": "CUSTOMER"})

    # Customer A creates a ticket with sales of Rs. 100
    tkt_a = Ticket(
        id=f"tkt_a_{suffix}",
        user_id=user_a.id,
        customer_name="Customer_A",
        game_slot="1 PM Game",
        total_amount=100.0,
        status="WON",
        win_amount=500.0,
        placed_at=datetime.now(timezone.utc),
    )
    item_a = BetItem(
        id=f"item_a_{suffix}",
        ticket_id=tkt_a.id,
        number="123",
        count=10.0,
        type="Direct",
        unit_price=10.0,
        total_amount=100.0,
    )
    db_session.add_all([tkt_a, item_a])
    db_session.commit()

    # TEST E: Customer B views tickets endpoint -> Customer B cannot see Customer A's bill
    res_b_tickets = client.get(
        "/api/customer/tickets",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_b_tickets.status_code == 200
    b_tickets = res_b_tickets.json()
    b_ticket_ids = [t["id"] for t in b_tickets]
    assert tkt_a.id not in b_ticket_ids
    assert len(b_ticket_ids) == 0

    # TEST F: Customer B winning amount from tickets -> Customer B has 0 winnings, cannot see Customer A's 500
    b_total_winnings = sum(t.get("winAmount", 0) for t in b_tickets)
    assert b_total_winnings == 0.0

    # TEST G & H & I & J & K: Admin Tickets endpoint returns tickets with explicit userId
    res_admin_tickets = client.get(
        "/api/admin/tickets",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_admin_tickets.status_code == 200
    admin_tkts = res_admin_tickets.json()
    
    tkt_for_a = [t for t in admin_tkts if t["userId"] == user_a.id]
    tkt_for_b = [t for t in admin_tkts if t["userId"] == user_b.id]

    assert len(tkt_for_a) == 1
    assert tkt_for_a[0]["totalAmount"] == 100.0
    assert tkt_for_a[0]["winAmount"] == 500.0

    # Customer B has 0 tickets, 0 sales, 0 winnings
    assert len(tkt_for_b) == 0

def test_customer_cannot_spoof_ticket_ownership(client, db_session):
    # TEST N: Customer cannot manipulate request payload to associate a ticket with another account
    suffix = uuid.uuid4().hex[:6]
    victim = User(
        id=f"victim_{suffix}",
        name=f"Victim_{suffix}",
        email=f"vic_{suffix}@lucky10.com",
        username=f"victim_{suffix}",
        password_hash=get_password_hash("pass123"),
        role=UserRole.CUSTOMER,
    )
    attacker = User(
        id=f"attacker_{suffix}",
        name=f"Attacker_{suffix}",
        email=f"att_{suffix}@lucky10.com",
        username=f"attacker_{suffix}",
        password_hash=get_password_hash("pass123"),
        role=UserRole.CUSTOMER,
    )
    db_session.add_all([victim, attacker])
    db_session.commit()

    attacker_token = create_access_token(data={"sub": attacker.id, "role": "CUSTOMER"})

    # Attacker tries to place a ticket with victim's username / agencyName in request
    res = client.post(
        "/api/customer/tickets",
        headers={"Authorization": f"Bearer {attacker_token}"},
        json={
            "gameSlot": "1 PM Game",
            "customerName": "Test Customer",
            "userId": victim.id,          # Attempted spoof
            "agencyName": victim.name,     # Attempted spoof
            "items": [
                {"number": "123", "count": 1, "type": "Direct"}
            ]
        }
    )
    # Even if successful, the ticket must be stored with user_id = attacker.id
    if res.status_code == 200:
        placed_ticket_id = res.json()["id"]
        tkt_in_db = db_session.query(Ticket).filter(Ticket.id == placed_ticket_id).first()
        assert tkt_in_db is not None
        assert tkt_in_db.user_id == attacker.id
        assert tkt_in_db.user_id != victim.id
