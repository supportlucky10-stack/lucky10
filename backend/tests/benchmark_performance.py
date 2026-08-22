import asyncio
import time
import statistics
import httpx
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token
from app.main import app
from datetime import datetime, timezone

async def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create test user
    test_user_id = "perf_test_user_001"
    user = db.query(User).filter(User.id == test_user_id).first()
    if not user:
        user = User(
            id=test_user_id,
            email="perf@lucky10.test",
            username="perf_agency",
            name="Perf Agency",
            password_hash=get_password_hash("pass123"),
            role=UserRole.CUSTOMER,
            balance=500000.0,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()

    token = create_access_token({"sub": test_user_id, "role": "CUSTOMER"})
    headers = {"Authorization": f"Bearer {token}"}
    db.close()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Benchmark Single Save Latency (30 iterations)
        save_latencies = []
        saved_ticket_ids = []

        for i in range(30):
            payload = {
                "customerName": f"Punter_{i}",
                "gameSlot": "1 PM Game",
                "actionType": "SAVE",
                "totalAmount": 20.0,
                "items": [
                    {
                        "number": f"{(i * 13) % 900 + 100:03d}",
                        "count": 2,
                        "type": "SUPER",
                        "unitPrice": 10.0,
                        "totalAmount": 20.0,
                    }
                ],
            }
            t0 = time.perf_counter()
            res = await client.post("/api/customer/tickets", json=payload, headers=headers)
            t1 = time.perf_counter()
            if res.status_code == 200:
                save_latencies.append((t1 - t0) * 1000)
                saved_ticket_ids.append(res.json()["id"])

        # 2. Benchmark Delete Latency (15 iterations)
        delete_latencies = []
        for tid in saved_ticket_ids[:15]:
            t0 = time.perf_counter()
            res = await client.delete(f"/api/customer/tickets/{tid}", headers=headers)
            t1 = time.perf_counter()
            if res.status_code == 200:
                delete_latencies.append((t1 - t0) * 1000)

        # 3. Benchmark History Loading Latency (15 iterations)
        history_latencies = []
        for _ in range(15):
            t0 = time.perf_counter()
            res = await client.get("/api/customer/tickets", headers=headers)
            t1 = time.perf_counter()
            if res.status_code == 200:
                history_latencies.append((t1 - t0) * 1000)

        # 4. Benchmark Concurrent Saves (15 simultaneous users)
        concurrent_users = 15
        c_tokens = []
        db = SessionLocal()
        for u_idx in range(concurrent_users):
            u_id = f"perf_concur_{u_idx}"
            if not db.query(User).filter(User.id == u_id).first():
                u = User(
                    id=u_id,
                    email=f"concur_{u_idx}@test.com",
                    username=f"agency_{u_idx}",
                    name=f"Agency {u_idx}",
                    password_hash=get_password_hash("pass"),
                    role=UserRole.CUSTOMER,
                    balance=100000.0,
                    is_active=True,
                )
                db.add(u)
            c_tokens.append(create_access_token({"sub": u_id, "role": "CUSTOMER"}))
        db.commit()
        db.close()

        async def concurrent_save(tok, idx):
            h = {"Authorization": f"Bearer {tok}"}
            p = {
                "customerName": f"Punter_{idx}",
                "gameSlot": "3 PM Game",
                "actionType": "SAVE",
                "totalAmount": 10.0,
                "items": [{"number": f"{idx + 100:03d}", "count": 1, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 10.0}],
            }
            t0 = time.perf_counter()
            r = await client.post("/api/customer/tickets", json=p, headers=h)
            t1 = time.perf_counter()
            return r.status_code, (t1 - t0) * 1000

        t_start = time.perf_counter()
        results = await asyncio.gather(*[concurrent_save(c_tokens[i], i) for i in range(concurrent_users)])
        t_total_concur = (time.perf_counter() - t_start) * 1000
        concurrent_latencies = [lat for status, lat in results if status == 200]

    print("=== BENCHMARK BASELINE RESULTS ===")
    print(f"Save Latency (avg): {statistics.mean(save_latencies):.2f} ms | P50: {statistics.median(save_latencies):.2f} ms | P95: {sorted(save_latencies)[int(len(save_latencies)*0.95)]:.2f} ms")
    print(f"Delete Latency (avg): {statistics.mean(delete_latencies):.2f} ms | P50: {statistics.median(delete_latencies):.2f} ms")
    print(f"History Load Latency (avg): {statistics.mean(history_latencies):.2f} ms | P50: {statistics.median(history_latencies):.2f} ms")
    print(f"Concurrent ({concurrent_users} users) avg per-request: {statistics.mean(concurrent_latencies):.2f} ms | Total batch time: {t_total_concur:.2f} ms")

if __name__ == "__main__":
    asyncio.run(main())
