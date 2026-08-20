import pytest
from app.core.security import create_access_token

def test_valid_customer_login(client, test_customer_user):
    response = client.post(
        "/api/auth/customer/login",
        json={"username": "cust_agency", "password": "custpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["id"] == test_customer_user.id
    assert data["user"]["username"] == "cust_agency"

def test_valid_admin_login(client, test_admin_user):
    response = client.post(
        "/api/auth/admin/login",
        json={"username": "admin_test", "password": "admin12345"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_invalid_customer_login(client, test_customer_user):
    response = client.post(
        "/api/auth/customer/login",
        json={"username": "cust_agency", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]

def test_disabled_account_login_rejection(client, test_disabled_customer):
    response = client.post(
        "/api/auth/customer/login",
        json={"username": "disabled_user", "password": "disabledpass"}
    )
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"].lower()

def test_disabled_account_jwt_token_rejection(client, test_disabled_customer):
    # Even with a valid unexpired token, deactivated users must be rejected
    token = create_access_token(data={"sub": test_disabled_customer.id, "role": "CUSTOMER"})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/customer/profile", headers=headers)
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"].lower()

def test_get_me_authenticated(client, test_customer_user, customer_token_headers):
    response = client.get("/api/auth/me", headers=customer_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_customer_user.id
    assert data["username"] == test_customer_user.username
