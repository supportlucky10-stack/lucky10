import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

# Use an isolated SQLite database for tests
os.environ["ENVIRONMENT"] = "testing"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-for-unit-testing-lucky10-2026"

from app.core.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token

from sqlalchemy.pool import StaticPool
import app.core.database as app_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
app_db.engine = engine
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

import httpx

import asyncio
import httpx

class AsyncTestClient:
    def __init__(self, app):
        self.app = app
        self.transport = httpx.ASGITransport(app=app)
        self.client = httpx.AsyncClient(transport=self.transport, base_url="http://testserver")

    def _run(self, coro):
        return asyncio.run(coro)

    def get(self, url, **kwargs):
        return self._run(self.client.get(url, **kwargs))

    def post(self, url, **kwargs):
        return self._run(self.client.post(url, **kwargs))

    def put(self, url, **kwargs):
        return self._run(self.client.put(url, **kwargs))

    def patch(self, url, **kwargs):
        return self._run(self.client.patch(url, **kwargs))

    def delete(self, url, **kwargs):
        return self._run(self.client.delete(url, **kwargs))

    def close(self):
        self._run(self.client.aclose())

@pytest.fixture(scope="function")
def client(db_session):
    def _get_test_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
            db_session.expire_all()

    app.dependency_overrides[get_db] = _get_test_db
    tc = AsyncTestClient(app)
    yield tc
    tc.close()
    app.dependency_overrides.clear()

@pytest.fixture
def test_admin_user(db_session):
    admin = User(
        id="test_admin_01",
        name="Test Admin",
        email="admin_test@lucky10.com",
        username="admin_test",
        password_hash=get_password_hash("admin12345"),
        role=UserRole.ADMIN,
        balance=0.0,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture
def test_customer_user(db_session):
    customer = User(
        id="test_cust_01",
        name="Test Customer Agency",
        email="customer_test@lucky10.com",
        username="cust_agency",
        password_hash=get_password_hash("custpass123"),
        role=UserRole.CUSTOMER,
        balance=5000.0,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer

@pytest.fixture
def test_disabled_customer(db_session):
    disabled = User(
        id="test_disabled_01",
        name="Disabled Customer",
        email="disabled@lucky10.com",
        username="disabled_user",
        password_hash=get_password_hash("disabledpass"),
        role=UserRole.CUSTOMER,
        balance=1000.0,
        is_active=False,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(disabled)
    db_session.commit()
    db_session.refresh(disabled)
    return disabled

@pytest.fixture
def customer_token_headers(test_customer_user):
    token = create_access_token(data={"sub": test_customer_user.id, "role": "CUSTOMER"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_token_headers(test_admin_user):
    token = create_access_token(data={"sub": test_admin_user.id, "role": "ADMIN"})
    return {"Authorization": f"Bearer {token}"}
