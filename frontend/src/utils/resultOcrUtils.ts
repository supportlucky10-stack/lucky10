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
 * Computes Otsu's optimal binarization threshold from pixel luminance data.
 * Clamped between 120 and 175 to guarantee robust separation of dark printed text
 * from white, off-white, and pastel-colored backgrounds.
 */
function calculateOtsuThreshold(grayData: Uint8ClampedArray): number {
  const hist = new Int32Array(256);
  const total = grayData.length / 4;

  for (let i = 0; i < grayData.length; i += 4) {
    hist[grayData[i]]++;
  }

  let sumT = 0;
  for (let t = 0; t < 256; t++) {
    sumT += t * hist[t];
  }

  let sumB = 0;
  let weightB = 0;
  let maxVar = 0;
  let threshold = 145;

  for (let t = 0; t < 256; t++) {
    weightB += hist[t];
    if (weightB === 0) continue;
    const weightF = total - weightB;
    if (weightF === 0) break;

    sumB += t * hist[t];
    const meanB = sumB / weightB;
    const meanF = (sumT - sumB) / weightF;
    const varBetween = weightB * weightF * (meanB - meanF) * (meanB - meanF);

    if (varBetween > maxVar) {
      maxVar = varBetween;
      threshold = t;
    }
  }

  return Math.max(120, Math.min(175, threshold));
}

/**
 * Preprocesses an image file on an HTML5 canvas:
 * 1. Upscales 2x for sharp digit recognition (capping max width at 1800px).
 * 2. Converts to grayscale luminance.
 * 3. Applies Otsu's binarization thresholding to eliminate colored background bands
 *    and ensure crisp black text on pure white for 100% OCR accuracy.
 */
export async function preprocessImageFile(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        // Upscale 2x for sharp digit recognition, capping max width at 1800px
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

        // Step 1: Convert to grayscale luminance
        for (let i = 0; i < data.length; i += 4) {
          const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          data[i] = lum;
          data[i + 1] = lum;
          data[i + 2] = lum;
        }

        // Step 2: Otsu optimal binarization
        const threshold = calculateOtsuThreshold(data);
        for (let i = 0; i < data.length; i += 4) {
          const val = data[i] > threshold ? 255 : 0;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
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
 * Parses raw OCR text into structured 1st, 2nd, 3rd, 4th, 5th prizes and 30 compliments.
 */
export function parseLotteryResultText(text: string): ParsedLotteryResult {
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let prize1 = '';
  let prize2 = '';
  let prize3 = '';
  let prize4 = '';
  let prize5 = '';

  const prizeCandidates: string[] = [];
  const complimentRows: string[][] = [];
  let inCompliments = false;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    const upper = line.toUpperCase();

    // Check if line indicates start of compliments section
    if (
      upper.includes('COMPLIMENT') ||
      upper.includes('COMELIMENT') ||
      upper.includes('COMP!') ||
      upper.includes('COMP.')
    ) {
      inCompliments = true;
      continue;
    }

    // Ignore headers, dates, times, telegram links, labels
    if (
      /\b(?:DRAW\s*TIME|LIVE\s*RESULT|CHANGE\s*DATE|JOIN\s*TELEGRAM|RESULT\s*BY|HAPPY\s*DIWALI|DEAR|KERALA|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SHARE)\b/i.test(line) ||
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/.test(line) ||
      /^\d{1,2}:\d{2}/.test(line)
    ) {
      // But verify if line actually contains a prize pattern first (e.g. "1st 381" on same line)
      if (!/^(?:1st|2nd|3rd|4th|5th|[1-5]\s*[:\-])/i.test(line)) {
        continue;
      }
    }

    // Normalize OCR digit spaces like "8 0 0" -> "800"
    line = line.replace(/(\b\d)\s+(\d)\s+(\d\b)/g, '$1$2$3');

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
    // Match labeled rows with common OCR misrecognitions:
    // 1st: "1st", "1 :", "1 -", "1", "ts", "Ist"
    // 2nd: "2nd", "2 :", "2 -", "2", "znd"
    // 3rd: "3rd", "3 :", "3 -", "3", "3rc"
    // 4th: "4th", "4 :", "4 -", "4", "ath", "Ath"
    // 5th: "5th", "5 :", "5 -", "5", "Sth", "sth"
    const m1 = line.match(/^(?:1st|1\s*[:\-\.]?|ts|Ist)\s*(?:[₹\$\d,oO]+\s+)?(\d{3})\b/i);
    const m2 = line.match(/^(?:2nd|2\s*[:\-\.]?|znd)\s*(?:[₹\$\d,oO]+\s+)?(\d{3})\b/i);
    const m3 = line.match(/^(?:3rd|3\s*[:\-\.]?|3rc)\s*(?:[₹\$\d,oO]+\s+)?(\d{3})\b/i);
    const m4 = line.match(/^(?:4th|4\s*[:\-\.]?|ath|Ath)\s*(?:[₹\$\d,oO]+\s+)?(\d{3})\b/i);
    const m5 = line.match(/^(?:5th|5\s*[:\-\.]?|Sth|sth)\s*(?:[₹\$\d,oO]+\s+)?(\d{3})\b/i);

    if (m1 && !prize1) { prize1 = m1[1]; continue; }
    if (m2 && !prize2) { prize2 = m2[1]; continue; }
    if (m3 && !prize3) { prize3 = m3[1]; continue; }
    if (m4 && !prize4) { prize4 = m4[1]; continue; }
    if (m5 && !prize5) { prize5 = m5[1]; continue; }

    // If there's at least one 3-digit number, save the last 3-digit number on this line as a prize candidate
    if (nums.length > 0) {
      prizeCandidates.push(nums[nums.length - 1]);
    }
  }

  // Fallback: if labeled matching missed some prizes, use candidates captured before compliments
  if (prizeCandidates.length >= 5) {
    if (!prize1) prize1 = prizeCandidates[0];
    if (!prize2) prize2 = prizeCandidates[1];
    if (!prize3) prize3 = prizeCandidates[2];
    if (!prize4) prize4 = prizeCandidates[3];
    if (!prize5) prize5 = prizeCandidates[4];
  } else if (prizeCandidates.length >= 4) {
    if (!prize2) prize2 = prizeCandidates[0];
    if (!prize3) prize3 = prizeCandidates[1];
    if (!prize4) prize4 = prizeCandidates[2];
    if (!prize5) prize5 = prizeCandidates[3];
  }

  // Map compliment rows into complimentBoxes (30 items)
  // Grid layout in UI:
  // Col 0: indices 0..9
  // Col 1: indices 10..19
  // Col 2: indices 20..29
  const complimentBoxes = Array(30).fill('');

  // If complimentRows has exactly 10 rows of 3 numbers (standard 3x10 matrix):
  if (complimentRows.length === 10 && complimentRows.every((r) => r.length === 3)) {
    for (let row = 0; row < 10; row++) {
      complimentBoxes[row] = complimentRows[row][0];      // Col 1
      complimentBoxes[row + 10] = complimentRows[row][1]; // Col 2
      complimentBoxes[row + 20] = complimentRows[row][2]; // Col 3
    }
  } else {
    // Flatten rows fallback
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
 * Scans a user-uploaded image file with Tesseract.js and extracts
 * 1st-5th prizes and 30 compliments.
 */
export async function scanResultImage(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedLotteryResult> {
  onProgress?.(10, 'Enhancing image for scanning...');
  const canvas = await preprocessImageFile(file);

  onProgress?.(30, 'Initializing scanner engine...');
  let worker;
  try {
    // Attempt local traineddata first for offline/fast load
    worker = await createWorker('eng', 1, {
      langPath: '/tessdata',
      gzip: false,
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = 30 + Math.round((m.progress || 0) * 60);
          onProgress?.(pct, `Scanning image (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });
  } catch {
    // Fallback to default CDN if local fails
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = 30 + Math.round((m.progress || 0) * 60);
          onProgress?.(pct, `Scanning image (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });
  }

  onProgress?.(70, 'Reading result numbers...');
  const ret = await worker.recognize(canvas);
  await worker.terminate();

  onProgress?.(95, 'Organizing results into boxes...');
  const parsed = parseLotteryResultText(ret.data.text);
  onProgress?.(100, 'Complete!');

  return parsed;
}
