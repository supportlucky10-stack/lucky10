import html2canvas from 'html2canvas';

export interface ShareElementOptions {
  elementId?: string;
  element?: HTMLElement | null;
  fileName?: string;
  title?: string;
  textSummary?: string;
}

/**
 * Captures an HTML element as an image using html2canvas and shares it via Web Share API or triggers download.
 */
export const captureAndShareElement = async ({
  elementId,
  element,
  fileName = 'share_image.jpg',
  textSummary = '',
}: ShareElementOptions): Promise<void> => {
  const targetElem = element || (elementId ? document.getElementById(elementId) : null);

  if (!targetElem) {
    if (textSummary) {
      const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
      window.open(fallbackUrl, '_blank');
    }
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

    const canvas = await html2canvas(targetElem, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#000000',
      logging: false,
      allowTaint: true,
      onclone: (clonedDoc) => {
        const clonedTarget = elementId ? clonedDoc.getElementById(elementId) : null;
        if (clonedTarget) {
          clonedTarget.style.transform = 'none';
          clonedTarget.style.margin = '0 auto';
        }
      },
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
    });

    if (!blob) {
      if (textSummary) {
        const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
        window.open(fallbackUrl, '_blank');
      }
      return;
    }

    const jpgFileName = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
      ? fileName
      : fileName.replace(/\.[^/.]+$/, '') + '.jpg';

    const file = new File([blob], jpgFileName, { type: 'image/jpeg' });

    // Check if Web Share API supports file sharing (iOS Safari, Android Chrome/WebView)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        // Strictly share only image file — do not pass title or text so WhatsApp has no text caption
        await navigator.share({
          files: [file],
        });
        return;
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') return;
      }
    }

    // Fallback for desktop browsers / environments without direct image share support:
    // Trigger download of JPG screenshot image
    const link = document.createElement('a');
    link.download = jpgFileName;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 5000);
  } catch (err) {
    console.error('Failed to capture screen element image:', err);
    if (textSummary) {
      const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
      window.open(fallbackUrl, '_blank');
    }
  }
};
