import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function compressImage(canvas: HTMLCanvasElement, quality: number = 0.7): string {
  return canvas.toDataURL('image/jpeg', quality);
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

    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0f',
      logging: false,
      imageTimeout: 0
    });

    const imgData = compressImage(canvas, 0.75);

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  const pdfBlob = pdf.output('blob');
  const sizeInMB = pdfBlob.size / (1024 * 1024);

  if (sizeInMB > 9) {
    console.warn(`PDF size: ${sizeInMB.toFixed(2)}MB, re-compressing...`);
    
    const recompressedPdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    isFirstPage = true;
    const lowerQuality = Math.max(0.5, 0.75 * (9 / sizeInMB));

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (!element) continue;

      const canvas = await html2canvas(element, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0f',
        logging: false
      });

      const imgData = compressImage(canvas, lowerQuality);

      if (!isFirstPage) {
        recompressedPdf.addPage();
      }
      isFirstPage = false;

      recompressedPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    recompressedPdf.save('presentation.pdf');
  } else {
    pdf.save('presentation.pdf');
  }
}