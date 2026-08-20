import pytest

def test_customer_cannot_access_admin_users(client, customer_token_headers):
    response = client.get("/api/admin/users", headers=customer_token_headers)
    assert response.status_code == 403
    assert "Admin access required" in response.json()["detail"]

def test_customer_cannot_publish_results(client, customer_token_headers):
    response = client.post(
        "/api/admin/results",
        json={
            "date": "2026-08-21",
            "gameSlot": "3 PM Game",
            "prize1": "742",
            "prize2": "381",
            "prize3": "915",
            "prize4": "264",
            "prize5": "530",
            "compliments": [],
        },
        headers=customer_token_headers,
    )
    assert response.status_code == 403

def test_unauthenticated_request_rejected(client):
    response = client.get("/api/customer/profile")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_admin_can_access_admin_endpoints(client, admin_token_headers):
    response = client.get("/api/admin/users", headers=admin_token_headers)
    assert response.status_code == 200
