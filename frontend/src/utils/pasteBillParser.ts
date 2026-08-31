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
 * 1. Format 1 (Number = Super Count = Box Count):
 *    928=1=1 or 928=2
 *
 * 2. Format 2 (Number * Super Count + Box Count):
 *    638*3+2 or 638*3
 *
 * 3. Format 3 (Position * Number * Count):
 *    A*6*50, B*3*30, C*7*30
 *
 * 4. Format 4 (All Positions * Number * Count):
 *    ABC*8*15 or ALL*8*15
 *
 * 5. 2-Digit Pairs:
 *    AB*45*10, BC*23*10, AC*89*10
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

    // 1. Format 1: 928=1=1 or 928=2 (Number = Super Count [= Box Count])
    const eqMatch = trimmed.match(/^(\d{3})\s*=\s*(\d+)(?:\s*[=+]\s*(\d+))?$/);
    if (eqMatch) {
      const num = eqMatch[1];
      const count1 = parseInt(eqMatch[2], 10);
      const count2 = eqMatch[3] !== undefined ? parseInt(eqMatch[3], 10) : undefined;

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

    // 2. Format 2: 638*3+2 or 638*3 (Number * Super Count [+ Box Count])
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

    // 3. Format 4: ABC*8*15 or ALL*8*15 (All 1-Digit Positions)
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

    // 4. Format 3: A*6*50, B*3*30, C*7*30 (Single 1-Digit Position)
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

    // 5. Format 5: 2-Digit Pairs (AB*45*10, BC*23*10, AC*89*10)
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

    // If line didn't match any supported pattern, fail validation atomically
    return {
      success: false,
      items: [],
      totalCount: 0,
      totalAmount: 0,
      errorLine: trimmed,
      lineNumber: lineNum,
      errorMessage: `Line ${lineNum}: "${trimmed}" is invalid.\n\nSupported Formats:\n• 928=1=1  (3-Digit Number = Super = Box)\n• 638*3+2  (3-Digit Number * Super + Box)\n• A*6*50   (1-Digit Position * Digit * Count)\n• ABC*8*15 (All Positions * Digit * Count)\n• AB*45*10 (2-Digit Pair * Digits * Count)`,
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
