import { createWorker } from 'tesseract.js';

export interface ParsedLotteryResult {
  prize2: string;
  prize3: string;
  prize4: string;
  prize5: string;
  complimentBoxes: string[]; // 30 items
  extractedCount: number;
  prize1Detected?: string;
}

/**
 * Preprocesses an image file on an HTML5 canvas:
 * 1. Resizes with 2x scale (max width 1600px) for sharp OCR rendering.
 * 2. Converts to grayscale.
 * 3. Inverts if dark background detected (so text becomes dark on white).
 * 4. Enhances contrast for crisp character edges.
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

        // Step 1: Calculate average luminance to detect dark mode vs light mode
        let totalLuminance = 0;
        const sampleStep = 8; // sample every 8th pixel for speed
        let sampledCount = 0;

        for (let i = 0; i < data.length; i += 4 * sampleStep) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;
          sampledCount++;
        }

        const avgLuminance = sampledCount > 0 ? totalLuminance / sampledCount : 128;
        const isDarkBackground = avgLuminance < 110;

        // Step 2: Convert to grayscale, invert if dark, and enhance contrast
        const contrastFactor = 1.8;
        for (let i = 0; i < data.length; i += 4) {
          let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (isDarkBackground) {
            lum = 255 - lum;
          }
          // Contrast stretch around center 128
          lum = (lum - 128) * contrastFactor + 128;
          if (lum < 0) lum = 0;
          if (lum > 255) lum = 255;

          data[i] = lum;
          data[i + 1] = lum;
          data[i + 2] = lum;
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
 * Parses raw OCR text into structured 2nd, 3rd, 4th, 5th prizes and 30 compliments.
 * 1st prize is intentionally kept out of the auto-fill return (can be in prize1Detected for preview).
 */
export function parseLotteryResultText(text: string): ParsedLotteryResult {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const lines: string[] = [];
  for (const line of rawLines) {
    // Strip date/time stamps, URLs, and standard title noise so years/dates aren't confused with prize digits
    const cleaned = line
      .replace(/\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g, '')
      .replace(/\b202[4-9]\b/g, '')
      .replace(/\b(?:DRAW\s*TIME|LIVE\s*RESULT|CHANGE\s*DATE|JOIN\s*TELEGRAM|RESULT\s*BY|HAPPY\s*DIWALI|DEAR|KERALA|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SHARE)\b/gi, '')
      .replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)?\b/gi, '')
      .replace(/\b\d{1,2}\s*(?:AM|PM)\b/gi, '')
      .trim();
    if (cleaned) {
      lines.push(cleaned);
    }
  }

  let prize1 = '';
  let prize2 = '';
  let prize3 = '';
  let prize4 = '';
  let prize5 = '';

  const prizeCandidates: string[] = [];
  const complimentCandidates: string[] = [];
  let inCompliments = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    if (upper.includes('COMPLIMENT')) {
      inCompliments = true;
      continue;
    }

    const nums = line.match(/\b\d{3}\b/g);
    if (!nums || nums.length === 0) continue;

    // A line with 3 three-digit numbers is definitively a compliment row
    if (nums.length >= 3) {
      inCompliments = true;
      complimentCandidates.push(...nums.slice(0, 3));
      continue;
    }

    if (inCompliments) {
      complimentCandidates.push(...nums);
      continue;
    }

    // Checking top 5 prize rows (explicit labels first)
    const m1 = line.match(/^(?:1st|1\s*[:\-\.]?)\s*(?:[₹\d,]+\s+)?(\d{3})\b/i);
    const m2 = line.match(/^(?:2nd|2\s*[:\-\.]?)\s*(?:[₹\d,]+\s+)?(\d{3})\b/i);
    const m3 = line.match(/^(?:3rd|3\s*[:\-\.]?)\s*(?:[₹\d,]+\s+)?(\d{3})\b/i);
    const m4 = line.match(/^(?:4th|4\s*[:\-\.]?)\s*(?:[₹\d,]+\s+)?(\d{3})\b/i);
    const m5 = line.match(/^(?:5th|5\s*[:\-\.]?)\s*(?:[₹\d,]+\s+)?(\d{3})\b/i);

    if (m1 && !prize1) { prize1 = m1[1]; continue; }
    if (m2 && !prize2) { prize2 = m2[1]; continue; }
    if (m3 && !prize3) { prize3 = m3[1]; continue; }
    if (m4 && !prize4) { prize4 = m4[1]; continue; }
    if (m5 && !prize5) { prize5 = m5[1]; continue; }

    // End-of-line 3-digit number (e.g. icon/amount followed by winning number)
    const lastNum = nums[nums.length - 1];
    prizeCandidates.push(lastNum);
  }

  // Fallback if labels were not explicitly read as 1st/2nd/3rd etc.
  if (prizeCandidates.length >= 4) {
    if (!prize1 && prizeCandidates.length >= 5) prize1 = prizeCandidates[0];
    const offset = prizeCandidates.length >= 5 ? 1 : 0;
    if (!prize2 && prizeCandidates[offset]) prize2 = prizeCandidates[offset];
    if (!prize3 && prizeCandidates[offset + 1]) prize3 = prizeCandidates[offset + 1];
    if (!prize4 && prizeCandidates[offset + 2]) prize4 = prizeCandidates[offset + 2];
    if (!prize5 && prizeCandidates[offset + 3]) prize5 = prizeCandidates[offset + 3];
  }

  // Map compliments into 30 complimentBoxes according to the 3 vertical columns layout:
  // UI Grid: cellIndex = 0..29 -> row = floor(cellIndex / 3), col = cellIndex % 3, compIdx = row + col * 10
  // When compliments are read row-by-row (horizontal):
  // compBoxes[row + col * 10] = horizontalList[row * 3 + col]
  const complimentBoxes: string[] = Array(30).fill('');
  const horizontalList = complimentCandidates.slice(0, 30);

  if (horizontalList.length === 30) {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 3; col++) {
        const hIdx = row * 3 + col;
        const boxIdx = row + col * 10;
        complimentBoxes[boxIdx] = horizontalList[hIdx] || '';
      }
    }
  } else {
    for (let i = 0; i < horizontalList.length && i < 30; i++) {
      complimentBoxes[i] = horizontalList[i];
    }
  }

  let count = 0;
  if (prize2) count++;
  if (prize3) count++;
  if (prize4) count++;
  if (prize5) count++;
  count += complimentBoxes.filter((c) => Boolean(c && c.trim().length === 3)).length;

  return {
    prize1Detected: prize1,
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
 * 2nd-5th prizes and 30 compliments.
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
