import type { BetSlipItem, PlacedTicket } from '../types';

export interface GameResultData {
  id?: string;
  date?: string;
  gameSlot: string;
  prize1: string;
  prize2?: string;
  prize3?: string;
  prize4?: string;
  prize5?: string;
  prize6?: string;
  compliments?: string[][] | string[];
}

export interface EvaluationResult {
  isWinner: boolean;
  prizeTitle: string;
  prizeCategory: '1ST' | '2ND' | '3RD' | '4TH' | '5TH' | '6TH' | 'BOX' | '2DIGIT' | '1DIGIT' | 'NONE';
  winAmount: number;
  matchedNumber: string;
  rateMultiplier: number;
  matchedPrizePosition?: string;
}

/**
 * Extracts a flat array of compliment 3-digit numbers from the GameResult.
 */
export function getFlatCompliments(compliments?: string[][] | string[]): string[] {
  if (!compliments) return [];
  if (Array.isArray(compliments) && compliments.length > 0 && Array.isArray(compliments[0])) {
    return (compliments as string[][]).flat().filter((n) => typeof n === 'string' && n.trim().length > 0);
  }
  return (compliments as string[]).filter((n) => typeof n === 'string' && n.trim().length > 0);
}

/**
 * Evaluates a single BetSlipItem against a published GameResult.
 *
 * Rules:
 * 1. Category A (1st Prize ONLY):
 *    - 1 Digit (A, B, C): matches position of 1st Prize. Rate ₹180 -> ₹500 (unitPrice ₹12, minimum 5 count).
 *    - 2 Digit (AB, BC, AC): matches pair of 1st Prize. Rate ₹10 -> ₹700 (70x multiplier).
 *    - Box: matches permutations of 1st Prize ONLY:
 *      * Straight (3 unique, exact match): ₹3,000 per ₹10 count (300x)
 *      * Ulta-Turn (3 unique, permutation match): ₹800 per ₹10 count (80x)
 *      * Double Direct (2 duplicate, exact match): ₹3,800 per ₹10 count (380x)
 *      * Double Turn (2 duplicate, permutation match): ₹1,600 per ₹10 count (160x)
 * 2. Category B (All 6 Prizes):
 *    - 3-Digit Super: matches 1st (₹5,000), 2nd (₹500), 3rd (₹250), 4th (₹100), 5th (₹50), 6th/Compliment (₹20) per ₹10 count.
 */
export function evaluateBetItem(item: BetSlipItem, result?: GameResultData | null): EvaluationResult {
  const notWon: EvaluationResult = {
    isWinner: false,
    prizeTitle: '',
    prizeCategory: 'NONE',
    winAmount: 0,
    matchedNumber: '',
    rateMultiplier: 0,
  };

  if (!result || !result.prize1 || result.prize1.trim().length < 3) {
    return notWon;
  }

  const p1 = result.prize1.trim();
  const p2 = result.prize2 ? result.prize2.trim() : '';
  const p3 = result.prize3 ? result.prize3.trim() : '';
  const p4 = result.prize4 ? result.prize4.trim() : '';
  const p5 = result.prize5 ? result.prize5.trim() : '';
  const p6 = result.prize6 ? result.prize6.trim() : '';
  const comps = getFlatCompliments(result.compliments);

  const numStr = (item.number || '').trim();
  const count = item.count || 1;
  const itemType = (item.type || '').toUpperCase();

  // ----------------------------------------------------
  // 1. 1-DIGIT (A, B, C) — BASED ONLY ON 1ST PRIZE
  // ----------------------------------------------------
  // Item format: 'A:7', 'B:4', 'C:2' (or number='7', type='A')
  if (numStr.startsWith('A:') || numStr.startsWith('B:') || numStr.startsWith('C:') || ['A', 'B', 'C'].includes(itemType)) {
    let pos = 'A';
    let val = numStr;
    if (numStr.includes(':')) {
      const parts = numStr.split(':');
      pos = parts[0].trim().toUpperCase();
      val = parts[1] ? parts[1].trim() : '';
    } else if (['A', 'B', 'C'].includes(itemType)) {
      pos = itemType;
    }

    const p1A = p1[0];
    const p1B = p1[1];
    const p1C = p1[2];

    let match = false;
    if (pos === 'A' && val === p1A) match = true;
    if (pos === 'B' && val === p1B) match = true;
    if (pos === 'C' && val === p1C) match = true;

    if (match) {
      // 1 Digit Rate Table: 5 count (₹60) -> ₹500 (₹100 per count)
      const winAmt = count * 100;
      return {
        isWinner: true,
        prizeTitle: `1 DIGIT (${pos})`,
        prizeCategory: '1DIGIT',
        winAmount: winAmt,
        matchedNumber: numStr,
        rateMultiplier: 100 / 12,
        matchedPrizePosition: `1st Prize Position ${pos}`,
      };
    }
    return notWon;
  }

  // ----------------------------------------------------
  // 2. 2-DIGIT (AB, BC, AC) — BASED ONLY ON 1ST PRIZE
  // ----------------------------------------------------
  // Item format: 'AB:74', 'BC:42', 'AC:72' (or number='74', type='AB')
  if (numStr.startsWith('AB:') || numStr.startsWith('BC:') || numStr.startsWith('AC:') || ['AB', 'BC', 'AC'].includes(itemType)) {
    let pos = 'AB';
    let val = numStr;
    if (numStr.includes(':')) {
      const parts = numStr.split(':');
      pos = parts[0].trim().toUpperCase();
      val = parts[1] ? parts[1].trim() : '';
    } else if (['AB', 'BC', 'AC'].includes(itemType)) {
      pos = itemType;
    }

    const p1AB = p1.slice(0, 2);
    const p1BC = p1.slice(1, 3);
    const p1AC = p1[0] + p1[2];

    let match = false;
    if (pos === 'AB' && val === p1AB) match = true;
    if (pos === 'BC' && val === p1BC) match = true;
    if (pos === 'AC' && val === p1AC) match = true;

    if (match) {
      // 2 Digit Rate Table: ₹10 -> ₹700 (70x multiplier)
      const winAmt = count * 700;
      return {
        isWinner: true,
        prizeTitle: `2 DIGIT (${pos})`,
        prizeCategory: '2DIGIT',
        winAmount: winAmt,
        matchedNumber: numStr,
        rateMultiplier: 70,
        matchedPrizePosition: `1st Prize Pair ${pos}`,
      };
    }
    return notWon;
  }

  // ----------------------------------------------------
  // 3. BOX / SHUFFLE — BASED ONLY ON 1ST PRIZE
  // ----------------------------------------------------
  if (itemType === 'SHUFFLE' || itemType === 'BOX') {
    if (numStr.length === 3 && p1.length === 3) {
      const sortedBet = numStr.split('').sort().join('');
      const sortedP1 = p1.split('').sort().join('');

      if (sortedBet === sortedP1) {
        // Count unique characters in 1st Prize
        const uniqueDigits = new Set(p1.split('')).size;

        if (uniqueDigits === 3) {
          // 3 Distinct Digits: Straight vs Ulta-Turn
          if (numStr === p1) {
            // Straight: ₹3,000 per ₹10 count (300x)
            return {
              isWinner: true,
              prizeTitle: 'BOX (STRAIGHT)',
              prizeCategory: 'BOX',
              winAmount: count * 3000,
              matchedNumber: numStr,
              rateMultiplier: 300,
              matchedPrizePosition: '1st Prize Exact Permutation',
            };
          } else {
            // Ulta-Turn: ₹800 per ₹10 count (80x)
            return {
              isWinner: true,
              prizeTitle: 'BOX (ULTA-TURN)',
              prizeCategory: 'BOX',
              winAmount: count * 800,
              matchedNumber: numStr,
              rateMultiplier: 80,
              matchedPrizePosition: '1st Prize Rotational Permutation',
            };
          }
        } else if (uniqueDigits === 2) {
          // 2 Duplicate Digits: Double Direct vs Double Turn
          if (numStr === p1) {
            // Double Direct: ₹3,800 per ₹10 count (380x)
            return {
              isWinner: true,
              prizeTitle: 'BOX (DOUBLE DIRECT)',
              prizeCategory: 'BOX',
              winAmount: count * 3800,
              matchedNumber: numStr,
              rateMultiplier: 380,
              matchedPrizePosition: '1st Prize Double Direct',
            };
          } else {
            // Double Turn: ₹1,600 per ₹10 count (160x)
            return {
              isWinner: true,
              prizeTitle: 'BOX (DOUBLE TURN)',
              prizeCategory: 'BOX',
              winAmount: count * 1600,
              matchedNumber: numStr,
              rateMultiplier: 160,
              matchedPrizePosition: '1st Prize Double Turn',
            };
          }
        } else {
          // 3 Identical Digits (e.g. 777)
          return {
            isWinner: true,
            prizeTitle: 'BOX (STRAIGHT)',
            prizeCategory: 'BOX',
            winAmount: count * 3000,
            matchedNumber: numStr,
            rateMultiplier: 300,
            matchedPrizePosition: '1st Prize Triple Direct',
          };
        }
      }
    }
    return notWon;
  }

  // ----------------------------------------------------
  // 4. 3-DIGIT SUPER — BASED ON ALL 6 PRIZES
  // ----------------------------------------------------
  if (itemType === 'DIRECT' || itemType === 'SUPER' || itemType === '3 DIGIT' || itemType === '3-DIGIT') {
    if (numStr.length === 3) {
      // 1st Prize: ₹5,000 per ₹10 count (500x)
      if (numStr === p1) {
        return {
          isWinner: true,
          prizeTitle: '1ST PRIZE',
          prizeCategory: '1ST',
          winAmount: count * 5000,
          matchedNumber: numStr,
          rateMultiplier: 500,
          matchedPrizePosition: '1st Prize (Primary)',
        };
      }
      // 2nd Prize: ₹500 per ₹10 count (50x)
      if (p2 && numStr === p2) {
        return {
          isWinner: true,
          prizeTitle: '2ND PRIZE',
          prizeCategory: '2ND',
          winAmount: count * 500,
          matchedNumber: numStr,
          rateMultiplier: 50,
          matchedPrizePosition: '2nd Prize',
        };
      }
      // 3rd Prize: ₹250 per ₹10 count (25x)
      if (p3 && numStr === p3) {
        return {
          isWinner: true,
          prizeTitle: '3RD PRIZE',
          prizeCategory: '3RD',
          winAmount: count * 250,
          matchedNumber: numStr,
          rateMultiplier: 25,
          matchedPrizePosition: '3rd Prize',
        };
      }
      // 4th Prize: ₹100 per ₹10 count (10x)
      if (p4 && numStr === p4) {
        return {
          isWinner: true,
          prizeTitle: '4TH PRIZE',
          prizeCategory: '4TH',
          winAmount: count * 100,
          matchedNumber: numStr,
          rateMultiplier: 10,
          matchedPrizePosition: '4th Prize',
        };
      }
      // 5th Prize: ₹50 per ₹10 count (5x)
      if (p5 && numStr === p5) {
        return {
          isWinner: true,
          prizeTitle: '5TH PRIZE',
          prizeCategory: '5TH',
          winAmount: count * 50,
          matchedNumber: numStr,
          rateMultiplier: 5,
          matchedPrizePosition: '5th Prize',
        };
      }
      // 6th Prize / Compliment: ₹20 per ₹10 count (2x)
      if ((p6 && numStr === p6) || comps.includes(numStr)) {
        return {
          isWinner: true,
          prizeTitle: '6TH PRIZE / COMPLIMENT',
          prizeCategory: '6TH',
          winAmount: count * 20,
          matchedNumber: numStr,
          rateMultiplier: 2,
          matchedPrizePosition: '6th Prize / Compliment',
        };
      }
    }
  }

  return notWon;
}

export interface TicketEvaluation {
  isWinner: boolean;
  totalWinAmount: number;
  winningItems: Array<{
    item: BetSlipItem;
    eval: EvaluationResult;
  }>;
}

/**
 * Evaluates an entire PlacedTicket against a GameResult.
 */
export function evaluateTicket(ticket: PlacedTicket, result?: GameResultData | null): TicketEvaluation {
  let totalWinAmount = 0;
  const winningItems: Array<{ item: BetSlipItem; eval: EvaluationResult }> = [];

  if (!ticket.items || !Array.isArray(ticket.items)) {
    return { isWinner: false, totalWinAmount: 0, winningItems: [] };
  }

  for (const item of ticket.items) {
    const res = evaluateBetItem(item, result);
    if (res.isWinner) {
      totalWinAmount += res.winAmount;
      winningItems.push({ item, eval: res });
    }
  }

  return {
    isWinner: totalWinAmount > 0,
    totalWinAmount,
    winningItems,
  };
}
