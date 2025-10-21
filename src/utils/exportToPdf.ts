import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

async function preloadImages(element: HTMLElement) {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(async (img) => {
    const originalSrc = img.src;
    try {
      const base64 = await loadImageAsBase64(originalSrc);
      img.src = base64;
    } catch (e) {
      console.warn('Failed to load image:', originalSrc);
    }
  });
  await Promise.all(promises);
}

export async function exportSiteToPdf() {
  const sections = [
    'hero',
    'about',
    'audience',
    'exponent',
    'conference',
    'participants',
    'contact'
  ];

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080],
    compress: true
  });

  let isFirstPage = true;

  for (const sectionId of sections) {
    const element = document.getElementById(sectionId);
    if (!element) continue;

    await preloadImages(element);

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0f',
      width: 1920,
      height: 1080,
      windowWidth: 1920,
      windowHeight: 1080
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.7);

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080, undefined, 'FAST');
  }

  pdf.save('presentation.pdf');
}