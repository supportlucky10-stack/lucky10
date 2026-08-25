"""
Historical Date Data Isolation Tests
"""
import pytest
import uuid
from datetime import datetime, timezone
from app.models.ticket import Ticket, BetItem
from app.models.game_result import GameResult
from app.core.game_timing import IST_TZ, set_mock_ist_now


def make_ticket_utc(db, user_id, game_slot, placed_at_utc, ticket_id=None):
    if ticket_id is None:
        ticket_id = f"T{uuid.uuid4().hex[:8].upper()}"
    t = Ticket(
        id=ticket_id,
        user_id=user_id,
        customer_name="Test",
        game_slot=game_slot,
        total_amount=100.0,
        status="PENDING",
        win_amount=0.0,
        placed_at=placed_at_utc,
    )
    db.add(t)
    item = BetItem(
        id=f"bet_{uuid.uuid4().hex[:8]}",
        ticket_id=ticket_id,
        number="123",
        count=10,
        type="SUPER",
        unit_price=10.0,
        total_amount=100.0,
    )
    db.add(item)
    db.commit()
    return t


def make_result(db, date_str, game_slot, prize1="123"):
    res = GameResult(
        id=f"res_{uuid.uuid4().hex[:8]}",
        date=date_str,
        game_slot=game_slot,
        prize1=prize1,
        prize2="456",
        prize3="789",
        prize4="012",
        prize5="345",
        compliments_json="[]",
        published_at=datetime.now(timezone.utc),
    )
    db.add(res)
    db.commit()
    return res


def ist_date(year, month, day, hour, minute, second):
    ist_dt = datetime(year, month, day, hour, minute, second, tzinfo=IST_TZ)
    return ist_dt.astimezone(timezone.utc)


class TestCustomerTicketsByDate:
    def test_returns_only_requested_date_tickets(self, client, db_session, test_customer_user, customer_token_headers):
        uid = test_customer_user.id
        t23 = make_ticket_utc(db_session, uid, "1 PM Game", ist_date(2026, 8, 23, 14, 0, 0), "T23_001")
        t24 = make_ticket_utc(db_session, uid, "1 PM Game", ist_date(2026, 8, 24, 14, 0, 0), "T24_001")
        t25 = make_ticket_utc(db_session, uid, "1 PM Game", ist_date(2026, 8, 25, 14, 0, 0), "T25_001")

        def get_ids(date_str):
            resp = client.get(f"/api/customer/tickets/by-date?date={date_str}", headers=customer_token_headers)
            assert resp.status_code == 200
            return {tkt["id"] for tkt in resp.json()}

        ids_23 = get_ids("2026-08-23")
        ids_24 = get_ids("2026-08-24")
        ids_25 = get_ids("2026-08-25")
        assert t23.id in ids_23 and t24.id not in ids_23 and t25.id not in ids_23
        assert t24.id in ids_24 and t23.id not in ids_24 and t25.id not in ids_24
        assert t25.id in ids_25 and t23.id not in ids_25 and t24.id not in ids_25

    def test_ist_midnight_boundary(self, client, db_session, test_customer_user, customer_token_headers):
        uid = test_customer_user.id
        t_late_24 = make_ticket_utc(db_session, uid, "8 PM Game", ist_date(2026, 8, 24, 23, 59, 59), "T24_LATE")
        t_early_25 = make_ticket_utc(db_session, uid, "1 PM Game", ist_date(2026, 8, 25, 0, 0, 0), "T25_EARLY")
        ids_24 = {t["id"] for t in client.get("/api/customer/tickets/by-date?date=2026-08-24", headers=customer_token_headers).json()}
        ids_25 = {t["id"] for t in client.get("/api/customer/tickets/by-date?date=2026-08-25", headers=customer_token_headers).json()}
        assert t_late_24.id in ids_24 and t_late_24.id not in ids_25
        assert t_early_25.id in ids_25 and t_early_25.id not in ids_24

    def test_empty_date_returns_empty(self, client, db_session, test_customer_user, customer_token_headers):
        resp = client.get("/api/customer/tickets/by-date?date=2020-01-01", headers=customer_token_headers)
        assert resp.status_code == 200 and resp.json() == []


class TestAdminTicketsByDate:
    def test_admin_by_date_isolation(self, client, db_session, test_customer_user, test_admin_user, admin_token_headers):
        uid = test_customer_user.id
        t23 = make_ticket_utc(db_session, uid, "3 PM Game", ist_date(2026, 8, 23, 15, 0, 0), "AT23_001")
        t24 = make_ticket_utc(db_session, uid, "3 PM Game", ist_date(2026, 8, 24, 15, 0, 0), "AT24_001")
        ids_23 = {t["id"] for t in client.get("/api/admin/tickets/by-date?date=2026-08-23", headers=admin_token_headers).json()}
        ids_24 = {t["id"] for t in client.get("/api/admin/tickets/by-date?date=2026-08-24", headers=admin_token_headers).json()}
        assert t23.id in ids_23 and t24.id not in ids_23
        assert t24.id in ids_24 and t23.id not in ids_24


class TestResultsByDateIsolation:
    def test_results_date_isolation(self, client, db_session):
        make_result(db_session, "2026-08-24", "1 PM Game", "111")
        make_result(db_session, "2026-08-25", "1 PM Game", "222")
        d24 = client.get("/api/customer/results/by-date?date=2026-08-24").json()
        d25 = client.get("/api/customer/results/by-date?date=2026-08-25").json()
        p24 = d24.get("1 PM Game", d24.get("2026-08-24_1 PM Game", {})).get("prize1")
        p25 = d25.get("1 PM Game", d25.get("2026-08-25_1 PM Game", {})).get("prize1")
        assert p24 == "111", f"24-Aug prize wrong: {p24}"
        assert p25 == "222", f"25-Aug prize wrong: {p25}"

    def test_publishing_25aug_does_not_overwrite_24aug(self, client, db_session, test_admin_user, admin_token_headers):
        make_result(db_session, "2026-08-24", "1 PM Game", "444")
        set_mock_ist_now(datetime(2026, 8, 25, 14, 0, 0, tzinfo=IST_TZ))
        client.post("/api/admin/results", json={
            "date": "2026-08-25", "gameSlot": "1 PM Game",
            "prize1": "555", "prize2": "666", "prize3": "777", "prize4": "888", "prize5": "999", "compliments": [],
        }, headers=admin_token_headers)
        d24 = client.get("/api/customer/results/by-date?date=2026-08-24").json()
        p24 = d24.get("1 PM Game", d24.get("2026-08-24_1 PM Game", {})).get("prize1")
        assert p24 == "444", f"24-Aug result overwritten! Got: {p24}"


class TestAllSlotsDateIsolation:
    def test_all_four_slots_isolated(self, client, db_session, test_customer_user, customer_token_headers):
        uid = test_customer_user.id
        slots = ["1 PM Game", "3 PM Game", "6 PM Game", "8 PM Game"]
        slot_hours = {"1 PM Game": 13, "3 PM Game": 15, "6 PM Game": 18, "8 PM Game": 20}
        ticket_ids = {}
        for date_day, date_str in [(24, "2026-08-24"), (25, "2026-08-25")]:
            for slot in slots:
                tid = f"TS{date_day}{slot.replace(' ', '')}"
                make_ticket_utc(db_session, uid, slot, ist_date(2026, 8, date_day, slot_hours[slot], 0, 0), tid)
                ticket_ids[(date_str, slot)] = tid
        for date_str in ["2026-08-24", "2026-08-25"]:
            ids = {t["id"] for t in client.get(f"/api/customer/tickets/by-date?date={date_str}", headers=customer_token_headers).json()}
            other = "2026-08-25" if date_str == "2026-08-24" else "2026-08-24"
            for slot in slots:
                assert ticket_ids[(date_str, slot)] in ids, f"{slot} {date_str} missing"
                assert ticket_ids[(other, slot)] not in ids, f"{slot} from {other} leaked into {date_str}"
