import pytest
from datetime import datetime, timezone
from app.models.user import User, UserRole
from app.models.ticket import Ticket, BetItem, DeletedTicket
from app.core.security import create_access_token

def test_delete_ticket_creates_archive_record(client, db_session, test_customer_user, test_admin_user):
    # 1. Create a ticket in the DB
    ticket = Ticket(
        id="9998881",
        user_id=test_customer_user.id,
        customer_name="Test Customer 1",
        game_slot="1 PM Game",
        total_amount=50.0,
        status="PENDING",
        placed_at=datetime.now(timezone.utc),
    )
    db_session.add(ticket)
    db_session.flush()

    item1 = BetItem(
        id="bet_9998881_00001",
        ticket_id="9998881",
        number="123",
        count=3.0,
        type="Direct",
        unit_price=10.0,
        total_amount=30.0,
    )
    item2 = BetItem(
        id="bet_9998881_00002",
        ticket_id="9998881",
        number="123",
        count=2.0,
        type="Shuffle",
        unit_price=10.0,
        total_amount=20.0,
    )
    db_session.add_all([item1, item2])
    db_session.commit()

    cust_token = create_access_token({"sub": test_customer_user.id, "role": test_customer_user.role.value})
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 2. Call customer delete ticket endpoint
    del_res = client.delete("/api/customer/tickets/9998881", headers=cust_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 3. Verify ticket and items are removed from active tables
    assert db_session.query(Ticket).filter(Ticket.id == "9998881").first() is None
    assert db_session.query(BetItem).filter(BetItem.ticket_id == "9998881").count() == 0

    # 4. Verify record in deleted_tickets table
    del_rec = db_session.query(DeletedTicket).filter(DeletedTicket.id == "9998881").first()
    assert del_rec is not None
    assert del_rec.customer_name == "Test Customer 1"
    assert del_rec.total_amount == 50.0
    assert "CUSTOMER" in del_rec.deleted_by
    assert del_rec.deleted_at is not None
    assert "123" in del_rec.items_json

    # 5. Verify GET /api/customer/tickets/deleted
    get_res = client.get("/api/customer/tickets/deleted", headers=cust_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert len(data) >= 1
    found = next((t for t in data if t["id"] == "9998881"), None)
    assert found is not None
    assert found["ticketId"] == "9998881"
    assert found["customerName"] == "Test Customer 1"
    assert found["totalAmount"] == 50.0
    assert len(found["items"]) == 2
    assert found["status"] == "DELETED"
    assert found["deletedAt"] != ""

    # 6. Verify GET /api/admin/tickets/deleted
    admin_token = create_access_token({"sub": test_admin_user.id, "role": test_admin_user.role.value})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    admin_get = client.get("/api/admin/tickets/deleted", headers=admin_headers)
    assert admin_get.status_code == 200
    admin_data = admin_get.json()
    assert any(t["id"] == "9998881" for t in admin_data)

    # 7. Test Admin Delete of another ticket
    t2 = Ticket(
        id="9998882",
        user_id=test_customer_user.id,
        customer_name="Customer 2",
        game_slot="3 PM Game",
        total_amount=20.0,
        status="PENDING",
        placed_at=datetime.now(timezone.utc),
    )
    db_session.add(t2)
    db_session.flush()
    i3 = BetItem(id="bet_9998882_01", ticket_id="9998882", number="456", count=2.0, type="Direct", unit_price=10.0, total_amount=20.0)
    db_session.add(i3)
    db_session.commit()

    adm_del = client.delete("/api/admin/tickets/9998882", headers=admin_headers)
    assert adm_del.status_code == 200

    adm_rec = db_session.query(DeletedTicket).filter(DeletedTicket.id == "9998882").first()
    assert adm_rec is not None
    assert "ADMIN" in adm_rec.deleted_by
