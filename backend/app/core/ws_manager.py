import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket

logger = logging.getLogger("lucky10.ws")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        self.role_connections: Dict[str, Set[WebSocket]] = {"ADMIN": set(), "CUSTOMER": set()}
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None, role: Optional[str] = None):
        await websocket.accept()
        self.active_connections.add(websocket)
        
        if user_id:
            uid_str = str(user_id)
            if uid_str not in self.user_connections:
                self.user_connections[uid_str] = set()
            self.user_connections[uid_str].add(websocket)

        if role:
            r_upper = str(role).upper()
            if r_upper not in self.role_connections:
                self.role_connections[r_upper] = set()
            self.role_connections[r_upper].add(websocket)

        logger.info(f"[WebSocket] Connected client: User={user_id}, Role={role}. Active total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, user_id: Optional[str] = None, role: Optional[str] = None):
        self.active_connections.discard(websocket)

        if user_id:
            uid_str = str(user_id)
            if uid_str in self.user_connections:
                self.user_connections[uid_str].discard(websocket)
                if not self.user_connections[uid_str]:
                    del self.user_connections[uid_str]

        if role:
            r_upper = str(role).upper()
            if r_upper in self.role_connections:
                self.role_connections[r_upper].discard(websocket)

        # Fallback: remove from all user/role sets if untracked
        for uid, conns in list(self.user_connections.items()):
            conns.discard(websocket)
            if not conns:
                del self.user_connections[uid]

        for r_key, conns in self.role_connections.items():
            conns.discard(websocket)

        logger.info(f"[WebSocket] Disconnected client. Active total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
        text_data = json.dumps(message)
        dead = []
        for conn in list(self.active_connections):
            try:
                await conn.send_text(text_data)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        uid_str = str(user_id)
        connections = self.user_connections.get(uid_str, set())
        if not connections:
            return
        text_data = json.dumps(message)
        dead = []
        for conn in list(connections):
            try:
                await conn.send_text(text_data)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d, user_id=uid_str)

    async def broadcast_role(self, role: str, message: Dict[str, Any]):
        r_upper = str(role).upper()
        connections = self.role_connections.get(r_upper, set())
        if not connections:
            return
        text_data = json.dumps(message)
        dead = []
        for conn in list(connections):
            try:
                await conn.send_text(text_data)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d, role=r_upper)

    def broadcast_sync(self, message: Dict[str, Any]):
        """Thread-safe broadcast called from synchronous route handlers."""
        loop = self._loop
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast(message), loop)
        else:
            try:
                running_loop = asyncio.get_running_loop()
                running_loop.create_task(self.broadcast(message))
            except RuntimeError:
                pass

    def send_to_user_sync(self, user_id: str, message: Dict[str, Any]):
        """Thread-safe targeted user message called from synchronous route handlers."""
        loop = self._loop
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(self.send_to_user(str(user_id), message), loop)
        else:
            try:
                running_loop = asyncio.get_running_loop()
                running_loop.create_task(self.send_to_user(str(user_id), message))
            except RuntimeError:
                pass

    def broadcast_role_sync(self, role: str, message: Dict[str, Any]):
        """Thread-safe role-targeted broadcast called from synchronous route handlers."""
        loop = self._loop
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast_role(role, message), loop)
        else:
            try:
                running_loop = asyncio.get_running_loop()
                running_loop.create_task(self.broadcast_role(role, message))
            except RuntimeError:
                pass


ws_manager = ConnectionManager()
