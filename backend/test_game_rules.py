import sys
from app.core.game_rules import evaluate_bet_item, evaluate_ticket_items, get_flat_compliments

def run_tests():
    print("==================================================")
    print("STARTING COMPLETE GAME RULES & PRIZE ENGINE TESTS")
    print("==================================================")

    # Example published result:
    p1 = "742"
    p2 = "381"
    p3 = "915"
    p4 = "264"
    p5 = "530"
    p6 = "817"
    compliments = ["817", "123", "456"]

    # ----------------------------------------------------
    # TEST 1: 1 DIGIT (A, B, C) — 1ST PRIZE ONLY
    # ----------------------------------------------------
    # A=7, B=4, C=2
    # 5 count (₹60) -> ₹500 payout
    res_a = evaluate_bet_item("A:7", "Pair", 5, p1, p2, p3, p4, p5, p6, compliments)
    assert res_a["is_winner"] == True, "A:7 should win against 742"
    assert res_a["win_amount"] == 500.0, f"Expected 500.0, got {res_a['win_amount']}"

    res_b = evaluate_bet_item("B:4", "Pair", 5, p1, p2, p3, p4, p5, p6, compliments)
    assert res_b["is_winner"] == True, "B:4 should win against 742"
    assert res_b["win_amount"] == 500.0, f"Expected 500.0, got {res_b['win_amount']}"

    res_c = evaluate_bet_item("C:2", "Pair", 10, p1, p2, p3, p4, p5, p6, compliments) # 10 count -> ₹1000
    assert res_c["is_winner"] == True, "C:2 should win against 742"
    assert res_c["win_amount"] == 1000.0, f"Expected 1000.0, got {res_c['win_amount']}"

    # Critical: Check that 2nd Prize digits DO NOT win 1 Digit!
    # p2 is "381" -> A=3 in p2 must NOT win!
    res_p2_a = evaluate_bet_item("A:3", "Pair", 5, p1, p2, p3, p4, p5, p6, compliments)
    assert res_p2_a["is_winner"] == False, "2nd prize must NOT trigger 1-Digit win"

    print("[PASS] TEST 1: 1 Digit (A, B, C) strictly uses 1st Prize.")

    # ----------------------------------------------------
    # TEST 2: 2 DIGIT (AB, BC, AC) — 1ST PRIZE ONLY
    # ----------------------------------------------------
    # AB=74, BC=42, AC=72
    # 1 count (₹10) -> ₹700 (70x)
    res_ab = evaluate_bet_item("AB:74", "Pair", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert res_ab["is_winner"] == True, "AB:74 should win against 742"
    assert res_ab["win_amount"] == 700.0, f"Expected 700.0, got {res_ab['win_amount']}"

    res_bc = evaluate_bet_item("BC:42", "Pair", 2, p1, p2, p3, p4, p5, p6, compliments) # 2 count (₹20) -> ₹1400
    assert res_bc["is_winner"] == True, "BC:42 should win against 742"
    assert res_bc["win_amount"] == 1400.0, f"Expected 1400.0, got {res_bc['win_amount']}"

    res_ac = evaluate_bet_item("AC:72", "Pair", 5, p1, p2, p3, p4, p5, p6, compliments) # 5 count (₹50) -> ₹3500
    assert res_ac["is_winner"] == True, "AC:72 should win against 742"
    assert res_ac["win_amount"] == 3500.0, f"Expected 3500.0, got {res_ac['win_amount']}"

    # Critical: Check that 2nd Prize pairs DO NOT win 2 Digit!
    # p2 is "381" -> AB=38 in p2 must NOT win!
    res_p2_ab = evaluate_bet_item("AB:38", "Pair", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert res_p2_ab["is_winner"] == False, "2nd prize must NOT trigger 2-Digit win"

    print("[PASS] TEST 2: 2 Digit (AB, BC, AC) strictly uses 1st Prize.")

    # ----------------------------------------------------
    # TEST 3: BOX (SHUFFLE) — 1ST PRIZE ONLY
    # ----------------------------------------------------
    # Case A: 3 unique digits (742)
    # Straight (742): ₹3000 per ₹10
    box_straight = evaluate_bet_item("742", "BOX", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert box_straight["is_winner"] == True
    assert box_straight["win_amount"] == 3000.0, f"Expected 3000.0, got {box_straight['win_amount']}"
    assert "STRAIGHT" in box_straight["prize_title"]

    # Ulta-Turn (427): ₹800 per ₹10
    box_ulta = evaluate_bet_item("427", "BOX", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert box_ulta["is_winner"] == True
    assert box_ulta["win_amount"] == 800.0, f"Expected 800.0, got {box_ulta['win_amount']}"
    assert "ULTA-TURN" in box_ulta["prize_title"]

    # Case B: 2 duplicate digits (e.g. 774)
    # Double Direct (774): ₹3800 per ₹10
    box_dd = evaluate_bet_item("774", "BOX", 1, "774", p2, p3, p4, p5, p6, compliments)
    assert box_dd["is_winner"] == True
    assert box_dd["win_amount"] == 3800.0, f"Expected 3800.0, got {box_dd['win_amount']}"
    assert "DOUBLE DIRECT" in box_dd["prize_title"]

    # Double Turn (477): ₹1600 per ₹10
    box_dt = evaluate_bet_item("477", "BOX", 1, "774", p2, p3, p4, p5, p6, compliments)
    assert box_dt["is_winner"] == True
    assert box_dt["win_amount"] == 1600.0, f"Expected 1600.0, got {box_dt['win_amount']}"
    assert "DOUBLE TURN" in box_dt["prize_title"]

    # Critical: Check that permutations of 2nd Prize DO NOT win Box!
    # p2 is "381" -> Box "138" must NOT win!
    res_p2_box = evaluate_bet_item("138", "BOX", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert res_p2_box["is_winner"] == False, "2nd prize must NOT trigger Box win"

    print("[PASS] TEST 3: Box / Shuffle strictly uses 1st Prize permutations.")

    # ----------------------------------------------------
    # TEST 4: 3-DIGIT SUPER — MATCHES ALL 6 PRIZES
    # ----------------------------------------------------
    # 1st Prize (742): ₹5000 per ₹10
    sup_1 = evaluate_bet_item("742", "SUPER", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert sup_1["is_winner"] == True and sup_1["win_amount"] == 5000.0

    # 2nd Prize (381): ₹500 per ₹10
    sup_2 = evaluate_bet_item("381", "SUPER", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert sup_2["is_winner"] == True and sup_2["win_amount"] == 500.0

    # 3rd Prize (915): ₹250 per ₹10
    sup_3 = evaluate_bet_item("915", "SUPER", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert sup_3["is_winner"] == True and sup_3["win_amount"] == 250.0

    # 4th Prize (264): ₹100 per ₹10
    sup_4 = evaluate_bet_item("264", "SUPER", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert sup_4["is_winner"] == True and sup_4["win_amount"] == 100.0

    # 5th Prize (530): ₹50 per ₹10
    sup_5 = evaluate_bet_item("530", "SUPER", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert sup_5["is_winner"] == True and sup_5["win_amount"] == 50.0

    # 6th Prize / Compliment (817): ₹20 per ₹10
    sup_6 = evaluate_bet_item("817", "SUPER", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert sup_6["is_winner"] == True and sup_6["win_amount"] == 20.0

    # Compliments list match (123): ₹20 per ₹10
    sup_comp = evaluate_bet_item("123", "SUPER", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert sup_comp["is_winner"] == True and sup_comp["win_amount"] == 20.0

    # Non-matching number: loss
    sup_none = evaluate_bet_item("999", "SUPER", 1, p1, p2, p3, p4, p5, p6, compliments)
    assert sup_none["is_winner"] == False and sup_none["win_amount"] == 0.0

    # ----------------------------------------------------
    # TEST 5: FULL RATE TABLE MATRIX ASSERTIONS
    # ----------------------------------------------------
    # 1 Digit Table (₹12 per count, 5 count = ₹60 -> ₹500 payout):
    # 5 count -> ₹500
    # 10 count -> ₹1,000
    # 15 count -> ₹1,500
    # 100 count -> ₹10,000
    assert evaluate_bet_item("A:7", "Pair", 5, p1)["win_amount"] == 500.0
    assert evaluate_bet_item("A:7", "Pair", 10, p1)["win_amount"] == 1000.0
    assert evaluate_bet_item("A:7", "Pair", 15, p1)["win_amount"] == 1500.0
    assert evaluate_bet_item("A:7", "Pair", 100, p1)["win_amount"] == 10000.0

    # 2 Digit Table:
    # ₹10 (1 count) -> ₹700
    # ₹20 (2 count) -> ₹1,400
    # ₹30 (3 count) -> ₹2,100
    # ₹40 (4 count) -> ₹2,800
    # ₹50 (5 count) -> ₹3,500
    # ₹60 (6 count) -> ₹4,200
    # ₹100 (10 count) -> ₹7,000
    assert evaluate_bet_item("AB:74", "Pair", 1, p1)["win_amount"] == 700.0
    assert evaluate_bet_item("AB:74", "Pair", 2, p1)["win_amount"] == 1400.0
    assert evaluate_bet_item("AB:74", "Pair", 3, p1)["win_amount"] == 2100.0
    assert evaluate_bet_item("AB:74", "Pair", 4, p1)["win_amount"] == 2800.0
    assert evaluate_bet_item("AB:74", "Pair", 5, p1)["win_amount"] == 3500.0
    assert evaluate_bet_item("AB:74", "Pair", 6, p1)["win_amount"] == 4200.0
    assert evaluate_bet_item("AB:74", "Pair", 10, p1)["win_amount"] == 7000.0

    # Super Table (1st, 2nd, 3rd, 4th, 5th, 6th):
    # ₹10: 1st=5000, 2nd=500, 3rd=250, 4th=100, 5th=50, 6th=20
    # ₹20: 1st=10000, 2nd=1000, 3rd=500, 4th=200, 5th=100, 6th=40
    # ₹30: 1st=15000, 2nd=1500, 3rd=750, 4th=300, 5th=150, 6th=60
    # ₹50: 1st=25000, 2nd=2500, 3rd=1250, 4th=500, 5th=250, 6th=100
    # ₹100: 1st=50000, 2nd=5000, 3rd=2500, 4th=1000, 5th=500, 6th=200
    rates = [1, 2, 3, 5, 10]
    expected_super_p1 = [5000, 10000, 15000, 25000, 50000]
    expected_super_p2 = [500, 1000, 1500, 2500, 5000]
    expected_super_p3 = [250, 500, 750, 1250, 2500]
    expected_super_p4 = [100, 200, 300, 500, 1000]
    expected_super_p5 = [50, 100, 150, 250, 500]
    expected_super_p6 = [20, 40, 60, 100, 200]

    for idx, r in enumerate(rates):
        assert evaluate_bet_item("742", "SUPER", r, p1, p2, p3, p4, p5, p6)["win_amount"] == expected_super_p1[idx]
        assert evaluate_bet_item("381", "SUPER", r, p1, p2, p3, p4, p5, p6)["win_amount"] == expected_super_p2[idx]
        assert evaluate_bet_item("915", "SUPER", r, p1, p2, p3, p4, p5, p6)["win_amount"] == expected_super_p3[idx]
        assert evaluate_bet_item("264", "SUPER", r, p1, p2, p3, p4, p5, p6)["win_amount"] == expected_super_p4[idx]
        assert evaluate_bet_item("530", "SUPER", r, p1, p2, p3, p4, p5, p6)["win_amount"] == expected_super_p5[idx]
        assert evaluate_bet_item("817", "SUPER", r, p1, p2, p3, p4, p5, p6)["win_amount"] == expected_super_p6[idx]

    # Box Table (Straight, Ulta-Turn, Double Direct, Double Turn):
    # ₹10: Str=3000, Ulta=800, DD=3800, DT=1600
    # ₹20: Str=6000, Ulta=1600, DD=7600, DT=3200
    # ₹50: Str=15000, Ulta=4000, DD=19000, DT=8000
    # ₹100: Str=30000, Ulta=8000, DD=38000, DT=16000
    for idx, r in enumerate([1, 2, 5, 10]):
        exp_str = [3000, 6000, 15000, 30000][idx]
        exp_ulta = [800, 1600, 4000, 8000][idx]
        exp_dd = [3800, 7600, 19000, 38000][idx]
        exp_dt = [1600, 3200, 8000, 16000][idx]

        assert evaluate_bet_item("742", "BOX", r, "742")["win_amount"] == exp_str
        assert evaluate_bet_item("427", "BOX", r, "742")["win_amount"] == exp_ulta
        assert evaluate_bet_item("774", "BOX", r, "774")["win_amount"] == exp_dd
        assert evaluate_bet_item("477", "BOX", r, "774")["win_amount"] == exp_dt

    print("[PASS] TEST 5: Complete prize rate tables match 100% with requirements.")

if __name__ == "__main__":
    run_tests()
