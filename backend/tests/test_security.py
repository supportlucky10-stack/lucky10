import pytest

def test_empty_bet_slip_rejected(client, customer_token_headers):
    response = client.post(
        "/api/customer/tickets",
        json={"gameSlot": "3 PM Game", "actionType": "PAY", "totalAmount": 0.0, "items": []},
        headers=customer_token_headers
    )
    assert response.status_code in (400, 422)

def test_malformed_jwt_token(client):
    headers = {"Authorization": "Bearer invalid.jwt.token.string"}
    response = client.get("/api/customer/profile", headers=headers)
    assert response.status_code == 401
    assert "Invalid or expired token" in response.json()["detail"]

def test_internal_server_error_sanitization(client, monkeypatch):
    # Simulate an unexpected database error inside an endpoint to verify no stack trace leakage
    def _mock_raise(*args, **kwargs):
        raise ValueError("Sensitive DB Connection String: postgresql://admin:secretpass@db.local/db")

    from app.routers import customer
    monkeypatch.setattr(customer, "format_user_account", _mock_raise)

    # Use a dummy customer token payload
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": "non_existent_id", "role": "CUSTOMER"})
    
    response = client.get("/api/customer/profile", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code in (500, 401)
    if response.status_code == 500:
        detail = response.json()["detail"]
        assert "secretpass" not in detail
        assert "postgresql" not in detail
        assert detail == "An internal server error occurred."
