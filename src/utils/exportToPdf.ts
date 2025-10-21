import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function convertImageToBase64(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject('Cannot get canvas context');
      return;
    }
    ctx.drawImage(img, 0, 0);
    try {
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataURL);
    } catch (e) {
      reject(e);
    }
  });
}

async function replaceImagesWithBase64() {
  const images = document.querySelectorAll('img[crossOrigin]') as NodeListOf<HTMLImageElement>;
  const originalSrcs: Map<HTMLImageElement, string> = new Map();
  
  for (const img of Array.from(images)) {
    try {
      originalSrcs.set(img, img.src);
      const base64 = await convertImageToBase64(img);
      img.src = base64;
      img.removeAttribute('crossOrigin');
    } catch (e) {
      console.error('Failed to convert image:', e);
    }
  }
  
  return originalSrcs;
}

function restoreOriginalImages(originalSrcs: Map<HTMLImageElement, string>) {
  originalSrcs.forEach((src, img) => {
    img.src = src;
    img.setAttribute('crossOrigin', 'anonymous');
  });
}

export async function exportSiteToPdf() {
  const originalSrcs = await replaceImagesWithBase64();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const sections = [
    'hero',
    'about',
    'audience',
    'exponent',
    'conference',
    'participants',
    'contact'
  ];

  const slideWidth = 1920;
  const slideHeight = 1080;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [slideWidth, slideHeight],
    compress: true
  });

  for (const sectionId of sections) {
    const element = document.getElementById(sectionId);
    if (!element) continue;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      width: slideWidth,
      height: slideHeight,
      windowWidth: slideWidth,
      windowHeight: slideHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.7);

    if (sectionId !== 'hero') {
      pdf.addPage();
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, slideWidth, slideHeight, undefined, 'FAST');
  }

  restoreOriginalImages(originalSrcs);
  pdf.save('presentation.pdf');
}