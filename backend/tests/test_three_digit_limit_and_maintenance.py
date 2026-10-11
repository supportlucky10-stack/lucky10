import pytest
from datetime import datetime, timezone
from app.core.game_timing import set_mock_ist_now, IST_TZ


def test_three_digit_single_entry_per_slot(client, test_customer_user, customer_token_headers):
    # Set time to 12:30 PM (1 PM Game is open)
    set_mock_ist_now(datetime(2026, 8, 23, 12, 30, 0, tzinfo=IST_TZ))

    try:
        # 1. Customer places 455 in 1 PM Game
        ticket1 = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "455", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        }
        res1 = client.post("/api/customer/tickets", json=ticket1, headers=customer_token_headers)
        assert res1.status_code == 200, res1.text

        # 2. Later, placing 455 in BOX in another bill in the same game slot SUCCEEDS (no restriction since only Super was placed earlier)
        ticket2 = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 20.0,
            "items": [{"number": "455", "count": 2, "type": "BOX", "unitPrice": 10.0, "totalAmount": 20.0}]
        }
        res2 = client.post("/api/customer/tickets", json=ticket2, headers=customer_token_headers)
        assert res2.status_code == 200, res2.text

        # 2b. Now both SUPER and BOX have been placed for 455 in 1 PM Game. Trying SUPER again FAILS!
        set_mock_ist_now(datetime(2026, 8, 23, 12, 30, 10, tzinfo=IST_TZ))
        ticket_super_again = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "455", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        }
        res_super_again = client.post("/api/customer/tickets", json=ticket_super_again, headers=customer_token_headers)
        assert res_super_again.status_code == 400
        assert "Overloaded" in res_super_again.json()["detail"]

        # 2c. Trying BOX again for 455 in 1 PM Game also FAILS!
        ticket_box_again = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "455", "count": 1, "type": "BOX", "unitPrice": 10.0, "totalAmount": 10.0}]
        }
        res_box_again = client.post("/api/customer/tickets", json=ticket_box_again, headers=customer_token_headers)
        assert res_box_again.status_code == 400
        assert "Overloaded" in res_box_again.json()["detail"]

        # 3. Customer places BOTH Super and Box for number 500 in 1 PM Game in a single bill
        ticket_both = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 20.0,
            "items": [
                {"number": "500", "count": 1, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 10.0},
                {"number": "500", "count": 1, "type": "BOX", "unitPrice": 10.0, "totalAmount": 10.0},
            ]
        }
        res_both = client.post("/api/customer/tickets", json=ticket_both, headers=customer_token_headers)
        assert res_both.status_code == 200, res_both.text

        # But trying to place 500 in a second bill fails!
        ticket_both_2 = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "500", "count": 1, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 10.0}]
        }
        res_both_2 = client.post("/api/customer/tickets", json=ticket_both_2, headers=customer_token_headers)
        assert res_both_2.status_code == 400
        assert "Overloaded" in res_both_2.json()["detail"]

        # 4. But placing a DIFFERENT number (e.g. 789) in 1 PM Game succeeds
        ticket3 = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "789", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        }
        res3 = client.post("/api/customer/tickets", json=ticket3, headers=customer_token_headers)
        assert res3.status_code == 200, res3.text

        # 5. Now advance time to 2:30 PM (3 PM Game is open)
        set_mock_ist_now(datetime(2026, 8, 23, 14, 30, 0, tzinfo=IST_TZ))

        # 455 can now be placed in 3 PM Game!
        ticket_next_slot = {
            "gameSlot": "3 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "455", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        }
        res_slot = client.post("/api/customer/tickets", json=ticket_next_slot, headers=customer_token_headers)
        assert res_slot.status_code == 200, res_slot.text

        # But 455 cannot be repeated AGAIN in 3 PM Game
        ticket_next_slot_repeat = {
            "gameSlot": "3 PM Game",
            "actionType": "SAVE",
            "totalAmount": 20.0,
            "items": [{"number": "455", "count": 2, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 20.0}]
        }
        res_slot_repeat = client.post("/api/customer/tickets", json=ticket_next_slot_repeat, headers=customer_token_headers)
        assert res_slot_repeat.status_code == 400
        assert "Overloaded" in res_slot_repeat.json()["detail"]

    finally:
        set_mock_ist_now(None)

def test_server_maintenance_mode(client, test_customer_user, customer_token_headers, admin_token_headers):
    # Set time to 12:30 PM
    set_mock_ist_now(datetime(2026, 8, 23, 12, 30, 0, tzinfo=IST_TZ))

    try:
        # 1. Admin turns Maintenance Mode ON
        m_payload = {
            "isEnabled": True,
            "message": "Custom Server Under Maintenance Message"
        }
        res_admin = client.put("/api/admin/maintenance", json=m_payload, headers=admin_token_headers)
        assert res_admin.status_code == 200
        assert res_admin.json()["isEnabled"] is True

        # 2. Public / customer check confirms maintenance is enabled
        res_status = client.get("/api/customer/maintenance")
        assert res_status.status_code == 200
        assert res_status.json()["isEnabled"] is True
        assert res_status.json()["message"] == "Custom Server Under Maintenance Message"

        # 3. Customer attempting to place bets is blocked with 503
        tkt = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "123", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        }
        res_cust = client.post("/api/customer/tickets", json=tkt, headers=customer_token_headers)
        assert res_cust.status_code == 503
        assert "Custom Server Under Maintenance Message" in res_cust.json()["detail"]

        # 4. Admin turns Maintenance Mode OFF
        res_admin_off = client.put("/api/admin/maintenance", json={"isEnabled": False}, headers=admin_token_headers)
        assert res_admin_off.status_code == 200
        assert res_admin_off.json()["isEnabled"] is False

        # 5. Customer can place bets again
        res_cust_ok = client.post("/api/customer/tickets", json=tkt, headers=customer_token_headers)
        assert res_cust_ok.status_code == 200
    finally:
        set_mock_ist_now(None)
