import { createWorker } from 'tesseract.js';

export interface TokenExtractionResult {
  numbers: string[];
  uncertainTokens: string[];
}

export interface ParsedLotteryResult {
  prize1: string;
  prize2: string;
  prize3: string;
  prize4: string;
  prize5: string;
  prize6?: string;
  complimentBoxes: string[]; // 30 items
  uncertainTokens: string[]; // non-number or unrecognized tokens, e.g. ['1*1']
  extractedCount: number;
}

/**
 * Preprocesses an image file on an HTML5 canvas:
 * 1. Upscales up to 2x for sharp digit recognition (capping max width at 1800px).
 * 2. Computes per-pixel grayscale luminance (ITU-R BT.601).
 * 3. Applies row-adaptive luminance binarization:
 *    - For rows with dark/colored backgrounds (median < 150, like solid colored prize rows),
 *      bright text (lum > 170) is converted to black (0) and background to white (255).
 *    - For standard light rows (median >= 150),
 *      dark text (lum < 145) is converted to black (0) and background to white (255).
 * This universally handles all formats, mobile screenshots, and dark or light prize bars.
 */
export async function preprocessImageFile(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        let scale = 2.0;
        if (origWidth * scale > 1800) {
          scale = 1800 / origWidth;
        }
        if (scale < 1.0) scale = 1.0;

        const targetWidth = Math.round(origWidth * scale);
        const targetHeight = Math.round(origHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to create canvas 2D context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(objectUrl);

        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;

        // Step 1: Precalculate grayscale luminance
        const gray = new Uint8Array(targetWidth * targetHeight);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          gray[p] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }

        // Step 2: Row-adaptive binarization
        const hist = new Int32Array(256);
        const halfWidth = targetWidth / 2;

        for (let y = 0; y < targetHeight; y++) {
          hist.fill(0);
          const rowStart = y * targetWidth;

          for (let x = 0; x < targetWidth; x++) {
            hist[gray[rowStart + x]]++;
          }

          let count = 0;
          let rowMedian = 128;
          for (let t = 0; t < 256; t++) {
            count += hist[t];
            if (count >= halfWidth) {
              rowMedian = t;
              break;
            }
          }

          const isDarkRow = rowMedian < 150;

          for (let x = 0; x < targetWidth; x++) {
            const lum = gray[rowStart + x];
            const isText = isDarkRow ? lum > 160 : lum < 140;
            const val = isText ? 0 : 255;
            const idx = (rowStart + x) * 4;
            data[idx] = val;
            data[idx + 1] = val;
            data[idx + 2] = val;
            data[idx + 3] = 255;
          }
        }

        // Step 3: Clear outer 8px border to prevent phone screenshot scrollbars and edge lines from distorting OCR
        const border = 8;
        for (let y = 0; y < targetHeight; y++) {
          if (y < border || y >= targetHeight - border) {
            for (let x = 0; x < targetWidth; x++) {
              const idx = (y * targetWidth + x) * 4;
              data[idx] = 255;
              data[idx + 1] = 255;
              data[idx + 2] = 255;
              data[idx + 3] = 255;
            }
          } else {
            for (let x = 0; x < border; x++) {
              const idx = (y * targetWidth + x) * 4;
              data[idx] = 255;
              data[idx + 1] = 255;
              data[idx + 2] = 255;
              data[idx + 3] = 255;
            }
            for (let x = targetWidth - border; x < targetWidth; x++) {
              const idx = (y * targetWidth + x) * 4;
              data[idx] = 255;
              data[idx + 1] = 255;
              data[idx + 2] = 255;
              data[idx + 3] = 255;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for scanning'));
    };

    img.src = objectUrl;
  });
}

/**
 * Normalizes common OCR artifacts in lottery text (e.g. spaced digits, 'O' instead of '0').
 */
export function cleanLotteryText(text: string): string {
  let cleaned = text.replace(/(\b\d)\s+(\d)\s+(\d\b)/g, '$1$2$3');
  cleaned = cleaned.replace(/(\b\d{2})\s+(\d\b)/g, '$1$2');
  cleaned = cleaned.replace(/(\b\d)\s+(\d{2}\b)/g, '$1$2');
  cleaned = cleaned.replace(/\|\s*(\d{3})/g, ' $1');
  cleaned = cleaned.replace(/\|\s*o(\d{2})/gi, ' 0$1');
  // Normalize OCR 'o'/'O' within digit contexts across any boundaries (dots, hyphens, colons, underscores)
  cleaned = cleaned.replace(/(?<![a-zA-Z0-9])[oO](\d{2})(?![a-zA-Z0-9])/g, '0$1');
  cleaned = cleaned.replace(/(?<![a-zA-Z0-9])(\d)[oO](\d)(?![a-zA-Z0-9])/g, '$10$2');
  cleaned = cleaned.replace(/(?<![a-zA-Z0-9])(\d{2})[oO](?![a-zA-Z0-9])/g, '$10');
  cleaned = cleaned.replace(/(?<![a-zA-Z0-9])[oO]{3}(?![a-zA-Z0-9])/g, '000');
  return cleaned;
}

/**
 * Token-based extraction with positional information:
 * Identifies valid 3-digit number tokens independently of any separators
 * (spaces, dots, commas, hyphens, slashes, pipes, asterisks, colons, semicolons, underscores, parentheses, decorative symbols).
 * Preserves exact original order, leading zeros, and legitimate duplicates.
 * Prevents adjacent number merging and number truncation.
 * Separately captures non-number/unrecognized tokens (e.g. '1*1') for administrator verification.
 */
export function extractLineTokens(line: string): TokenExtractionResult {
  const clean = line.trim();
  if (!clean) return { numbers: [], uncertainTokens: [] };

  // Strict 3-digit matcher with negative lookbehind and lookahead to prevent:
  // 1. Merging adjacent numbers
  // 2. Truncating numbers (e.g. 1234 or 5000 are not truncated into 123 or 500)
  const numberRegex = /(?<!\d)(\d{3})(?!\d)/g;
  const numbers: string[] = [];
  const uncertainTokens: string[] = [];

  let match: RegExpExecArray | null;
  let lastIndex = 0;

  const addUncertainSegment = (segment: string) => {
    // Split by major structural separators (whitespace, double-dots, commas, pipes, semicolons)
    // while keeping compound tokens like '1*1' or 'AB-12' intact
    const parts = segment.split(/[\s,;|]+|\.{2,}/).map((p) =>
      p.replace(/^[\s.,\-_/\\|*:;()[\]{}~•★◆!@#$%^&+=<>"'`]+|[\s.,\-_/\\|*:;()[\]{}~•★◆!@#$%^&+=<>"'`]+$/g, '').trim()
    );
    for (const part of parts) {
      if (part && !isRecognizedLabelOrMeta(part) && !uncertainTokens.includes(part)) {
        uncertainTokens.push(part);
      }
    }
  };

  while ((match = numberRegex.exec(clean)) !== null) {
    const num = match[1];
    const startIndex = match.index;
    const gap = clean.slice(lastIndex, startIndex);

    if (gap) {
      addUncertainSegment(gap);
    }

    numbers.push(num);
    lastIndex = numberRegex.lastIndex;
  }

  // Check remaining segment after last number
  if (lastIndex < clean.length) {
    const tail = clean.slice(lastIndex);
    addUncertainSegment(tail);
  }

  return { numbers, uncertainTokens };
}

/**
 * Checks whether a token segment is a recognized label, rank, or metadata string.
 */
export function isRecognizedLabelOrMeta(str: string): boolean {
  const upper = str.toUpperCase().trim();
  if (!upper) return true;
  // Known prize ranks
  if (/^(?:1ST|FIRST|2ND|SECOND|3RD|THIRD|4TH|FOURTH|5TH|FIFTH|6TH|SIXTH|COMPLIMENTS?|COMPLIMENT|COMP!?|COMP\.)$/i.test(upper)) return true;
  if (/^[1-6]\s*[:\-\.]?$/.test(upper)) return true;
  // Known prize amounts
  if (/^(?:5[,.]?000|500|250|100|50|20|₹|¥|RS\.?)$/i.test(upper)) return true;
  return false;
}

/**
 * Parses raw OCR or pasted result text into structured 1st, 2nd, 3rd, 4th, 5th prizes and 30 compliments.
 * Uses section awareness and token-based extraction with positional information.
 * Any uncertain or unrecognized content (such as '1*1') is captured in `uncertainTokens` for admin verification.
 */
export function parseLotteryResultText(text: string): ParsedLotteryResult {
  const normalizedText = cleanLotteryText(text);
  const rawLines = normalizedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let prize1 = '';
  let prize2 = '';
  let prize3 = '';
  let prize4 = '';
  let prize5 = '';
  let prize6 = '';

  const prizeCandidateRows: { line: string; num: string }[] = [];
  const complimentRows: string[][] = [];
  const uncertainTokens: string[] = [];
  let inCompliments = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const upper = line.toUpperCase();

    // Check if line indicates start of compliments section
    if (
      upper.includes('COMPLIMENT') ||
      upper.includes('COMELIMENT') ||
      upper.includes('COMP!') ||
      upper.includes('COMP.') ||
      upper.includes('CUMPLIMENT') ||
      upper.includes('6TH PRIZE')
    ) {
      inCompliments = true;
      const { numbers: lineNums, uncertainTokens: lineUncertain } = extractLineTokens(line);
      if (lineNums.length > 0) {
        complimentRows.push(lineNums);
      }
      for (const u of lineUncertain) {
        if (!uncertainTokens.includes(u)) uncertainTokens.push(u);
      }
      continue;
    }

    // Ignore pure header noise or date-only lines unless explicit prize ranks or multiple result numbers are present
    const isDateOrYear = /\b\d{1,2}[-\/\.]\d{1,2}[-\/\.](?:19|20)\d{2}\b/.test(line) || /^\s*(?:19|20)\d{2}\s*$/.test(line);
    const isHeaderNoise = /\b(?:DRAW\s*TIME|LIVE\s*RESULT|CHANGE\s*DATE|JOIN\s*TELEGRAM|RESULT\s*BY|HAPPY\s*DIWALI|DEAR|KERALA|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SHARE|SEARCH|RESULTS)\b/i.test(line);
    const hasExplicitPrizeRank = /(?:1st|first|2nd|second|3rd|third|4th|fourth|ath|5th|fifth|sth|6th|sixth)/i.test(line);

    // Extract tokens from line
    const { numbers, uncertainTokens: lineUncertain } = extractLineTokens(line);

    // Section check: do not interpret date or header noise lines as results unless they contain explicit ranks or multi-number sequences
    if ((isDateOrYear || isHeaderNoise) && !hasExplicitPrizeRank && numbers.length < 3) {
      continue;
    }

    for (const u of lineUncertain) {
      if (!uncertainTokens.includes(u)) uncertainTokens.push(u);
    }

    if (numbers.length === 0) {
      continue;
    }

    // If already in compliments section, collect numbers in exact order
    if (inCompliments) {
      complimentRows.push(numbers);
      continue;
    }

    // If line has 3 numbers (3 columns typical for compliments table), switch to compliments section
    if (numbers.length === 3 && (prize2 || prizeCandidateRows.length >= 4)) {
      inCompliments = true;
      complimentRows.push(numbers);
      continue;
    }

    // Check for inline prize sequence (e.g. 5 or 6 prize numbers on one line, separated by universal separators)
    if (numbers.length >= 5) {
      if (!prize1) prize1 = numbers[0];
      if (!prize2) prize2 = numbers[1];
      if (!prize3) prize3 = numbers[2];
      if (!prize4) prize4 = numbers[3];
      if (!prize5) prize5 = numbers[4];
      if (numbers.length >= 6 && !prize6) prize6 = numbers[5];
      continue;
    }

    // Labeled prize detection:
    const m1 = line.match(/(?:^|[^\w])(?:1st|first|1\s*[:\-\.]|1\s+|ts|ist)\b.*?([0-9]{3})(?!\d)/i);
    const m2 = line.match(/(?:^|[^\w])(?:2nd|second|2\s*[:\-\.]|2\s+|znd)\b.*?([0-9]{3})(?!\d)/i);
    const m3 = line.match(/(?:^|[^\w])(?:3rd|third|3\s*[:\-\.]|3\s+|3rc)\b.*?([0-9]{3})(?!\d)/i);
    const m4 = line.match(/(?:^|[^\w])(?:4th|fourth|4\s*[:\-\.]|4\s+|ath|4tn|4t|4rh|4ih)\b.*?([0-9]{3})(?!\d)/i);
    const m5 = line.match(/(?:^|[^\w])(?:5th|fifth|5\s*[:\-\.]|5\s+|sth|5tn|5t|sin|5rh)\b.*?([0-9]{3})(?!\d)/i);
    const m6 = line.match(/(?:^|[^\w])(?:6th|sixth|6\s*[:\-\.]|6\s+)\b.*?([0-9]{3})(?!\d)/i);

    if (m1 && !prize1) prize1 = m1[1];
    if (m2 && !prize2) prize2 = m2[1];
    if (m3 && !prize3) prize3 = m3[1];
    if (m4 && !prize4) prize4 = m4[1];
    if (m5 && !prize5) prize5 = m5[1];
    if (m6 && !prize6) prize6 = m6[1];

    if (numbers.length === 1) {
      prizeCandidateRows.push({ line, num: numbers[0] });
    }
  }

  // Positional fallback for top prizes if labeled match missed some
  if (!prize1 || !prize2 || !prize3 || !prize4 || !prize5) {
    if (prizeCandidateRows.length >= 5) {
      if (!prize1) prize1 = prizeCandidateRows[0].num;
      if (!prize2) prize2 = prizeCandidateRows[1].num;
      if (!prize3) prize3 = prizeCandidateRows[2].num;
      if (!prize4) prize4 = prizeCandidateRows[3].num;
      if (!prize5) prize5 = prizeCandidateRows[4].num;
    } else if (prizeCandidateRows.length === 4) {
      if (!prize2) prize2 = prizeCandidateRows[0].num;
      if (!prize3) prize3 = prizeCandidateRows[1].num;
      if (!prize4) prize4 = prizeCandidateRows[2].num;
      if (!prize5) prize5 = prizeCandidateRows[3].num;
    }
  }

  // Compliments mapping (30 boxes: 3 columns x 10 rows)
  const complimentBoxes: string[] = Array(30).fill('');

  if (complimentRows.length === 10 && complimentRows.every((r) => r.length === 3)) {
    for (let row = 0; row < 10; row++) {
      complimentBoxes[row] = complimentRows[row][0];      // Col 1 (indices 0..9)
      complimentBoxes[row + 10] = complimentRows[row][1]; // Col 2 (indices 10..19)
      complimentBoxes[row + 20] = complimentRows[row][2]; // Col 3 (indices 20..29)
    }
  } else {
    const flat = complimentRows.flat().slice(0, 30);
    if (flat.length === 30) {
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 3; col++) {
          const hIdx = row * 3 + col;
          const boxIdx = row + col * 10;
          complimentBoxes[boxIdx] = flat[hIdx] || '';
        }
      }
    } else {
      for (let i = 0; i < flat.length && i < 30; i++) {
        complimentBoxes[i] = flat[i];
      }
    }
  }

  // If prize6 was found in an inline sequence and complimentBoxes[0] is empty, place it
  if (prize6 && !complimentBoxes[0]) {
    complimentBoxes[0] = prize6;
  }

  let count = 0;
  if (prize1) count++;
  if (prize2) count++;
  if (prize3) count++;
  if (prize4) count++;
  if (prize5) count++;
  count += complimentBoxes.filter((c) => Boolean(c && c.trim().length === 3)).length;

  return {
    prize1: prize1 || '',
    prize2: prize2 || '',
    prize3: prize3 || '',
    prize4: prize4 || '',
    prize5: prize5 || '',
    prize6: prize6 || '',
    complimentBoxes,
    uncertainTokens,
    extractedCount: count,
  };
}

/**
 * Scans a user-uploaded image file with Tesseract.js using:
 * Pass 1: Full-canvas scan with row-adaptive binarization.
 * Pass 2: Targeted 3-column slicing if any compliment numbers were missed.
 */
export async function scanResultImage(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedLotteryResult> {
  onProgress?.(10, 'Enhancing image for scanning...');
  const canvas = await preprocessImageFile(file);

  onProgress?.(25, 'Initializing scanner engine...');
  let worker;
  try {
    worker = await createWorker('eng', 1, {
      langPath: '/tessdata',
      gzip: false,
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = 25 + Math.round((m.progress || 0) * 55);
          onProgress?.(pct, `Scanning image (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });
  } catch {
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = 25 + Math.round((m.progress || 0) * 55);
          onProgress?.(pct, `Scanning image (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });
  }

  try {
    onProgress?.(65, 'Reading result numbers...');
    const ret = await worker.recognize(canvas);
    const parsed = parseLotteryResultText(ret.data.text);

    // Pass 2: Targeted 3-column slicing if compliments table missed any numbers (< 30)
    const filledComps = parsed.complimentBoxes.filter((c) => Boolean(c && c.trim().length === 3)).length;
    if (filledComps < 30) {
      onProgress?.(85, 'Precision scanning 3 columns...');
      const w = canvas.width;
      const h = canvas.height;
      const tableTop = Math.round(h * 0.40);
      const tableHeight = Math.round(h * 0.58);
      const colWidth = Math.round(w / 3);

      for (let col = 0; col < 3; col++) {
        const colCanvas = document.createElement('canvas');
        colCanvas.width = colWidth;
        colCanvas.height = tableHeight;
        const colCtx = colCanvas.getContext('2d');
        if (colCtx) {
          colCtx.drawImage(
            canvas,
            col * colWidth,
            tableTop,
            colWidth,
            tableHeight,
            0,
            0,
            colWidth,
            tableHeight
          );
          const colRet = await worker.recognize(colCanvas);
          const cleanColText = cleanLotteryText(colRet.data.text);
          const { numbers: colNums } = extractLineTokens(cleanColText);
          if (colNums.length >= 10) {
            const tenNums = colNums.slice(-10);
            for (let row = 0; row < 10; row++) {
              const boxIdx = row + col * 10;
              if (!parsed.complimentBoxes[boxIdx] || parsed.complimentBoxes[boxIdx].trim().length !== 3) {
                parsed.complimentBoxes[boxIdx] = tenNums[row];
              }
            }
          }
        }
      }

      // Re-count extracted numbers after precision column slicing
      let count = 0;
      if (parsed.prize1) count++;
      if (parsed.prize2) count++;
      if (parsed.prize3) count++;
      if (parsed.prize4) count++;
      if (parsed.prize5) count++;
      count += parsed.complimentBoxes.filter((c) => Boolean(c && c.trim().length === 3)).length;
      parsed.extractedCount = count;
    }

    onProgress?.(100, 'Complete!');
    return parsed;
  } finally {
    await worker.terminate();
  }
}
