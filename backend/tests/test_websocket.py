import json
import pytest
from starlette.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.core.ws_manager import ws_manager

def test_websocket_connection_and_ping_pong():
    with TestClient(app) as tc:
        with tc.websocket_connect("/api/ws") as websocket:
            websocket.send_text(json.dumps({"type": "PING"}))
            data = websocket.receive_text()
            msg = json.loads(data)
            assert msg["type"] == "PONG"

def test_websocket_authenticated_connection(test_customer_user):
    token = create_access_token(data={"sub": test_customer_user.id, "role": "CUSTOMER"})
    with TestClient(app) as tc:
        with tc.websocket_connect(f"/api/ws?token={token}") as websocket:
            websocket.send_text(json.dumps({"type": "PING"}))
            data = websocket.receive_text()
            msg = json.loads(data)
            assert msg["type"] == "PONG"

@pytest.mark.asyncio
async def test_websocket_broadcast_delivery():
    with TestClient(app) as tc:
        with tc.websocket_connect("/api/ws") as websocket:
            test_payload = {"type": "RESULTS_UPDATED", "date": "2026-11-25", "gameSlot": "1 PM Game"}
            await ws_manager.broadcast(test_payload)
            data = websocket.receive_text()
            msg = json.loads(data)
            assert msg["type"] == "RESULTS_UPDATED"
            assert msg["gameSlot"] == "1 PM Game"

@pytest.mark.asyncio
async def test_websocket_targeted_user_message(test_customer_user):
    token = create_access_token(data={"sub": test_customer_user.id, "role": "CUSTOMER"})
    with TestClient(app) as tc:
        with tc.websocket_connect(f"/api/ws?token={token}") as websocket:
            target_payload = {"type": "USER_DEACTIVATED", "userId": test_customer_user.id}
            await ws_manager.send_to_user(test_customer_user.id, target_payload)
            data = websocket.receive_text()
            msg = json.loads(data)
            assert msg["type"] == "USER_DEACTIVATED"
            assert msg["userId"] == test_customer_user.id
