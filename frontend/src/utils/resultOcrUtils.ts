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
function cleanLotteryText(text: string): string {
  let cleaned = text.replace(/(\b\d)\s+(\d)\s+(\d\b)/g, '$1$2$3');
  cleaned = cleaned.replace(/(\b\d{2})\s+(\d\b)/g, '$1$2');
  cleaned = cleaned.replace(/(\b\d)\s+(\d{2}\b)/g, '$1$2');
  cleaned = cleaned.replace(/\|\s*(\d{3})/g, ' $1');
  cleaned = cleaned.replace(/\|\s*o(\d{2})/gi, ' 0$1');
  cleaned = cleaned.replace(/\b[oO](\d{2})\b/g, '0$1');
  cleaned = cleaned.replace(/\b(\d)[oO](\d)\b/g, '$10$2');
  cleaned = cleaned.replace(/\b(\d{2})[oO]\b/g, '$10');
  return cleaned;
}

const clean3DigitVal = (val: string): string => {
  if (!val) return '';
  const numOnly = val.replace(/[oO]/g, '0').replace(/\D/g, '').trim();
  if (!numOnly) return '';
  return numOnly.padStart(3, '0').slice(-3);
};

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

    // Extract all 3-digit numbers in the line
    const nums = line.match(/\b\d{3}\b/g) || [];

    // If line has 3 numbers (3 columns), it is definitely a compliments row!
    if (nums.length === 3) {
      inCompliments = true;
      complimentRows.push(nums);
      continue;
    }

    if (inCompliments) {
      if (nums.length > 0) {
        complimentRows.push(nums);
      }
      continue;
    }

    // Top prize section:
    // Match labeled rows anywhere in the line with common OCR variations:
    // 1st: "1st", "FIRST", "1 :", "1 -", "1 ", "ts", "ist"
    // 2nd: "2nd", "SECOND", "2 :", "2 -", "2 ", "znd"
    // 3rd: "3rd", "THIRD", "3 :", "3 -", "3 ", "3rc"
    // 4th: "4th", "FOURTH", "4 :", "4 -", "4 ", "ath", "4tn", "4t", "4rh", "4ih"
    // 5th: "5th", "FIFTH", "5 :", "5 -", "5 ", "sth", "5tn", "5t", "sin", "5rh"
    const m1 = line.match(/(?:^|[^\w])(?:1st|first|1\s*[:\-\.]|1\s+|ts|ist)\b.*?([0-9oO]{3})\b/i);
    const m2 = line.match(/(?:^|[^\w])(?:2nd|second|2\s*[:\-\.]|2\s+|znd)\b.*?([0-9oO]{3})\b/i);
    const m3 = line.match(/(?:^|[^\w])(?:3rd|third|3\s*[:\-\.]|3\s+|3rc)\b.*?([0-9oO]{3})\b/i);
    const m4 = line.match(/(?:^|[^\w])(?:4th|fourth|4\s*[:\-\.]|4\s+|ath|4tn|4t|4rh|4ih)\b.*?([0-9oO]{3})\b/i);
    const m5 = line.match(/(?:^|[^\w])(?:5th|fifth|5\s*[:\-\.]|5\s+|sth|5tn|5t|sin|5rh)\b.*?([0-9oO]{3})\b/i);

    let matched = false;
    if (m1 && !prize1) { prize1 = clean3DigitVal(m1[1]); matched = true; }
    if (m2 && !prize2) { prize2 = clean3DigitVal(m2[1]); matched = true; }
    if (m3 && !prize3) { prize3 = clean3DigitVal(m3[1]); matched = true; }
    if (m4 && !prize4) { prize4 = clean3DigitVal(m4[1]); matched = true; }
    if (m5 && !prize5) { prize5 = clean3DigitVal(m5[1]); matched = true; }

    if (nums.length > 0) {
      prizeCandidateRows.push({
        line,
        num: clean3DigitVal(nums[nums.length - 1]),
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
    let parsed = parseLotteryResultText(ret.data.text);

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
          const colNums = cleanColText.match(/\b\d{3}\b/g) || [];
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
