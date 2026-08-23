from datetime import datetime, time, timezone, timedelta
from typing import Optional, Dict

# Business Timezone is Asia/Kolkata (IST = UTC + 5:30)
IST_OFFSET = timedelta(hours=5, minutes=30)
IST_TZ = timezone(IST_OFFSET, name="IST")

SLOT_CUTOFF_TIMES = {
    "1 PM": time(13, 0, 0),
    "1 PM Game": time(13, 0, 0),
    "3 PM": time(15, 0, 0),
    "3 PM Game": time(15, 0, 0),
    "6 PM": time(18, 0, 0),
    "6 PM Game": time(18, 0, 0),
    "8 PM": time(20, 0, 0),
    "8 PM Game": time(20, 0, 0),
}

STANDARD_SLOTS = ["1 PM Game", "3 PM Game", "6 PM Game", "8 PM Game"]

_mock_ist_now: Optional[datetime] = None

def set_mock_ist_now(dt: Optional[datetime]) -> None:
    """Set or clear mock clock for testing."""
    global _mock_ist_now
    _mock_ist_now = dt

def get_ist_now() -> datetime:
    """Returns current authoritative time in Asia/Kolkata (IST)."""
    global _mock_ist_now
    if _mock_ist_now is not None:
        return _mock_ist_now
    return datetime.now(timezone.utc).astimezone(IST_TZ)

def get_business_date(now_ist: Optional[datetime] = None) -> str:
    """Returns business date in YYYY-MM-DD formatted string in IST."""
    if now_ist is None:
        now_ist = get_ist_now()
    return now_ist.strftime("%Y-%m-%d")

def normalize_slot_name(slot: str) -> str:
    """Normalizes slot strings to standard slot format."""
    s = (slot or "").strip()
    if "1" in s and "PM" in s.upper():
        return "1 PM Game"
    if "3" in s and "PM" in s.upper():
        return "3 PM Game"
    if "6" in s and "PM" in s.upper():
        return "6 PM Game"
    if "8" in s and "PM" in s.upper():
        return "8 PM Game"
    return s

def is_game_slot_open(game_slot: str, now_ist: Optional[datetime] = None) -> bool:
    """
    Determines if billing for a game slot is OPEN.
    Cutoff Rules in IST:
      - 1 PM Game: OPEN before 13:00:00; LOCKED at/after 13:00:00
      - 3 PM Game: OPEN before 15:00:00; LOCKED at/after 15:00:00
      - 6 PM Game: OPEN before 18:00:00; LOCKED at/after 18:00:00
      - 8 PM Game: OPEN before 20:00:00; LOCKED at/after 20:00:00
    """
    if now_ist is None:
        now_ist = get_ist_now()

    norm_slot = normalize_slot_name(game_slot)
    cutoff = SLOT_CUTOFF_TIMES.get(norm_slot)
    if cutoff is None:
        # Fallback to direct lookup
        cutoff = SLOT_CUTOFF_TIMES.get(game_slot, time(20, 0, 0))

    # Exact boundary check: open strictly before cutoff
    return now_ist.time() < cutoff

def is_game_result_publishable(game_slot: str, target_date: str, now_ist: Optional[datetime] = None) -> bool:
    """
    Determines if Admin can publish results for a given slot and date.
    - Past dates: Always publishable.
    - Future dates: Not publishable.
    - Today's date: Publishable only at/after game billing lock time.
    """
    if now_ist is None:
        now_ist = get_ist_now()

    today_str = get_business_date(now_ist)
    if target_date < today_str:
        return True
    if target_date > today_str:
        return False

    # For today, result is publishable when billing is locked (at or after cutoff)
    return not is_game_slot_open(game_slot, now_ist)

def get_all_game_slot_statuses(now_ist: Optional[datetime] = None) -> Dict:
    """Returns a dictionary of all 4 slots and their open/locked status with business date."""
    if now_ist is None:
        now_ist = get_ist_now()

    b_date = get_business_date(now_ist)
    statuses = {
        "business_date": b_date,
        "ist_time": now_ist.strftime("%H:%M:%S"),
        "slots": {
            slot: {
                "isOpen": is_game_slot_open(slot, now_ist),
                "isPublishable": is_game_result_publishable(slot, b_date, now_ist),
            }
            for slot in STANDARD_SLOTS
        }
    }
    return statuses
