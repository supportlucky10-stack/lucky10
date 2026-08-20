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
  fileName = 'share_image.jpg',
  title = 'Share',
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
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(targetElem, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#000000',
      logging: false,
      allowTaint: true,
    });

    // Output snapshot image in JPG format (image/jpeg)
    canvas.toBlob(async (blob) => {
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
          await navigator.share({
            title: title,
            text: '', // Omit text caption as requested — image only!
            files: [file],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
        }
      }

      // Fallback for desktop browsers / environments without direct image share support:
      // Trigger download of JPG screenshot image and open WhatsApp
      const link = document.createElement('a');
      link.download = jpgFileName;
      link.href = URL.createObjectURL(blob);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 5000);

      // Open WhatsApp Web/Desktop without text caption
      const whatsappUrl = `https://api.whatsapp.com/send`;
      window.open(whatsappUrl, '_blank');
    }, 'image/jpeg', 0.95);
  } catch (err) {
    console.error('Failed to capture screen element image:', err);
    if (textSummary) {
      const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
      window.open(fallbackUrl, '_blank');
    }
  }
};
