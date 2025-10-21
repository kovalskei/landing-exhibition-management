import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      width: slideWidth,
      height: slideHeight,
      windowWidth: slideWidth,
      windowHeight: slideHeight,
      onclone: (clonedDoc) => {
        const images = clonedDoc.querySelectorAll('img[crossOrigin]');
        images.forEach((img: any) => {
          img.removeAttribute('crossOrigin');
        });
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.7);

    if (sectionId !== 'hero') {
      pdf.addPage();
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, slideWidth, slideHeight, undefined, 'FAST');
  }

  pdf.save('presentation.pdf');
}