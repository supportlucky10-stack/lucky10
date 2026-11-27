import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from app.core.game_timing import (
    IST_TZ,
    is_game_slot_open,
    set_mock_ist_now,
    normalize_slot_name,
)

from app.models.user import User, UserRole
from app.models.ticket import Ticket, BetItem
from app.core.security import create_access_token, get_password_hash

def make_ist_dt(year, month, day, hour, minute, second):
    return datetime(year, month, day, hour, minute, second, tzinfo=IST_TZ)

# =========================================================================
# EXACT BOUNDARY UNIT TESTS
# =========================================================================

def test_1pm_cutoff_exact_seconds():
    # 12:58:58 -> ALLOWED
    assert is_game_slot_open("1 PM Game", make_ist_dt(2026, 8, 24, 12, 58, 58)) is True
    # 12:58:59 -> ALLOWED
    assert is_game_slot_open("1 PM Game", make_ist_dt(2026, 8, 24, 12, 58, 59)) is True
    # 12:59:00 -> BLOCKED
    assert is_game_slot_open("1 PM Game", make_ist_dt(2026, 8, 24, 12, 59, 0)) is False
    # 12:59:01 -> BLOCKED
    assert is_game_slot_open("1 PM Game", make_ist_dt(2026, 8, 24, 12, 59, 1)) is False
    # 12:59:44 -> BLOCKED
    assert is_game_slot_open("1 PM Game", make_ist_dt(2026, 8, 24, 12, 59, 44)) is False
    # 12:59:59 -> BLOCKED
    assert is_game_slot_open("1 PM Game", make_ist_dt(2026, 8, 24, 12, 59, 59)) is False

def test_3pm_cutoff_exact_seconds():
    # 3:02:58 -> ALLOWED
    assert is_game_slot_open("3 PM Game", make_ist_dt(2026, 8, 24, 15, 2, 58)) is True
    # 3:02:59 -> ALLOWED (immediately before cutoff)
    assert is_game_slot_open("3 PM Game", make_ist_dt(2026, 8, 24, 15, 2, 59)) is True
    # 15:03:00 -> BLOCKED (at cutoff)
    assert is_game_slot_open("3 PM Game", make_ist_dt(2026, 8, 24, 15, 3, 0)) is False
    # 15:03:01 -> BLOCKED
    assert is_game_slot_open("3 PM Game", make_ist_dt(2026, 8, 24, 15, 3, 1)) is False
    # 15:03:44 -> BLOCKED
    assert is_game_slot_open("3 PM Game", make_ist_dt(2026, 8, 24, 15, 3, 44)) is False
    # 15:03:59 -> BLOCKED
    assert is_game_slot_open("3 PM Game", make_ist_dt(2026, 8, 24, 15, 3, 59)) is False

def test_6pm_cutoff_exact_seconds():
    # 5:58:58 -> ALLOWED
    assert is_game_slot_open("6 PM Game", make_ist_dt(2026, 8, 24, 17, 58, 58)) is True
    # 5:58:59 -> ALLOWED
    assert is_game_slot_open("6 PM Game", make_ist_dt(2026, 8, 24, 17, 58, 59)) is True
    # 5:59:00 -> BLOCKED
    assert is_game_slot_open("6 PM Game", make_ist_dt(2026, 8, 24, 17, 59, 0)) is False
    # 5:59:01 -> BLOCKED
    assert is_game_slot_open("6 PM Game", make_ist_dt(2026, 8, 24, 17, 59, 1)) is False
    # 5:59:44 -> BLOCKED
    assert is_game_slot_open("6 PM Game", make_ist_dt(2026, 8, 24, 17, 59, 44)) is False
    # 5:59:59 -> BLOCKED
    assert is_game_slot_open("6 PM Game", make_ist_dt(2026, 8, 24, 17, 59, 59)) is False

def test_8pm_cutoff_exact_seconds():
    # 7:58:58 -> ALLOWED
    assert is_game_slot_open("8 PM Game", make_ist_dt(2026, 8, 24, 19, 58, 58)) is True
    # 7:58:59 -> ALLOWED
    assert is_game_slot_open("8 PM Game", make_ist_dt(2026, 8, 24, 19, 58, 59)) is True
    # 7:59:00 -> BLOCKED
    assert is_game_slot_open("8 PM Game", make_ist_dt(2026, 8, 24, 19, 59, 0)) is False
    # 7:59:01 -> BLOCKED
    assert is_game_slot_open("8 PM Game", make_ist_dt(2026, 8, 24, 19, 59, 1)) is False
    # 7:59:44 -> BLOCKED
    assert is_game_slot_open("8 PM Game", make_ist_dt(2026, 8, 24, 19, 59, 44)) is False
    # 7:59:59 -> BLOCKED
    assert is_game_slot_open("8 PM Game", make_ist_dt(2026, 8, 24, 19, 59, 59)) is False

def test_all_games_available_from_midnight_and_at_1230pm():
    # Midnight 00:00:00 AM
    midnight = make_ist_dt(2026, 8, 24, 0, 0, 0)
    assert is_game_slot_open("1 PM Game", midnight) is True
    assert is_game_slot_open("3 PM Game", midnight) is True
    assert is_game_slot_open("6 PM Game", midnight) is True
    assert is_game_slot_open("8 PM Game", midnight) is True

    # 12:30:00 PM
    t1230 = make_ist_dt(2026, 8, 24, 12, 30, 0)
    assert is_game_slot_open("1 PM Game", t1230) is True
    assert is_game_slot_open("3 PM Game", t1230) is True
    assert is_game_slot_open("6 PM Game", t1230) is True
    assert is_game_slot_open("8 PM Game", t1230) is True

if __name__ == "__main__":
    test_1pm_cutoff_exact_seconds()
    test_3pm_cutoff_exact_seconds()
    test_6pm_cutoff_exact_seconds()
    test_8pm_cutoff_exact_seconds()
    test_all_games_available_from_midnight_and_at_1230pm()
    print("ALL BILLING CUTOFF BOUNDARY TESTS PASSED!")
