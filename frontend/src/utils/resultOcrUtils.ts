import { createWorker } from 'tesseract.js';

export interface ParsedLotteryResult {
  prize1: string;
  prize2: string;
  prize3: string;
  prize4: string;
  prize5: string;
  complimentBoxes: string[]; // 30 items
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

        // Scale image so targetWidth is at least 1200px (capped at 2.0x) so characters are ~50-60px tall,
        // providing crisp stroke separation and preventing character curves from blurring together.
        let scale = 1.0;
        if (origWidth < 1200) {
          scale = Math.min(2.0, 1200 / origWidth);
        }

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

          const isDarkRow = rowMedian < 140;

          for (let x = 0; x < targetWidth; x++) {
            const lum = gray[rowStart + x];
            // For dark banner rows (white text on dark background), invert so text is black on white.
            // For standard light rows, use crisp threshold (85) to keep the numeral stroke thin,
            // preserving the open gap between the tail and the upper loop of '9'.
            const isText = isDarkRow ? lum > 175 : lum < 85;
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
 * Normalizes common OCR artifacts in lottery text (e.g. spaced digits, 'O' instead of '0',
 * and letters like 'g', 'q', 'Q' mistakenly recognized in place of '9').
 */
function cleanLotteryText(text: string): string {
  let cleaned = text.replace(/(\b\d)\s+(\d)\s+(\d\b)/g, '$1$2$3');
  cleaned = cleaned.replace(/(\b\d{2})\s+(\d\b)/g, '$1$2');
  cleaned = cleaned.replace(/(\b\d)\s+(\d{2}\b)/g, '$1$2');
  cleaned = cleaned.replace(/\|\s*(\d{3})/g, ' $1');
  cleaned = cleaned.replace(/\|\s*o(\d{2})/gi, ' 0$1');
  cleaned = cleaned.replace(/\b[oO](\d{2})\b/g, '0$1');
  cleaned = cleaned.replace(/\b(\d)[oO](\d)\b/g, '$10$2');
  cleaned = cleaned.replace(/\b(\d{2})[oO]\b/g, '$10');

  // Handle OCR misrecognition of '9' as 'g', 'q', or 'Q'
  cleaned = cleaned.replace(/\|\s*[gqQ](\d{2})/gi, ' 9$1');
  cleaned = cleaned.replace(/\b[gqQ](\d{2})\b/g, '9$1');
  cleaned = cleaned.replace(/\b(\d)[gqQ](\d)\b/g, '$19$2');
  cleaned = cleaned.replace(/\b(\d{2})[gqQ]\b/g, '$19');

  // Handle OCR misrecognition of '8' as 's'/'S' when surrounded by digits (e.g. 0s0 -> 080)
  cleaned = cleaned.replace(/\b(\d)[sS](\d)\b/g, '$18$2');

  return cleaned;
}

const clean3DigitVal = (val: string): string => {
  if (!val) return '';
  // Convert OCR misread letters: O/o -> 0, g/q/Q -> 9
  const numOnly = val.replace(/[oO]/g, '0').replace(/[gqQ]/g, '9').replace(/\D/g, '').trim();
  if (!numOnly) return '';
  // Handle edge case where OCR appends a trailing '0' artifact to a 3-digit number (e.g. 7890 -> 789)
  if (numOnly.length === 4 && numOnly.endsWith('0') && !numOnly.startsWith('0')) {
    return numOnly.slice(0, 3);
  }
  return numOnly.padStart(3, '0').slice(-3);
};

/**
 * Strips rupee amounts, currency symbols, and trailing prize payouts like ₹5,000, 25,000, ₹500, 500, ₹250, 250, 100, 50, 30
 * from candidate lines so they never pollute winning numbers.
 */
function stripPrizeAmounts(line: string): string {
  let cleaned = line.replace(/(?:[\u20B9$]|Rs\.?|INR)?\s*(?:25,?000|5,?000|2,?250|2,?100|500|250|100|50|30)\s*$/i, '');
  cleaned = cleaned.replace(/[\u20B9$]\s*\d+\s*$/i, '');
  return cleaned.trim();
}

/**
 * Parses raw OCR text into structured 1st, 2nd, 3rd, 4th, 5th prizes and 30 compliments.
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

  const prizeCandidateRows: { line: string; num: string; matched: boolean }[] = [];
  const complimentRows: string[][] = [];
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
      upper.includes('CUMPLIMENT')
    ) {
      inCompliments = true;
      continue;
    }

    // Ignore headers, dates, years, times, telegram links, labels unless they have prize labels
    const isDateOrYear = /\b(?:202[0-9]|19\d\d)\b/.test(line) || /[-\/]\d{2,4}\b/.test(line);
    const isHeaderNoise = /\b(?:DRAW\s*TIME|LIVE\s*RESULT|CHANGE\s*DATE|JOIN\s*TELEGRAM|RESULT\s*BY|HAPPY\s*DIWALI|DEAR|KERALA|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SHARE|SEARCH|RESULTS)\b/i.test(line);

    if ((isDateOrYear || isHeaderNoise) && !/(?:1st|first|2nd|second|3rd|third|4th|fourth|ath|5th|fifth|sth)/i.test(line)) {
      continue;
    }

    // Strip trailing currency payouts (e.g. ₹5,000, 500, 2250, 2100, 250, 50, 30) from the line so they NEVER pollute winning numbers
    const lineWithoutPayout = stripPrizeAmounts(line);

    // Extract all 3-digit candidate numbers in the line (preferring line without payout amount)
    const nums = lineWithoutPayout.match(/\b[0-9oOgqQ]{3}\b/g) || line.match(/\b[0-9oOgqQ]{3}\b/g) || [];

    // If line has 3 numbers (3 columns), it is definitely a compliments row!
    if (nums.length === 3) {
      inCompliments = true;
      complimentRows.push(nums.map(clean3DigitVal));
      continue;
    }

    if (inCompliments) {
      if (nums.length > 0) {
        complimentRows.push(nums.map(clean3DigitVal));
      }
      continue;
    }

    // Top prize section:
    // Match labeled rows anywhere in the line with common OCR variations:
    // 1st: "1st", "FIRST", "1 :", "1 -", "1 ", "ts", "ist"
    // 2nd: "2nd", "SECOND", "2 :", "2 -", "2 ", "znd"
    // 3rd: "3rd", "THIRD", "3 :", "3 -", "3 ", "3rc"
    // 4th: "4th", "FOURTH", "4 :", "4 -", "4 ", "ath", "4tn", "4t", "4rh", "4ih"
    // 5th: "5th", "FIFTH", "5 :", "5 -", "5 ", "sth", "5tn", "5t", "sin", "5rh", "s :", "s "
    const m1 = lineWithoutPayout.match(/(?:^|[^\w])(?:1st|first|1\s*[:\-\.]|1\s+|ts|ist)\b.*?([0-9oOgqQ]{3})\b/i);
    const m2 = lineWithoutPayout.match(/(?:^|[^\w])(?:2nd|second|2\s*[:\-\.]|2\s+|znd)\b.*?([0-9oOgqQ]{3})\b/i);
    const m3 = lineWithoutPayout.match(/(?:^|[^\w])(?:3rd|third|3\s*[:\-\.]|3\s+|3rc)\b.*?([0-9oOgqQ]{3})\b/i);
    const m4 = lineWithoutPayout.match(/(?:^|[^\w])(?:4th|fourth|4\s*[:\-\.]|4\s+|ath|4tn|4t|4rh|4ih)\b.*?([0-9oOgqQ]{3})\b/i);
    const m5 = lineWithoutPayout.match(/(?:^|[^\w])(?:5th|fifth|5\s*[:\-\.]|5\s+|sth|5tn|5t|sin|5rh|s\s*[:\-\.]|s\s+)\b.*?([0-9oOgqQ]{3})\b/i);

    let matched = false;
    if (m1 && !prize1) { prize1 = clean3DigitVal(m1[1]); matched = true; }
    if (m2 && !prize2) { prize2 = clean3DigitVal(m2[1]); matched = true; }
    if (m3 && !prize3) { prize3 = clean3DigitVal(m3[1]); matched = true; }
    if (m4 && !prize4) { prize4 = clean3DigitVal(m4[1]); matched = true; }
    if (m5 && !prize5) { prize5 = clean3DigitVal(m5[1]); matched = true; }

    // Pick FIRST 3-digit number directly following the rank label (nums[0]), NEVER the trailing prize payout!
    if (nums.length > 0) {
      prizeCandidateRows.push({
        line,
        num: clean3DigitVal(nums[0]),
        matched,
      });
    }
  }

  // Positional fallback: if labeled matching missed some prizes due to noise/blur,
  // map candidates captured sequentially before compliments
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

  // Compliments mapping (3 columns x 10 rows = 30 boxes)
  const complimentBoxes = Array(30).fill('');

  if (complimentRows.length === 10 && complimentRows.every((r) => r.length === 3)) {
    for (let row = 0; row < 10; row++) {
      complimentBoxes[row] = complimentRows[row][0];      // Col 1
      complimentBoxes[row + 10] = complimentRows[row][1]; // Col 2
      complimentBoxes[row + 20] = complimentRows[row][2]; // Col 3
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
    complimentBoxes,
    extractedCount: count,
  };
}

/**
 * Performs topological / geometric disambiguation for digit '9' vs '0'.
 * For 1st, 2nd, 3rd, 4th, and 5th prize numbers extracted with a leading '0' followed by two digits (e.g. "077", "044"),
 * checks the canvas pixel distribution on the first digit's bounding box:
 * - Samples the bottom-left quadrant (x: 5% to 30%, y: 55% to 85% of the digit box).
 * - If the bottom-left quadrant is predominantly background (white pixels > 60%) while digit '0' would have a solid
 *   black curved oval stroke, it identifies the character as digit '9' and corrects the leading '0' to '9'.
 */
function checkIsDigitNine(
  canvas: HTMLCanvasElement,
  digitBBox: { x0: number; y0: number; x1: number; y1: number }
): boolean {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    const w = digitBBox.x1 - digitBBox.x0;
    const h = digitBBox.y1 - digitBBox.y0;
    if (w <= 4 || h <= 8) return false;

    // Sample bottom-left quadrant (x: 5% to 30%, y: 55% to 85%)
    const blX0 = Math.round(digitBBox.x0 + w * 0.05);
    const blX1 = Math.round(digitBBox.x0 + w * 0.30);
    const blY0 = Math.round(digitBBox.y0 + h * 0.55);
    const blY1 = Math.round(digitBBox.y0 + h * 0.85);

    const blW = Math.max(1, blX1 - blX0);
    const blH = Math.max(1, blY1 - blY0);

    const blData = ctx.getImageData(blX0, blY0, blW, blH).data;
    let blWhite = 0;
    const blTotal = blW * blH;

    for (let i = 0; i < blData.length; i += 4) {
      const lum = 0.299 * blData[i] + 0.587 * blData[i + 1] + 0.114 * blData[i + 2];
      if (lum > 128) blWhite++;
    }

    const blWhiteRatio = blWhite / blTotal;
    return blWhiteRatio > 0.60;
  } catch {
    return false;
  }
}

function findDigitBoundingBox(
  num: string,
  words: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; symbols?: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> }>
): { x0: number; y0: number; x1: number; y1: number } | null {
  for (const w of words) {
    const cleanWord = (w.text || '').replace(/\D/g, '');
    if (cleanWord === num || cleanWord.endsWith(num)) {
      if (w.symbols && w.symbols.length >= 3) {
        const symIdx = cleanWord === num ? 0 : w.symbols.length - 3;
        const sym = w.symbols[symIdx];
        if (sym && sym.bbox) return sym.bbox;
      }
      const width = w.bbox.x1 - w.bbox.x0;
      return {
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: Math.round(w.bbox.x0 + width * 0.33),
        y1: w.bbox.y1,
      };
    }
  }
  return null;
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

  await worker.setParameters({
    tessedit_char_whitelist: "0123456789stndrhSTNDRHabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ₹,.:- ",
    tessedit_pageseg_mode: "6" as any,
  });

  try {
    onProgress?.(65, 'Reading result numbers...');
    const ret = await worker.recognize(canvas);
    let parsed = parseLotteryResultText(ret.data.text);

    // Pass 1.5: Precision fallback for top prize area (prizes 2-5) if any are missing
    if (!parsed.prize2 || !parsed.prize3 || !parsed.prize4 || !parsed.prize5) {
      onProgress?.(75, 'Precision scanning prize section...');
      const w = canvas.width;
      const h = canvas.height;
      const topHeight = Math.round(h * 0.45);
      const topCanvas = document.createElement('canvas');
      topCanvas.width = w;
      topCanvas.height = topHeight;
      const topCtx = topCanvas.getContext('2d');
      if (topCtx) {
        topCtx.drawImage(canvas, 0, 0, w, topHeight, 0, 0, w, topHeight);
        const topRet = await worker.recognize(topCanvas);
        const topParsed = parseLotteryResultText(topRet.data.text);
        if (!parsed.prize2 && topParsed.prize2) parsed.prize2 = topParsed.prize2;
        if (!parsed.prize3 && topParsed.prize3) parsed.prize3 = topParsed.prize3;
        if (!parsed.prize4 && topParsed.prize4) parsed.prize4 = topParsed.prize4;
        if (!parsed.prize5 && topParsed.prize5) parsed.prize5 = topParsed.prize5;
      }
    }

    // Topological / Geometric Disambiguation Post-Check for leading '0' (e.g. '044' -> '944', '077' -> '977')
    const words = (ret.data as any)?.words || [];
    const disambiguatePrize = (prizeVal: string): string => {
      if (prizeVal && prizeVal.length === 3 && prizeVal.startsWith('0')) {
        const digitBox = findDigitBoundingBox(prizeVal, words);
        if (digitBox && checkIsDigitNine(canvas, digitBox)) {
          return '9' + prizeVal.slice(1);
        }
      }
      return prizeVal;
    };

    if (parsed.prize1) parsed.prize1 = disambiguatePrize(parsed.prize1);
    if (parsed.prize2) parsed.prize2 = disambiguatePrize(parsed.prize2);
    if (parsed.prize3) parsed.prize3 = disambiguatePrize(parsed.prize3);
    if (parsed.prize4) parsed.prize4 = disambiguatePrize(parsed.prize4);
    if (parsed.prize5) parsed.prize5 = disambiguatePrize(parsed.prize5);

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
          const colNums = (cleanColText.match(/\b[0-9oOgqQ]{3}\b/g) || []).map(clean3DigitVal);
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
