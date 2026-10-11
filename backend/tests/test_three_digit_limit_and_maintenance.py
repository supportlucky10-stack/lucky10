import pytest
from datetime import datetime, timezone
from app.core.game_timing import set_mock_ist_now, IST_TZ


def test_three_digit_allowed_freely_without_restriction(client, test_customer_user, customer_token_headers):
    # Set time to 12:30 PM (1 PM Game is open)
    set_mock_ist_now(datetime(2026, 8, 23, 12, 30, 0, tzinfo=IST_TZ))

    try:
        # 1. Customer places 455 in SUPER in 1 PM Game
        ticket1 = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 10.0,
            "items": [{"number": "455", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}]
        }
        res1 = client.post("/api/customer/tickets", json=ticket1, headers=customer_token_headers)
        assert res1.status_code == 200, res1.text

        # 2. Placing 455 in BOX in another bill in the same game slot SUCCEEDS
        ticket2 = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 20.0,
            "items": [{"number": "455", "count": 2, "type": "BOX", "unitPrice": 10.0, "totalAmount": 20.0}]
        }
        res2 = client.post("/api/customer/tickets", json=ticket2, headers=customer_token_headers)
        assert res2.status_code == 200, res2.text

        # 3. Placing 455 in SUPER AGAIN in another bill in the same game slot ALSO SUCCEEDS (No restriction)
        # Advance time by 10s to bypass 3-second duplicate idempotency guard
        set_mock_ist_now(datetime(2026, 8, 23, 12, 30, 10, tzinfo=IST_TZ))
        ticket3 = {
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 30.0,
            "items": [{"number": "455", "count": 3, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 30.0}]
        }
        res3 = client.post("/api/customer/tickets", json=ticket3, headers=customer_token_headers)
        assert res3.status_code == 200, res3.text

        # 4. Limits endpoint returns empty taken3DigitNumbers
        lims = client.get("/api/customer/limits", headers=customer_token_headers).json()
        assert lims["taken3DigitNumbers"] == {}
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
