import pytest
import concurrent.futures
from app.core.game_timing import set_mock_ist_now, make_ist_dt
from app.models.user import User

@pytest.fixture(autouse=True)
def setup_timing():
    set_mock_ist_now(make_ist_dt(2026, 8, 24, 11, 0, 0)) # 11:00 AM IST (1 PM Game is OPEN)

def test_1_block_unblock_reblock_flow(client, auth_admin, auth_customer):
    # 1. Block 742
    res = client.post(
        "/api/admin/limits/blocked",
        json={"number": "742", "gameSlot": "1 PM Game", "reason": "Test Block"},
        headers=auth_admin["headers"],
    )
    assert res.status_code == 200
    blk_id = res.json()["id"]

    # 2. Generation of 742 must be rejected
    ticket_payload = {
        "gameSlot": "1 PM Game",
        "customerName": "Test Cust",
        "totalAmount": 10.0,
        "items": [{"number": "742", "count": 1.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 10.0}]
    }
    gen_res = client.post("/api/customer/tickets", json=ticket_payload, headers=auth_customer["headers"])
    assert gen_res.status_code == 400
    assert "Number cant be played" in gen_res.json()["detail"]

    # 3. Unblock 742
    del_res = client.delete(f"/api/admin/limits/blocked/{blk_id}", headers=auth_admin["headers"])
    assert del_res.status_code == 200

    # 4. Generation of 742 must now be accepted
    gen_res2 = client.post("/api/customer/tickets", json=ticket_payload, headers=auth_customer["headers"])
    assert gen_res2.status_code == 200

    # 5. Block 742 again
    res3 = client.post(
        "/api/admin/limits/blocked",
        json={"number": "742", "gameSlot": "1 PM Game"},
        headers=auth_admin["headers"],
    )
    assert res3.status_code == 200
    blk_id3 = res3.json()["id"]

    # 6. Generation of 742 must be rejected again
    gen_res3 = client.post("/api/customer/tickets", json=ticket_payload, headers=auth_customer["headers"])
    assert gen_res3.status_code == 400
    assert "Number cant be played" in gen_res3.json()["detail"]

    # Cleanup
    client.delete(f"/api/admin/limits/blocked/{blk_id3}", headers=auth_admin["headers"])

def test_2_multiple_blocks_and_selective_unblock(client, auth_admin, auth_customer):
    # Block 742 and 315
    res1 = client.post("/api/admin/limits/blocked", json={"number": "742", "gameSlot": "ALL"}, headers=auth_admin["headers"])
    assert res1.status_code == 200
    blk_id1 = res1.json()["id"]

    res2 = client.post("/api/admin/limits/blocked", json={"number": "315", "gameSlot": "ALL"}, headers=auth_admin["headers"])
    assert res2.status_code == 200
    blk_id2 = res2.json()["id"]

    # Both rejected
    t_742 = {"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 1.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 10.0}]}
    t_315 = {"gameSlot": "1 PM Game", "items": [{"number": "315", "count": 1.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 10.0}]}
    
    assert client.post("/api/customer/tickets", json=t_742, headers=auth_customer["headers"]).status_code == 400
    assert client.post("/api/customer/tickets", json=t_315, headers=auth_customer["headers"]).status_code == 400

    # Unblock 315 only
    client.delete(f"/api/admin/limits/blocked/{blk_id2}", headers=auth_admin["headers"])

    # 742 rejected, 315 accepted
    assert client.post("/api/customer/tickets", json=t_742, headers=auth_customer["headers"]).status_code == 400
    assert client.post("/api/customer/tickets", json=t_315, headers=auth_customer["headers"]).status_code == 200

    # Cleanup
    client.delete(f"/api/admin/limits/blocked/{blk_id1}", headers=auth_admin["headers"])

def test_3_agency_limit_count_exact_enforcement(client, auth_admin, auth_customer):
    # Set limit 50 on 742 for this agency
    cust_id = auth_customer["user"]["id"]
    lim_res = client.post(
        "/api/admin/limits/agency",
        json={"agencyId": cust_id, "agencyName": auth_customer["user"]["name"], "number": "742", "gameSlot": "1 PM Game", "maxCount": 50},
        headers=auth_admin["headers"],
    )
    assert lim_res.status_code == 200
    lim_id = lim_res.json()["id"]

    # Gen 20 -> accepted
    t20 = {"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 20.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 200.0}]}
    res = client.post("/api/customer/tickets", json=t20, headers=auth_customer["headers"])
    assert res.status_code == 200

    # Gen 20 -> accepted (total 40)
    res = client.post("/api/customer/tickets", json=t20, headers=auth_customer["headers"])
    assert res.status_code == 200

    # Gen 10 -> accepted (total 50)
    t10 = {"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 10.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 100.0}]}
    res = client.post("/api/customer/tickets", json=t10, headers=auth_customer["headers"])
    assert res.status_code == 200

    # Gen 1 -> rejected (would be 51)
    t1 = {"gameSlot": "1 PM Game", "items": [{"number": "742", "count": 1.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 10.0}]}
    res = client.post("/api/customer/tickets", json=t1, headers=auth_customer["headers"])
    assert res.status_code == 400
    assert "Number Overloaded" in res.json()["detail"]

    # Cleanup
    client.delete(f"/api/admin/limits/agency/{lim_id}", headers=auth_admin["headers"])

def test_4_delete_agency_limit_removes_restriction(client, auth_admin, auth_customer):
    cust_id = auth_customer["user"]["id"]
    lim_res = client.post(
        "/api/admin/limits/agency",
        json={"agencyId": cust_id, "agencyName": auth_customer["user"]["name"], "number": "852", "gameSlot": "1 PM Game", "maxCount": 50},
        headers=auth_admin["headers"],
    )
    assert lim_res.status_code == 200
    lim_id = lim_res.json()["id"]

    # Delete the limit
    del_res = client.delete(f"/api/admin/limits/agency/{lim_id}", headers=auth_admin["headers"])
    assert del_res.status_code == 200

    # Place count 60 -> must be ACCEPTED because limit was deleted
    t60 = {"gameSlot": "1 PM Game", "items": [{"number": "852", "count": 60.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 600.0}]}
    res = client.post("/api/customer/tickets", json=t60, headers=auth_customer["headers"])
    assert res.status_code == 200

def test_5_6_7_limit_all_lifecycle(client, auth_admin, auth_customer):
    # Test 5: Enable Limit All = 50 for 1 PM Game
    client.put(
        "/api/admin/limits/global",
        json={"isEnabled": True, "defaultMaxCount": 50.0, "gameSlot": "1 PM Game"},
        headers=auth_admin["headers"],
    )

    t50_a = {"gameSlot": "1 PM Game", "items": [{"number": "111", "count": 50.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 500.0}]}
    t50_b = {"gameSlot": "1 PM Game", "items": [{"number": "222", "count": 50.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 500.0}]}
    
    assert client.post("/api/customer/tickets", json=t50_a, headers=auth_customer["headers"]).status_code == 200
    assert client.post("/api/customer/tickets", json=t50_b, headers=auth_customer["headers"]).status_code == 200

    # 1 extra count on 111 -> rejected
    t1_a = {"gameSlot": "1 PM Game", "items": [{"number": "111", "count": 1.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 10.0}]}
    assert client.post("/api/customer/tickets", json=t1_a, headers=auth_customer["headers"]).status_code == 400

    # Test 6: Disable Limit All
    client.put(
        "/api/admin/limits/global",
        json={"isEnabled": False},
        headers=auth_admin["headers"],
    )

    # Now 1 extra count on 111 is ALLOWED
    assert client.post("/api/customer/tickets", json=t1_a, headers=auth_customer["headers"]).status_code == 200

    # Test 7: Apply Limit All = 25
    client.put(
        "/api/admin/limits/global",
        json={"isEnabled": True, "defaultMaxCount": 25.0, "gameSlot": "1 PM Game"},
        headers=auth_admin["headers"],
    )

    # Number 333: 25 -> accepted, 26 -> rejected
    t25 = {"gameSlot": "1 PM Game", "items": [{"number": "333", "count": 25.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 250.0}]}
    t1 = {"gameSlot": "1 PM Game", "items": [{"number": "333", "count": 1.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 10.0}]}
    assert client.post("/api/customer/tickets", json=t25, headers=auth_customer["headers"]).status_code == 200
    assert client.post("/api/customer/tickets", json=t1, headers=auth_customer["headers"]).status_code == 400

    # Disable for cleanup
    client.put("/api/admin/limits/global", json={"isEnabled": False}, headers=auth_admin["headers"])

def test_8_concurrency_race_condition_protection(client, auth_admin, auth_customer):
    # Set limit 10 on number 999
    cust_id = auth_customer["user"]["id"]
    lim_res = client.post(
        "/api/admin/limits/agency",
        json={"agencyId": cust_id, "agencyName": auth_customer["user"]["name"], "number": "999", "gameSlot": "1 PM Game", "maxCount": 10},
        headers=auth_admin["headers"],
    )
    assert lim_res.status_code == 200
    lim_id = lim_res.json()["id"]

    # Place 5 first
    t5 = {"gameSlot": "1 PM Game", "items": [{"number": "999", "count": 5.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 50.0}]}
    assert client.post("/api/customer/tickets", json=t5, headers=auth_customer["headers"]).status_code == 200

    # Now remaining is 5.
    # Concurrently send two requests each requesting 5. Exactly ONE must succeed and ONE must fail.
    t_req1 = {"gameSlot": "1 PM Game", "customerName": "User A", "items": [{"number": "999", "count": 5.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 50.0}]}
    t_req2 = {"gameSlot": "1 PM Game", "customerName": "User B", "items": [{"number": "999", "count": 5.0, "type": "DIRECT", "unitPrice": 10.0, "totalAmount": 50.0}]}

    def make_req(payload):
        return client.post("/api/customer/tickets", json=payload, headers=auth_customer["headers"])

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(make_req, t_req1)
        f2 = executor.submit(make_req, t_req2)
        r1 = f1.result()
        r2 = f2.result()

    statuses = [r1.status_code, r2.status_code]
    assert 200 in statuses
    assert 400 in statuses

    # Cleanup
    client.delete(f"/api/admin/limits/agency/{lim_id}", headers=auth_admin["headers"])

def test_9_limits_endpoint_authoritative_sync(client, auth_admin, auth_customer):
    # Query customer limits endpoint
    res = client.get("/api/customer/limits", headers=auth_customer["headers"])
    assert res.status_code == 200
    data = res.json()
    assert "blockedNumbers" in data
    assert "agencyLimits" in data
    assert "globalLimit" in data
