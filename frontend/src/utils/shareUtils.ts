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

/**
 * Pre-load critical bold font weights so that iOS WebKit has them
 * available before the html-to-image canvas pass runs.
 * iOS Safari does NOT reliably resolve @font-face url() references
 * inside the foreignObject SVG used by html-to-image, so we force-load
 * the exact TTF files as FontFace objects and add them to the document's
 * font set.
 */
const ensureBoldFontsLoaded = async (): Promise<void> => {
  // Font weights needed by the result share card:
  //   700 = Montserrat-Bold  (font-bold)
  //   800 = Montserrat-ExtraBold
  //   900 = Montserrat-Black (font-black — the main weight used for numbers)
  const weights: Array<{ weight: string; url: string }> = [
    { weight: '700', url: '/fonts/Montserrat-Bold.ttf' },
    { weight: '800', url: '/fonts/Montserrat-ExtraBold.ttf' },
    { weight: '900', url: '/fonts/Montserrat-Black.ttf' },
  ];

  const loadPromises = weights.map(async ({ weight, url }) => {
    try {
      // Skip if already loaded
      const existing = [...document.fonts].find(
        (f) => f.family === 'Montserrat' && f.weight === weight && f.status === 'loaded'
      );
      if (existing) return;

      const font = new FontFace('Montserrat', `url(${url}) format('truetype')`, {
        weight,
        style: 'normal',
        display: 'block', // block instead of swap to guarantee font is used immediately
      });

      const loaded = await font.load();
      document.fonts.add(loaded);
    } catch {
      // non-fatal — proceed with whatever is available
    }
  });

  await Promise.all(loadPromises);

  // Final wait for the document FontFaceSet to settle
  try {
    await document.fonts.ready;
  } catch {
    // ignore
  }
};

/**
 * On iOS, html-to-image needs two rendering passes to pick up the
 * loaded fonts correctly.  The first pass warms up the SVG renderer;
 * the second pass produces the correct result.
 */
const captureWithFontFix = async (
  elem: HTMLElement,
  options: Parameters<typeof toJpeg>[1]
): Promise<string> => {
  if (isIOS()) {
    // Warm-up pass — discard result
    try {
      await toJpeg(elem, { ...options, cacheBust: true });
    } catch {
      // ignore warm-up errors
    }
    // Small delay so WebKit fully rasterises the fonts
    await new Promise((r) => setTimeout(r, 120));
  }
  // Real capture
  return toJpeg(elem, { ...options, cacheBust: true });
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
    // Step 1: Ensure the bold/black font weights are fully loaded before capture.
    // This is critical on iOS where @font-face swap fonts may not be ready.
    await ensureBoldFontsLoaded();

    // Step 2: Capture the element (with double-pass on iOS for correct font rendering)
    const dataUrl = await captureWithFontFix(targetElem, {
      quality: 0.95,
      backgroundColor: '#000000',
      pixelRatio: 2,
      includeQueryParams: true,
      filter: (node) => (node as HTMLElement).tagName !== 'INPUT',
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();

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
