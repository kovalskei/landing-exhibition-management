import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function preloadImages() {
  const images = document.querySelectorAll('img[crossOrigin]');
  const promises = Array.from(images).map((img: any) => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve(true);
      } else {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      }
    });
  });
  await Promise.all(promises);
}

export async function exportSiteToPdf() {
  await preloadImages();
  
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
      logging: true,
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

  pdf.save('presentation.pdf');
}