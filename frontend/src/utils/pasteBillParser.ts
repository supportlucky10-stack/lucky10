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
 *    - All 1-Digit Positions: ABC*8*15 or ALL*8*15
 *    - Single 1-Digit Position: A*6*50, B*3*30, C*7*30
 *    - 2-Digit Pairs: AB*45*10, BC*23*10, AC*89*10
 *    - 3-Digit Single Super (equals): 928=2
 *
 * 2. Generic Symbol Separator Format (3 numeric groups):
 *    - NUMBER [ANY NON-ALPHANUMERIC SYMBOLS] SUPER_COUNT [ANY NON-ALPHANUMERIC SYMBOLS] BOX_COUNT
 *    - Examples: 638=1=1, 638-1-1, 638/1/1, 638:1:1, 638_1_1, 638@1@1, 638#1#1, 638$1$1,
 *                638%1%1, 638&1&1, 638|1|1, 638~1~1, 638.1.1, 638...1...1, 638 @@@ 1 ### 1, 638---1+++1
 *    - Letters are NEVER treated as separators (rejects 638ABC1ABC1, 638A1A1, 638X1X1).
 *
 * Atomic validation: If any non-empty line fails validation, returns success: false
 * with the exact line number and error description without modifying any state.
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

  let nonEmptyLineCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue;
    }

    nonEmptyLineCount++;
    const lineNum = i + 1;

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
        if (count1 < 0 || count2 < 0 || (count1 === 0 && count2 === 0)) {
          return {
            success: false,
            items: [],
            totalCount: 0,
            totalAmount: 0,
            errorLine: trimmed,
            lineNumber: lineNum,
            errorMessage: `Line ${lineNum}: "${trimmed}" has invalid count. Count must be at least 1.`,
          };
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
        if (count1 <= 0) {
          return {
            success: false,
            items: [],
            totalCount: 0,
            totalAmount: 0,
            errorLine: trimmed,
            lineNumber: lineNum,
            errorMessage: `Line ${lineNum}: "${trimmed}" has invalid count. Count must be at least 1.`,
          };
        }
        items.push({
          number: num,
          count: count1,
          type: 'Direct',
          playMode: 'DIRECT',
          unitPrice: 10,
          totalAmount: count1 * 10,
        });
      }
      continue;
    }

    // Format B: ABC / ALL 1-Digit Positions: ABC*8*15 or ALL*8*15
    const abcMatch = trimmed.match(/^(ABC|abc|ALL|all)\s*[\*:=]\s*(\d{1})\s*[\*:=]\s*(\d+)$/);
    if (abcMatch) {
      const digit = abcMatch[2];
      const count = parseInt(abcMatch[3], 10);
      if (count <= 0) {
        return {
          success: false,
          items: [],
          totalCount: 0,
          totalAmount: 0,
          errorLine: trimmed,
          lineNumber: lineNum,
          errorMessage: `Line ${lineNum}: "${trimmed}" has invalid count. Count must be at least 1.`,
        };
      }
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

    // Format C: Single 1-Digit Position: A*6*50, B*3*30, C*7*30
    const singlePosMatch = trimmed.match(/^([A-Ca-c])\s*[\*:=]\s*(\d{1})\s*[\*:=]\s*(\d+)$/);
    if (singlePosMatch) {
      const pos = singlePosMatch[1].toUpperCase();
      const digit = singlePosMatch[2];
      const count = parseInt(singlePosMatch[3], 10);
      if (count <= 0) {
        return {
          success: false,
          items: [],
          totalCount: 0,
          totalAmount: 0,
          errorLine: trimmed,
          lineNumber: lineNum,
          errorMessage: `Line ${lineNum}: "${trimmed}" has invalid count. Count must be at least 1.`,
        };
      }
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

    // Format D: 2-Digit Pairs: AB*45*10, BC*23*10, AC*89*10
    const pairMatch = trimmed.match(/^([Aa][Bb]|[Bb][Cc]|[Aa][Cc])\s*[\*:=]\s*(\d{2})\s*[\*:=]\s*(\d+)$/);
    if (pairMatch) {
      const pair = pairMatch[1].toUpperCase();
      const digits = pairMatch[2];
      const count = parseInt(pairMatch[3], 10);
      if (count <= 0) {
        return {
          success: false,
          items: [],
          totalCount: 0,
          totalAmount: 0,
          errorLine: trimmed,
          lineNumber: lineNum,
          errorMessage: `Line ${lineNum}: "${trimmed}" has invalid count. Count must be at least 1.`,
        };
      }
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

    // Format E: Specific 3-Digit Single Super (e.g. 928=2)
    const singleSuperEqMatch = trimmed.match(/^(\d{3})\s*=\s*(\d+)$/);
    if (singleSuperEqMatch) {
      const num = singleSuperEqMatch[1];
      const count = parseInt(singleSuperEqMatch[2], 10);
      if (count <= 0) {
        return {
          success: false,
          items: [],
          totalCount: 0,
          totalAmount: 0,
          errorLine: trimmed,
          lineNumber: lineNum,
          errorMessage: `Line ${lineNum}: "${trimmed}" has invalid count. Count must be at least 1.`,
        };
      }
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

    // =========================================================================
    // 2. Generic 3-Group Symbol Separator Format:
    //    NUMBER [ANY SYMBOLS] NUMBER [ANY SYMBOLS] NUMBER
    //    - Separator is ANY non-alphabetic, non-numeric character ([^0-9a-zA-Z]+)
    //    - Exactly THREE numeric groups (3-digit number, Super count, Box count)
    //    - Rejects any alphabetic characters in separators (e.g. 638ABC1ABC1)
    // =========================================================================
    const generic3GroupMatch = trimmed.match(/^(\d{3})([^0-9a-zA-Z]+)(\d+)([^0-9a-zA-Z]+)(\d+)$/);
    if (generic3GroupMatch) {
      const num = generic3GroupMatch[1];
      const count1 = parseInt(generic3GroupMatch[3], 10);
      const count2 = parseInt(generic3GroupMatch[5], 10);

      if (count1 < 0 || count2 < 0 || (count1 === 0 && count2 === 0)) {
        return {
          success: false,
          items: [],
          totalCount: 0,
          totalAmount: 0,
          errorLine: trimmed,
          lineNumber: lineNum,
          errorMessage: `Line ${lineNum}: "${trimmed}" has invalid count. Count must be at least 1.`,
        };
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
      continue;
    }

    // If line didn't match any supported pattern, fail validation atomically
    return {
      success: false,
      items: [],
      totalCount: 0,
      totalAmount: 0,
      errorLine: trimmed,
      lineNumber: lineNum,
      errorMessage: `Line ${lineNum}: "${trimmed}" is invalid.\n\nSupported Formats:\n• 638-1-1   (Number - Super - Box: supports any symbols as separators)\n• 638*3+2   (3-Digit Number * Super + Box)\n• A*6*50    (1-Digit Position * Digit * Count)\n• ABC*8*15  (All Positions * Digit * Count)\n• AB*45*10  (2-Digit Pair * Digits * Count)`,
    };
  }

  if (nonEmptyLineCount === 0 || items.length === 0) {
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
