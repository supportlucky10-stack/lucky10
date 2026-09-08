import { toJpeg } from 'html-to-image';

export interface ShareElementOptions {
  elementId?: string;
  element?: HTMLElement | null;
  fileName?: string;
  title?: string;
  textSummary?: string;
}

/** Detect iOS (iPhone / iPad / iPod) */
const isIOS = (): boolean =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  // iPad on iOS 13+ reports as MacIntel
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let fontsPreloadPromise: Promise<void> | null = null;

/**
 * Pre-load critical bold font weights in the background so they are
 * immediately ready when the user clicks share, avoiding on-click network latency.
 */
const ensureBoldFontsLoaded = (): Promise<void> => {
  if (fontsPreloadPromise) return fontsPreloadPromise;
  if (typeof document === 'undefined') return Promise.resolve();

  fontsPreloadPromise = (async () => {
    const weights: Array<{ weight: string; url: string }> = [
      { weight: '700', url: '/fonts/Montserrat-Bold.ttf' },
      { weight: '800', url: '/fonts/Montserrat-ExtraBold.ttf' },
      { weight: '900', url: '/fonts/Montserrat-Black.ttf' },
    ];

    const loadPromises = weights.map(async ({ weight, url }) => {
      try {
        const existing = [...document.fonts].find(
          (f) => f.family === 'Montserrat' && f.weight === weight && f.status === 'loaded'
        );
        if (existing) return;

        const font = new FontFace('Montserrat', `url(${url}) format('truetype')`, {
          weight,
          style: 'normal',
          display: 'block',
        });

        const loaded = await font.load();
        document.fonts.add(loaded);
      } catch {
        // non-fatal
      }
    });

    await Promise.all(loadPromises);

    try {
      await document.fonts.ready;
    } catch {}
  })();

  return fontsPreloadPromise;
};

// Immediately initialize font preloading in background upon module load
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => ensureBoldFontsLoaded());
  } else {
    setTimeout(() => ensureBoldFontsLoaded(), 150);
  }
}

let isSvgWarmedUp = false;

/**
 * Fast capture: warms up SVG font rasterization once per session on iOS,
 * without artificial timeouts or cache-busting re-downloads.
 */
const captureWithFontFix = async (
  elem: HTMLElement,
  options: Parameters<typeof toJpeg>[1]
): Promise<string> => {
  if (isIOS() && !isSvgWarmedUp) {
    try {
      await toJpeg(elem, options);
      isSvgWarmedUp = true;
    } catch {}
  }
  return toJpeg(elem, options);
};

/**
 * High-speed synchronous base64 dataURL to Blob conversion.
 * Avoids asynchronous browser HTTP fetch state machine overhead.
 */
const dataUriToBlob = (dataURI: string): Blob => {
  try {
    const parts = dataURI.split(',');
    const header = parts[0] || '';
    const base64Data = parts[1] || '';
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const byteString = atob(base64Data);
    const buffer = new ArrayBuffer(byteString.length);
    const byteArray = new Uint8Array(buffer);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([byteArray], { type: mimeType });
  } catch {
    const byteCharacters = atob(dataURI.split(',')[1]);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: 'image/jpeg' });
  }
};

/**
 * Captures an HTML element as a crisp JPG image and shares it via Web Share API or triggers download + WhatsApp.
 */
export const captureAndShareElement = async ({
  elementId,
  element,
  fileName = 'share_image.jpg',
  textSummary = '',
}: ShareElementOptions): Promise<void> => {
  const targetElem = element || (elementId ? document.getElementById(elementId) : null);

  if (!targetElem) {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const fallbackUrl = mobile
      ? textSummary ? `whatsapp://send?text=${encodeURIComponent(textSummary)}` : `whatsapp://send`
      : textSummary ? `https://web.whatsapp.com/send?text=${encodeURIComponent(textSummary)}` : `https://web.whatsapp.com`;
    window.open(fallbackUrl, '_blank');
    return;
  }

  try {
    // Step 1: Ensure background font loading is ready (resolves in 0ms if already cached)
    await ensureBoldFontsLoaded();

    // Step 2: Instant capture with optimized encoding
    const dataUrl = await captureWithFontFix(targetElem, {
      quality: 0.92,
      backgroundColor: '#000000',
      pixelRatio: 2,
      filter: (node) => (node as HTMLElement).tagName !== 'INPUT',
    });

    const blob = dataUriToBlob(dataUrl);

    const jpgFileName = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
      ? fileName
      : fileName.replace(/\.[^/.]+$/, '') + '.jpg';

    const file = new File([blob], jpgFileName, { type: 'image/jpeg', lastModified: Date.now() });

    // 1. Try mobile Web Share API for direct WhatsApp / Image Sharing
    if (typeof navigator !== 'undefined' && navigator.share) {
      let canShareFiles = false;
      try {
        if (navigator.canShare) {
          canShareFiles = navigator.canShare({ files: [file] });
        } else {
          canShareFiles = true;
        }
      } catch (e) {
        canShareFiles = false;
      }

      if (canShareFiles) {
        try {
          await navigator.share({
            files: [file],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
          try {
            await navigator.share({
              title: ' ',
              files: [file],
            });
            return;
          } catch (retryErr: any) {
            if (retryErr?.name === 'AbortError') return;
          }
        }
      }
    }

    // 2. Fallback for desktop browsers:
    // Try copying image to clipboard for fast Ctrl+V in WhatsApp Web
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const pngBlob = await new Promise<Blob | null>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((b) => resolve(b), 'image/png');
            } else {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = dataUrl;
        });

        if (pngBlob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob }),
          ]);
        }
      }
    } catch (clipErr) {
      // ignore clipboard fallback errors
    }

    // Download JPG file
    const link = document.createElement('a');
    link.download = jpgFileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open WhatsApp
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waUrl = isMobile ? `whatsapp://send` : `https://web.whatsapp.com`;
    window.open(waUrl, '_blank');
  } catch (err) {
    console.error('Failed to capture screen element image:', err);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const fallbackUrl = isMobile ? `whatsapp://send` : `https://web.whatsapp.com`;
    window.open(fallbackUrl, '_blank');
  }
};
