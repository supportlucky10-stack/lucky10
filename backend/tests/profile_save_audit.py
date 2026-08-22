import asyncio
import time
import statistics
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from sqlalchemy import event, text
from app.core.database import SessionLocal, engine, Base, get_next_ticket_id
from app.models.user import User, UserRole
from app.models.ticket import Ticket, BetItem
from app.core.security import get_password_hash, create_access_token
from app.main import app

# SQL Query interception logger
query_logs = []
record_queries = False

@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.perf_counter()

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time = (time.perf_counter() - getattr(context, "_query_start_time", time.perf_counter())) * 1000
    if record_queries:
        query_logs.append({
            "statement": statement.strip(),
            "duration_ms": total_time,
            "executemany": executemany
        })

async def run_audit():
    global record_queries
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    test_user_id = "audit_user_001"
    user = db.query(User).filter(User.id == test_user_id).first()
    if not user:
        user = User(
            id=test_user_id,
            email="audit@lucky10.test",
            username="audit_agency",
            name="Audit Agency",
            password_hash=get_password_hash("pass123"),
            role=UserRole.CUSTOMER,
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
        # STEP 1 & 2: TRACE SINGLE SAVE QUERIES
        query_logs.clear()
        record_queries = True

        single_payload = {
            "customerName": "AuditPunter",
            "gameSlot": "1 PM Game",
            "actionType": "SAVE",
            "totalAmount": 20.0,
            "items": [
                {
                    "number": "542",
                    "count": 2,
                    "type": "SUPER",
                    "unitPrice": 10.0,
                    "totalAmount": 20.0,
                }
            ],
        }

        t_start = time.perf_counter()
        res = await client.post("/api/customer/tickets", json=single_payload, headers=headers)
        t_end = time.perf_counter()
        record_queries = False

        save_total_ms = (t_end - t_start) * 1000
        saved_ticket_id = res.json()["id"] if res.status_code == 200 else None

        print("="*60)
        print("STEP 1 & 2: SINGLE SAVE QUERY BREAKDOWN")
        print("="*60)
        print(f"HTTP Status: {res.status_code}, Ticket ID: {saved_ticket_id}")
        print(f"Total Request Time: {save_total_ms:.3f} ms")
        print(f"Total SQL Queries: {len(query_logs)}")
        db_total_ms = sum(q["duration_ms"] for q in query_logs)
        print(f"Total DB Time: {db_total_ms:.3f} ms")
        print(f"Non-DB Backend Processing Time: {save_total_ms - db_total_ms:.3f} ms\n")

        for idx, q in enumerate(query_logs, 1):
            stmt = q['statement'].replace('\n', ' ')
            while '  ' in stmt:
                stmt = stmt.replace('  ', ' ')
            print(f"Query #{idx} [{q['duration_ms']:.3f} ms]:")
            print(f"  {stmt[:140]}...")

        # STEP 8: MEASURE BILL ID GENERATION DIRECT LATENCY
        db = SessionLocal()
        bill_id_times = []
        for _ in range(50):
            t0 = time.perf_counter()
            _ = get_next_ticket_id(db)
            t1 = time.perf_counter()
            bill_id_times.append((t1 - t0) * 1000)
        db.close()
        avg_bill_id_ms = statistics.mean(bill_id_times)
        print("\n" + "="*60)
        print("STEP 8: BILL ID GENERATION DIRECT MEASUREMENT")
        print("="*60)
        print(f"Bill ID Generation Avg: {avg_bill_id_ms:.3f} ms (Min: {min(bill_id_times):.3f} ms, Max: {max(bill_id_times):.3f} ms)")

        # STEP 1: BASELINE SAVE / DELETE / BILL LOADING (30 iterations)
        save_latencies = []
        created_ids = []
        for i in range(30):
            p = {
                "customerName": f"Punter_{i}",
                "gameSlot": "1 PM Game",
                "actionType": "SAVE",
                "totalAmount": 20.0,
                "items": [{"number": f"{(i*17)%900+100:03d}", "count": 2, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 20.0}],
            }
            t0 = time.perf_counter()
            r = await client.post("/api/customer/tickets", json=p, headers=headers)
            t1 = time.perf_counter()
            if r.status_code == 200:
                save_latencies.append((t1 - t0) * 1000)
                created_ids.append(r.json()["id"])

        # Delete measurement
        delete_latencies = []
        for tid in created_ids[:15]:
            t0 = time.perf_counter()
            r = await client.delete(f"/api/customer/tickets/{tid}", headers=headers)
            t1 = time.perf_counter()
            if r.status_code == 200:
                delete_latencies.append((t1 - t0) * 1000)

        # History load measurement
        history_latencies = []
        for _ in range(20):
            t0 = time.perf_counter()
            r = await client.get("/api/customer/tickets", headers=headers)
            t1 = time.perf_counter()
            if r.status_code == 200:
                history_latencies.append((t1 - t0) * 1000)

        print("\n" + "="*60)
        print("BASELINE PERFORMANCE METRICS (30 runs)")
        print("="*60)
        print(f"SAVE Total Avg:     {statistics.mean(save_latencies):.2f} ms (P50: {statistics.median(save_latencies):.2f} ms)")
        print(f"DELETE Avg:         {statistics.mean(delete_latencies):.2f} ms")
        print(f"Bill Loading Avg:   {statistics.mean(history_latencies):.2f} ms")

        # STEP 11: CONCURRENCY BENCHMARKS (10, 25, 50, 100 users)
        print("\n" + "="*60)
        print("STEP 11: CONCURRENT SAVE BENCHMARKS")
        print("="*60)

        for concurrency in [10, 25, 50, 100]:
            c_tokens = []
            db = SessionLocal()
            for u_idx in range(concurrency):
                u_id = f"audit_concur_{u_idx:03d}"
                if not db.query(User).filter(User.id == u_id).first():
                    u = User(
                        id=u_id,
                        email=f"concur_{u_idx}@test.com",
                        username=f"agency_{u_idx:03d}",
                        name=f"Agency {u_idx}",
                        password_hash=get_password_hash("pass"),
                        role=UserRole.CUSTOMER,
                        is_active=True,
                    )
                    db.add(u)
                c_tokens.append(create_access_token({"sub": u_id, "role": "CUSTOMER"}))
            db.commit()
            db.close()

            async def do_save(tok, idx):
                h = {"Authorization": f"Bearer {tok}"}
                p = {
                    "customerName": f"Punter_{idx}",
                    "gameSlot": "1 PM Game",
                    "actionType": "SAVE",
                    "totalAmount": 20.0,
                    "items": [{"number": f"{(idx * 19) % 900 + 100:03d}", "count": 2, "type": "SUPER", "unitPrice": 10.0, "totalAmount": 20.0}],
                }
                t0 = time.perf_counter()
                res = await client.post("/api/customer/tickets", json=p, headers=h)
                t1 = time.perf_counter()
                return (t1 - t0) * 1000, res.status_code, res.json() if res.status_code == 200 else None

            tasks = [do_save(c_tokens[i], i) for i in range(concurrency)]
            t_batch_0 = time.perf_counter()
            results = await asyncio.gather(*tasks)
            t_batch_1 = time.perf_counter()

            lats = [r[0] for r in results if r[1] == 200]
            ticket_ids = [r[2]["id"] for r in results if r[1] == 200 and r[2]]
            unique_ids = set(ticket_ids)
            errors = sum(1 for r in results if r[1] != 200)

            lats.sort()
            p50 = statistics.median(lats) if lats else 0
            p95 = lats[int(len(lats) * 0.95)] if lats else 0
            p99 = lats[int(len(lats) * 0.99)] if lats else 0
            avg = statistics.mean(lats) if lats else 0
            max_lat = max(lats) if lats else 0

            print(f"\n--- Concurrency: {concurrency} Simultaneous Saves ---")
            print(f"Success: {len(lats)}/{concurrency} (Errors: {errors})")
            print(f"Total Wall Clock Time: {(t_batch_1 - t_batch_0)*1000:.2f} ms")
            print(f"Avg Latency:  {avg:.2f} ms")
            print(f"P50 Latency:  {p50:.2f} ms")
            print(f"P95 Latency:  {p95:.2f} ms")
            print(f"P99 Latency:  {p99:.2f} ms")
            print(f"Max Latency:  {max_lat:.2f} ms")
            print(f"Duplicate Ticket IDs: {len(ticket_ids) - len(unique_ids)}")

if __name__ == "__main__":
    asyncio.run(run_audit())
