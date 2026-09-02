import type { BetSlipItem } from '../types';

export type BetSlipItemDraft = Omit<BetSlipItem, 'id'>;

export interface ParseResult {
  success: boolean;
  items: BetSlipItemDraft[];
  totalCount: number;
  totalAmount: number;
  errorLine?: string;
  lineNumber?: number;
  errorMessage?: string;
}

/**
 * Parses and validates multiline pasted bill text according to the standard formats:
 *
 * 1. Special Existing Formats (checked first):
 *    - 3-Digit Super + Box: 638*3+2 or 638*3
 *    - All 1-Digit Positions: ABC*8*15 or ALL*8*15 (or with flexible separators: ABC-8-15, ABC 8 15)
 *    - Single 1-Digit Position: A*6*50, B*3*30, C*7*30 (or with flexible separators: A-6-50, B 3 30)
 *    - 2-Digit Pairs: AB*45*10, BC*23*10, AC*89*10 (or with flexible separators: AB 45 10)
 *    - 3-Digit Single Super: 928=2 or 638*3
 *
 * 2. Generic Symbol Separator Format (3 numeric groups: Number + Super + Box):
 *    - NUMBER [ANY NON-ALPHANUMERIC SYMBOLS / SPACES] SUPER_COUNT [ANY NON-ALPHANUMERIC SYMBOLS / SPACES] BOX_COUNT
 *    - Examples: 638=1=1, 638-1-1, 638/1/1, 638:1:1, 638_1_1, 638@1@1, 638#1#1, 638$1$1,
 *                638%1%1, 638&1&1, 638|1|1, 638~1~1, 638 1 1, 638-3+2, 638+3=2, 638/3-2, 147+3+2
 *
 * 3. Box Shorthand Format using B/b (case-insensitive):
 *    - NUMBER [ANY NON-ALPHANUMERIC SEPARATOR / SPACE] COUNT [optional separator/space] B/b
 *      or NUMBER [ANY NON-ALPHANUMERIC SEPARATOR / SPACE] B/b [ANY NON-ALPHANUMERIC SEPARATOR / SPACE] COUNT
 *    - Examples: 546+15b, 546+15B, 546 10 B, 546 10 b, 546-15-b, 546=15B, 546*15b, 546 15B, 546 B 10
 *    - Meaning: 3-digit number with Box count (Shuffle), no Super unless specified.
 *
 * 4. Generic 2-Group Symbol Separator Format (3-Digit Number + Super):
 *    - NUMBER [ANY NON-ALPHANUMERIC SEPARATOR / SPACE] SUPER_COUNT
 *    - Examples: 455-10, 455=10, 455/10, 455 10, 455:10, 455_10, 455@10, 455#10, 455$10
 *    - Meaning: 3-digit number with Super count (Direct), no Box.
 *
 * Unrelated Text Tolerance:
 * - Any text line that does NOT match a valid bill pattern (e.g. headers, notes, "KL", "Hello", "Dear",
 *   "Random Text", "Hello B") is completely ignored.
 * - If at least one valid bill is present, all valid bills are imported and unrelated text is skipped.
 * - If no valid bills are found in the entire input, returns success: false with an informative message.
 */
export function parsePastedBillText(text: string): ParseResult {
  if (!text || !text.trim()) {
    return {
      success: false,
      items: [],
      totalCount: 0,
      totalAmount: 0,
      errorMessage: 'Please enter or paste at least one bill line.',
    };
  }

  const rawLines = text.split(/\r?\n/);
  const items: BetSlipItemDraft[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue;
    }

    // ==========================================
    // 1. Check existing specific/special formats
    // ==========================================

    // Format A: Star / Plus format: 638*3+2 or 638*3
    const starPlusMatch = trimmed.match(/^(\d{3})\s*\*\s*(\d+)(?:\s*[\*+]\s*(\d+))?$/);
    if (starPlusMatch) {
      const num = starPlusMatch[1];
      const count1 = parseInt(starPlusMatch[2], 10);
      const count2 = starPlusMatch[3] !== undefined ? parseInt(starPlusMatch[3], 10) : undefined;

      if (count2 !== undefined) {
        if (count1 <= 0 && count2 <= 0) {
          continue;
        }
        if (count1 > 0) {
          items.push({
            number: num,
            count: count1,
            type: 'Direct',
            playMode: 'DIRECT',
            unitPrice: 10,
            totalAmount: count1 * 10,
          });
        }
        if (count2 > 0) {
          items.push({
            number: num,
            count: count2,
            type: 'Shuffle',
            playMode: 'DIRECT',
            unitPrice: 10,
            totalAmount: count2 * 10,
          });
        }
      } else {
        if (count1 > 0) {
          items.push({
            number: num,
            count: count1,
            type: 'Direct',
            playMode: 'DIRECT',
            unitPrice: 10,
            totalAmount: count1 * 10,
          });
        }
      }
      continue;
    }

    // Format B: ABC / ALL 1-Digit Positions: ABC*8*15, ABC-8-15, ABC+8-15, ABC=8=15, ABC/8:15, ABC 8 15, ABC+9-15, ABC @ 8 # 15
    const abcMatch = trimmed.match(/^(ABC|abc|ALL|all)([^0-9a-zA-Z]+)(\d{1})([^0-9a-zA-Z]+)(\d+)$/);
    if (abcMatch) {
      const digit = abcMatch[3];
      const count = parseInt(abcMatch[5], 10);
      if (count > 0) {
        const unitPrice1Digit = 12;
        ['A', 'B', 'C'].forEach((pos) => {
          items.push({
            number: `${pos}:${digit}`,
            count,
            type: 'Position',
            playMode: 'DIRECT',
            unitPrice: unitPrice1Digit,
            totalAmount: count * unitPrice1Digit,
          });
        });
        continue;
      }
    }

    // Format C: Single 1-Digit Position: A*6*50, A-6-50, A=6=50, A/6/50, A 6 50, A @ 6 # 50, A+6-50, B*3*30, B-3-30, B 3 30, C*7*30, C-7-30, C 7 30
    const singlePosMatch = trimmed.match(/^([A-Ca-c])([^0-9a-zA-Z]+)(\d{1})([^0-9a-zA-Z]+)(\d+)$/);
    if (singlePosMatch) {
      const pos = singlePosMatch[1].toUpperCase();
      const digit = singlePosMatch[3];
      const count = parseInt(singlePosMatch[5], 10);
      if (count > 0) {
        const unitPrice1Digit = 12;
        items.push({
          number: `${pos}:${digit}`,
          count,
          type: 'Position',
          playMode: 'DIRECT',
          unitPrice: unitPrice1Digit,
          totalAmount: count * unitPrice1Digit,
        });
        continue;
      }
    }

    // Format D: 2-Digit Pairs: AB*45*10, AB-45-10, AB=45=10, AB 45 10, BC*23*10, BC-23-10, BC 23 10, AC*89*10, AC-89-10, AC 89 10, BC+23-10, AB/45:10
    const pairMatch = trimmed.match(/^([Aa][Bb]|[Bb][Cc]|[Aa][Cc])([^0-9a-zA-Z]+)(\d{2})([^0-9a-zA-Z]+)(\d+)$/);
    if (pairMatch) {
      const pair = pairMatch[1].toUpperCase();
      const digits = pairMatch[3];
      const count = parseInt(pairMatch[5], 10);
      if (count > 0) {
        const unitPrice2Digit = 10;
        items.push({
          number: `${pair}:${digits}`,
          count,
          type: 'Pair',
          playMode: 'DIRECT',
          unitPrice: unitPrice2Digit,
          totalAmount: count * unitPrice2Digit,
        });
        continue;
      }
    }

    // Format E: Specific 3-Digit Single Super (e.g. 928=2 or 638*3)
    const singleSuperMatch = trimmed.match(/^(\d{3})\s*[\*:=]\s*(\d+)$/);
    if (singleSuperMatch) {
      const num = singleSuperMatch[1];
      const count = parseInt(singleSuperMatch[2], 10);
      if (count > 0) {
        items.push({
          number: num,
          count,
          type: 'Direct',
          playMode: 'DIRECT',
          unitPrice: 10,
          totalAmount: count * 10,
        });
        continue;
      }
    }

    // =========================================================================
    // 2. Generic 3-Group Symbol Separator Format (3-Digit Number + Super + Box):
    //    NUMBER [ANY NON-ALPHANUMERIC SEPARATORS / SPACES] SUPER [ANY NON-ALPHANUMERIC SEPARATORS / SPACES] BOX
    //    Examples: 638=1=1, 638-1-1, 638/1/1, 638:1:1, 638_1_1, 638@1@1, 638#1#1, 638 1 1, 147+3+2
    // =========================================================================
    const generic3GroupMatch = trimmed.match(/^(\d{3})([^0-9a-zA-Z]+)(\d+)([^0-9a-zA-Z]+)(\d+)$/);
    if (generic3GroupMatch) {
      const num = generic3GroupMatch[1];
      const count1 = parseInt(generic3GroupMatch[3], 10);
      const count2 = parseInt(generic3GroupMatch[5], 10);

      if (count1 > 0 || count2 > 0) {
        if (count1 > 0) {
          items.push({
            number: num,
            count: count1,
            type: 'Direct',
            playMode: 'DIRECT',
            unitPrice: 10,
            totalAmount: count1 * 10,
          });
        }
        if (count2 > 0) {
          items.push({
            number: num,
            count: count2,
            type: 'Shuffle',
            playMode: 'DIRECT',
            unitPrice: 10,
            totalAmount: count2 * 10,
          });
        }
        continue;
      }
    }

    // =========================================================================
    // 3. Box Shorthand Format using B/b (case-insensitive):
    //    NUMBER [SEPARATORS / SPACES] COUNT [optional separator/space] B/b
    //    or NUMBER [SEPARATORS / SPACES] B/b [SEPARATORS / SPACES] COUNT
    //    Examples: 546+15b, 546+15B, 546 10 B, 546 10 b, 546-15-b, 546=15B,
    //              546*15b, 546:15b, 546_15b, 546 15B, 546 B 10, 546+B+10
    //    Meaning: Number: 546, Box (Shuffle): 15 / 10
    // =========================================================================
    const boxSuffixMatch = trimmed.match(/^(\d{3})([^0-9a-zA-Z]+)(\d+)(?:[^0-9a-zA-Z]+|\s*)([Bb])$/);
    const boxPrefixMatch = !boxSuffixMatch
      ? trimmed.match(/^(\d{3})(?:[^0-9a-zA-Z]+|\s+)([Bb])(?:[^0-9a-zA-Z]+|\s+)(\d+)$/)
      : null;
    const boxMatch = boxSuffixMatch || boxPrefixMatch;
    if (boxMatch) {
      const num = boxMatch[1];
      const count = parseInt(boxMatch[3], 10);
      if (count > 0) {
        items.push({
          number: num,
          count,
          type: 'Shuffle',
          playMode: 'DIRECT',
          unitPrice: 10,
          totalAmount: count * 10,
        });
        continue;
      }
    }

    // =========================================================================
    // 4. Generic 2-Group Symbol Separator Format (3-Digit Number + Super):
    //    NUMBER [ANY NON-ALPHANUMERIC SEPARATOR / SPACE] SUPER_COUNT
    //    Examples: 455-10, 455=10, 455/10, 455:10, 455_10, 455@10, 455#10,
    //              455$10, 455%10, 455&10, 455|10, 455~10, 455 10, 455 - 10,
    //              455 @@@ 10, 455-=10, 455/@10, 455# 10, 455 @ 10, 928=2, 638*3
    //    Meaning: Number: 455, Super (Direct): 10
    // =========================================================================
    const generic2GroupMatch = trimmed.match(/^(\d{3})([^0-9a-zA-Z]+)(\d+)$/);
    if (generic2GroupMatch) {
      const num = generic2GroupMatch[1];
      const count = parseInt(generic2GroupMatch[3], 10);
      if (count > 0) {
        items.push({
          number: num,
          count,
          type: 'Direct',
          playMode: 'DIRECT',
          unitPrice: 10,
          totalAmount: count * 10,
        });
        continue;
      }
    }

    // =========================================================================
    // 5. Unrelated Text:
    //    Any line that does not match a valid bill pattern is safely ignored.
    //    (e.g., "KL", "Hello", "Dear", "Hello B", "Random Text", headers, etc.)
    // =========================================================================
    continue;
  }

  if (items.length === 0) {
    return {
      success: false,
      items: [],
      totalCount: 0,
      totalAmount: 0,
      errorMessage: 'No valid bill lines found.',
    };
  }

  const totalCount = items.reduce((sum, it) => sum + it.count, 0);
  const totalAmount = items.reduce((sum, it) => sum + it.totalAmount, 0);

  return {
    success: true,
    items,
    totalCount,
    totalAmount,
  };
}
