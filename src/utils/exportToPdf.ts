import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
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
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = 297;
  const pdfHeight = 210;

  let isFirstPage = true;

  for (const sectionId of sections) {
    const element = document.getElementById(sectionId);
    if (!element) continue;

    const images = element.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(async (img) => {
        if (img.src && !img.complete) {
          await loadImage(img.src);
        }
      })
    );

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: true,
      imageTimeout: 15000,
      removeContainer: true,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(sectionId);
        if (clonedElement) {
          const noiseElements = clonedElement.querySelectorAll('[style*="noiseFilter"]');
          noiseElements.forEach((el) => {
            (el as HTMLElement).style.opacity = '0';
          });
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85);

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'MEDIUM');
  }

  pdf.save('presentation.pdf');
}