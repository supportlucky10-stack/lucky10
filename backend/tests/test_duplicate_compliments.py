import pytest
from app.core.game_rules import evaluate_bet_item, evaluate_ticket_items, get_flat_compliments

def test_case_1_two_duplicate_compliments_count_1():
    comps = ["315", "315"]
    res = evaluate_bet_item(
        number="315",
        item_type="SUPER",
        count=1,
        p1="742",
        compliments=comps,
    )
    assert res["is_winner"] is True
    assert res["prize_title"] == "COMPLIMENT PRIZE"
    assert res["compliment_occurrences"] == 2
    assert res["win_amount"] == 40.0

    # Test evaluate_ticket_items produces 2 winning records
    ticket_items = [{"id": "item-1", "number": "315", "type": "SUPER", "count": 1}]
    t_eval = evaluate_ticket_items(ticket_items, p1="742", compliments=comps)
    assert t_eval["is_winner"] is True
    assert t_eval["total_win_amount"] == 40.0
    assert len(t_eval["winning_items"]) == 2
    assert t_eval["winning_items"][0]["eval"]["win_amount"] == 20.0
    assert t_eval["winning_items"][1]["eval"]["win_amount"] == 20.0

def test_case_2_three_duplicate_compliments_count_1():
    comps = ["315", "315", "315"]
    res = evaluate_bet_item(
        number="315",
        item_type="SUPER",
        count=1,
        p1="742",
        compliments=comps,
    )
    assert res["is_winner"] is True
    assert res["compliment_occurrences"] == 3
    assert res["win_amount"] == 60.0

    ticket_items = [{"id": "item-1", "number": "315", "type": "SUPER", "count": 1}]
    t_eval = evaluate_ticket_items(ticket_items, p1="742", compliments=comps)
    assert t_eval["total_win_amount"] == 60.0
    assert len(t_eval["winning_items"]) == 3
    for w in t_eval["winning_items"]:
        assert w["eval"]["win_amount"] == 20.0

def test_case_3_two_duplicate_compliments_count_5():
    comps = ["315", "315"]
    res = evaluate_bet_item(
        number="315",
        item_type="SUPER",
        count=5,
        p1="742",
        compliments=comps,
    )
    assert res["is_winner"] is True
    assert res["compliment_occurrences"] == 2
    assert res["win_amount"] == 200.0  # 5 * 20 * 2 = 200

    ticket_items = [{"id": "item-1", "number": "315", "type": "SUPER", "count": 5}]
    t_eval = evaluate_ticket_items(ticket_items, p1="742", compliments=comps)
    assert t_eval["total_win_amount"] == 200.0
    assert len(t_eval["winning_items"]) == 2
    assert t_eval["winning_items"][0]["eval"]["win_amount"] == 100.0
    assert t_eval["winning_items"][1]["eval"]["win_amount"] == 100.0

def test_case_4_multiple_numbers_with_duplicates():
    comps = ["315", "420", "315", "789", "420"]
    ticket_items = [
        {"id": "item-1", "number": "315", "type": "SUPER", "count": 1},
        {"id": "item-2", "number": "420", "type": "SUPER", "count": 2},
    ]
    t_eval = evaluate_ticket_items(ticket_items, p1="742", compliments=comps)
    # 315 x 1 in comps twice: 1 * 20 * 2 = 40 (2 records of 20)
    # 420 x 2 in comps twice: 2 * 20 * 2 = 80 (2 records of 40)
    # Total win = 120
    assert t_eval["total_win_amount"] == 120.0
    assert len(t_eval["winning_items"]) == 4

def test_case_5_single_normal_compliment():
    comps = ["315", "123", "456"]
    res = evaluate_bet_item(
        number="315",
        item_type="SUPER",
        count=1,
        p1="742",
        compliments=comps,
    )
    assert res["is_winner"] is True
    assert res["compliment_occurrences"] == 1
    assert res["win_amount"] == 20.0

    ticket_items = [{"id": "item-1", "number": "315", "type": "SUPER", "count": 1}]
    t_eval = evaluate_ticket_items(ticket_items, p1="742", compliments=comps)
    assert t_eval["total_win_amount"] == 20.0
    assert len(t_eval["winning_items"]) == 1
    assert t_eval["winning_items"][0]["eval"]["win_amount"] == 20.0

def test_case_6_no_match_lost():
    comps = ["123", "456"]
    res = evaluate_bet_item(
        number="315",
        item_type="SUPER",
        count=1,
        p1="742",
        compliments=comps,
    )
    assert res["is_winner"] is False
    assert res["win_amount"] == 0.0

def test_case_7_flat_compliments_preserves_duplicates():
    raw_json = '["315", "315", "420", "315"]'
    flat = get_flat_compliments(raw_json)
    assert flat == ["315", "315", "420", "315"]
    assert flat.count("315") == 3
