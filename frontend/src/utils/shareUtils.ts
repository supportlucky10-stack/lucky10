import { toJpeg } from 'html-to-image';

export interface ShareElementOptions {
  elementId?: string;
  element?: HTMLElement | null;
  fileName?: string;
  title?: string;
  textSummary?: string;
}

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
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const fallbackUrl = isMobile
      ? (textSummary ? `whatsapp://send?text=${encodeURIComponent(textSummary)}` : `whatsapp://send`)
      : (textSummary ? `https://web.whatsapp.com/send?text=${encodeURIComponent(textSummary)}` : `https://web.whatsapp.com`);
    window.open(fallbackUrl, '_blank');
    return;
  }

  try {
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (e) {
        // ignore font ready errors
      }
    }

    const dataUrl = await toJpeg(targetElem, {
      quality: 0.95,
      backgroundColor: '#000000',
      pixelRatio: 2,
      cacheBust: true,
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
