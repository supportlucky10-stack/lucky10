import { toBlob } from 'html-to-image';

export interface ShareElementOptions {
  elementId?: string;
  element?: HTMLElement | null;
  fileName?: string;
  title?: string;
  textSummary?: string;
}

/**
 * Captures an HTML element as a crisp image and shares it via Web Share API or triggers download + WhatsApp.
 */
export const captureAndShareElement = async ({
  elementId,
  element,
  fileName = 'share_image.jpg',
  textSummary = '',
}: ShareElementOptions): Promise<void> => {
  const targetElem = element || (elementId ? document.getElementById(elementId) : null);

  if (!targetElem) {
    const fallbackUrl = textSummary
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(textSummary)}`
      : `https://api.whatsapp.com/send`;
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

    const blob = await toBlob(targetElem, {
      quality: 0.95,
      backgroundColor: '#000000',
      pixelRatio: 2,
      cacheBust: true,
    });

    if (!blob) {
      const fallbackUrl = textSummary
        ? `https://api.whatsapp.com/send?text=${encodeURIComponent(textSummary)}`
        : `https://api.whatsapp.com/send`;
      window.open(fallbackUrl, '_blank');
      return;
    }

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
          // Strictly share image file only (no text captions)
          await navigator.share({
            files: [file],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
          // Retry with empty title if browser requires it
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

    // 2. Fallback for desktop browsers / environments without direct file share support:
    // Trigger download of JPG screenshot image & open WhatsApp
    const link = document.createElement('a');
    link.download = jpgFileName;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 5000);

    const waUrl = `https://api.whatsapp.com/send`;
    window.open(waUrl, '_blank');
  } catch (err) {
    console.error('Failed to capture screen element image:', err);
    const fallbackUrl = textSummary
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(textSummary)}`
      : `https://api.whatsapp.com/send`;
    window.open(fallbackUrl, '_blank');
  }
};
