import json
from typing import Dict, Any, List, Optional

def get_flat_compliments(compliments_json: Optional[str]) -> List[str]:
    """
    Extracts a flat list of 3-digit compliment numbers from compliments JSON string or list.
    """
    if not compliments_json:
        return []
    try:
        parsed = json.loads(compliments_json) if isinstance(compliments_json, str) else compliments_json
        if isinstance(parsed, list):
            flat = []
            for item in parsed:
                if isinstance(item, list):
                    flat.extend([str(x).strip() for x in item if str(x).strip()])
                elif isinstance(item, str) and item.strip():
                    flat.append(item.strip())
            return flat
    except Exception:
        pass
    return []

def evaluate_bet_item(
    number: str,
    item_type: str,
    count: float,
    p1: str,
    p2: str = "",
    p3: str = "",
    p4: str = "",
    p5: str = "",
    p6: str = "",
    compliments: List[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates a single bet item against a game result.
    
    Category A (1st Prize ONLY):
      - 1 Digit (A, B, C): matches position of 1st Prize. Rate: ₹180 -> ₹500 (unitPrice ₹12, count * 500 / 15)
      - 2 Digit (AB, BC, AC): matches pair of 1st Prize. Rate: ₹10 -> ₹700 (70x multiplier)
      - Box (Shuffle): matches permutations of 1st Prize ONLY:
        * Straight (3 unique, exact match): ₹3,000 per ₹10 count (300x)
        * Ulta-Turn (3 unique, permutation match): ₹800 per ₹10 count (80x)
        * Double Direct (2 duplicate, exact match): ₹3,800 per ₹10 count (380x)
        * Double Turn (2 duplicate, permutation match): ₹1,600 per ₹10 count (160x)
        * 3 Identical (e.g. 777): ₹3,000 per ₹10 count (300x)
        
    Category B (All 6 Prizes):
      - 3-Digit Super: 
        * 1st: ₹5,000 per ₹10 count (500x)
        * 2nd: ₹500 per ₹10 count (50x)
        * 3rd: ₹250 per ₹10 count (25x)
        * 4th: ₹100 per ₹10 count (10x)
        * 5th: ₹50 per ₹10 count (5x)
        * 6th / Compliment: ₹20 per ₹10 count (2x)
    """
    if compliments is None:
        compliments = []

    not_won = {
        "is_winner": False,
        "prize_title": "",
        "win_amount": 0.0,
        "matched_number": "",
        "rate_multiplier": 0.0,
        "matched_position": "",
    }

    if not p1 or len(p1.strip()) < 3:
        return not_won

    p1 = p1.strip()
    p2 = (p2 or "").strip()
    p3 = (p3 or "").strip()
    p4 = (p4 or "").strip()
    p5 = (p5 or "").strip()
    p6 = (p6 or "").strip()

    num_str = (number or "").strip()
    itype = (item_type or "").upper()

    # ----------------------------------------------------
    # 1. 1-DIGIT (A, B, C) — BASED ONLY ON 1ST PRIZE
    # ----------------------------------------------------
    if num_str.startswith("A:") or num_str.startswith("B:") or num_str.startswith("C:") or itype in ("A", "B", "C"):
        pos = "A"
        val = num_str
        if ":" in num_str:
            parts = num_str.split(":")
            pos = parts[0].upper()
            val = parts[1] if len(parts) > 1 else ""
        elif itype in ("A", "B", "C"):
            pos = itype

        p1A = p1[0]
        p1B = p1[1]
        p1C = p1[2]

        match = False
        if pos == "A" and val == p1A: match = True
        if pos == "B" and val == p1B: match = True
        if pos == "C" and val == p1C: match = True

        if match:
            # 1 Digit Rate Table: 1 count (₹60) -> ₹500
            win_amt = round(count * 500.0, 2)
            return {
                "is_winner": True,
                "prize_title": f"1 DIGIT ({pos})",
                "win_amount": win_amt,
                "matched_number": num_str,
                "rate_multiplier": 500.0 / 60.0,
                "matched_position": f"1st Prize Position {pos}",
            }
        return not_won

    # ----------------------------------------------------
    # 2. 2-DIGIT (AB, BC, AC) — BASED ONLY ON 1ST PRIZE
    # ----------------------------------------------------
    if num_str.startswith("AB:") or num_str.startswith("BC:") or num_str.startswith("AC:") or itype in ("AB", "BC", "AC"):
        pos = "AB"
        val = num_str
        if ":" in num_str:
            parts = num_str.split(":")
            pos = parts[0].upper()
            val = parts[1] if len(parts) > 1 else ""
        elif itype in ("AB", "BC", "AC"):
            pos = itype

        p1AB = p1[0:2]
        p1BC = p1[1:3]
        p1AC = p1[0] + p1[2]

        match = False
        if pos == "AB" and val == p1AB: match = True
        if pos == "BC" and val == p1BC: match = True
        if pos == "AC" and val == p1AC: match = True

        if match:
            # 2 Digit Rate Table: ₹10 -> ₹700 (70x multiplier)
            win_amt = count * 700.0
            return {
                "is_winner": True,
                "prize_title": f"2 DIGIT ({pos})",
                "win_amount": win_amt,
                "matched_number": num_str,
                "rate_multiplier": 70.0,
                "matched_position": f"1st Prize Pair {pos}",
            }
        return not_won

    # ----------------------------------------------------
    # 3. BOX / SHUFFLE — BASED ONLY ON 1ST PRIZE
    # ----------------------------------------------------
    if itype in ("SHUFFLE", "BOX"):
        if len(num_str) == 3 and len(p1) == 3:
            sorted_bet = "".join(sorted(num_str))
            sorted_p1 = "".join(sorted(p1))

            if sorted_bet == sorted_p1:
                unique_digits = len(set(p1))

                if unique_digits == 3:
                    if num_str == p1:
                        # Straight: ₹3000
                        return {
                            "is_winner": True,
                            "prize_title": "BOX (STRAIGHT)",
                            "win_amount": count * 3000.0,
                            "matched_number": num_str,
                            "rate_multiplier": 300.0,
                            "matched_position": "1st Prize Exact Permutation",
                        }
                    else:
                        # Ulta-Turn: ₹800
                        return {
                            "is_winner": True,
                            "prize_title": "BOX (ULTA-TURN)",
                            "win_amount": count * 800.0,
                            "matched_number": num_str,
                            "rate_multiplier": 80.0,
                            "matched_position": "1st Prize Rotational Permutation",
                        }
                elif unique_digits == 2:
                    if num_str == p1:
                        # Double Direct: ₹3800
                        return {
                            "is_winner": True,
                            "prize_title": "BOX (DOUBLE DIRECT)",
                            "win_amount": count * 3800.0,
                            "matched_number": num_str,
                            "rate_multiplier": 380.0,
                            "matched_position": "1st Prize Double Direct",
                        }
                    else:
                        # Double Turn: ₹1600
                        return {
                            "is_winner": True,
                            "prize_title": "BOX (DOUBLE TURN)",
                            "win_amount": count * 1600.0,
                            "matched_number": num_str,
                            "rate_multiplier": 160.0,
                            "matched_position": "1st Prize Double Turn",
                        }
                else:
                    # 3 Identical (e.g. 777)
                    return {
                        "is_winner": True,
                        "prize_title": "BOX (STRAIGHT)",
                        "win_amount": count * 3000.0,
                        "matched_number": num_str,
                        "rate_multiplier": 300.0,
                        "matched_position": "1st Prize Triple Direct",
                    }
        return not_won

    # ----------------------------------------------------
    # 4. 3-DIGIT SUPER — BASED ON ALL 6 PRIZES
    # ----------------------------------------------------
    if itype in ("DIRECT", "SUPER", "3 DIGIT", "3-DIGIT"):
        if len(num_str) == 3:
            if num_str == p1:
                return {
                    "is_winner": True,
                    "prize_title": "1ST PRIZE",
                    "win_amount": count * 5000.0,
                    "matched_number": num_str,
                    "rate_multiplier": 500.0,
                    "matched_position": "1st Prize (Primary)",
                }
            if p2 and num_str == p2:
                return {
                    "is_winner": True,
                    "prize_title": "2ND PRIZE",
                    "win_amount": count * 500.0,
                    "matched_number": num_str,
                    "rate_multiplier": 50.0,
                    "matched_position": "2nd Prize",
                }
            if p3 and num_str == p3:
                return {
                    "is_winner": True,
                    "prize_title": "3RD PRIZE",
                    "win_amount": count * 250.0,
                    "matched_number": num_str,
                    "rate_multiplier": 25.0,
                    "matched_position": "3rd Prize",
                }
            if p4 and num_str == p4:
                return {
                    "is_winner": True,
                    "prize_title": "4TH PRIZE",
                    "win_amount": count * 100.0,
                    "matched_number": num_str,
                    "rate_multiplier": 10.0,
                    "matched_position": "4th Prize",
                }
            if p5 and num_str == p5:
                return {
                    "is_winner": True,
                    "prize_title": "5TH PRIZE",
                    "win_amount": count * 50.0,
                    "matched_number": num_str,
                    "rate_multiplier": 5.0,
                    "matched_position": "5th Prize",
                }
            if (p6 and num_str == p6) or (num_str in compliments):
                return {
                    "is_winner": True,
                    "prize_title": "6TH PRIZE / COMPLIMENT",
                    "win_amount": count * 20.0,
                    "matched_number": num_str,
                    "rate_multiplier": 2.0,
                    "matched_position": "6th Prize / Compliment",
                }

    return not_won

def evaluate_ticket_items(
    items: List[Any],
    p1: str,
    p2: str = "",
    p3: str = "",
    p4: str = "",
    p5: str = "",
    p6: str = "",
    compliments: List[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates a list of bet items against a game result.
    """
    total_win = 0.0
    winning_items = []

    for item in items:
        num = getattr(item, "number", "") if hasattr(item, "number") else item.get("number", "")
        itype = getattr(item, "type", "") if hasattr(item, "type") else item.get("type", "")
        cnt = float(getattr(item, "count", 1.0) if hasattr(item, "count") else item.get("count", 1.0))

        eval_res = evaluate_bet_item(
            number=num,
            item_type=itype,
            count=cnt,
            p1=p1,
            p2=p2,
            p3=p3,
            p4=p4,
            p5=p5,
            p6=p6,
            compliments=compliments,
        )

        if eval_res["is_winner"]:
            total_win += eval_res["win_amount"]
            winning_items.append({
                "item": item,
                "eval": eval_res,
            })

    return {
        "is_winner": total_win > 0,
        "total_win_amount": total_win,
        "winning_items": winning_items,
    }
