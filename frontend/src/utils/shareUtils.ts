import html2canvas from 'html2canvas';

export interface ShareElementOptions {
  elementId?: string;
  element?: HTMLElement | null;
  fileName?: string;
  title?: string;
  textSummary?: string;
}

/**
 * Captures an HTML element as an image using html2canvas and shares it via Web Share API or WhatsApp.
 */
export const captureAndShareElement = async ({
  elementId,
  element,
  fileName = 'share_image.png',
  title = 'Share',
  textSummary = '',
}: ShareElementOptions): Promise<void> => {
  const targetElem = element || (elementId ? document.getElementById(elementId) : null);

  if (!targetElem) {
    const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
    window.open(fallbackUrl, '_blank');
    return;
  }

  try {
    const canvas = await html2canvas(targetElem, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#000000',
      logging: false,
      allowTaint: true,
    });

    canvas.toBlob(async (blob) => {
      if (!blob) {
        const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
        window.open(fallbackUrl, '_blank');
        return;
      }

      const file = new File([blob], fileName, { type: 'image/png' });

      // Check if Web Share API supports file sharing (works on iOS Safari, Android Chrome/WebView)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: title,
            text: textSummary,
            files: [file],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
        }
      }

      // Fallback for desktop browsers / browsers without direct image share support:
      // Download the rendered PNG screenshot image and open WhatsApp
      const link = document.createElement('a');
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 5000);

      const whatsappText = `${textSummary}\n\n(Snapshot image saved to your downloads)`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, '_blank');
    }, 'image/png');
  } catch (err) {
    console.error('Failed to capture screen element image:', err);
    const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
    window.open(fallbackUrl, '_blank');
  }
};
