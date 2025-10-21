import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

    element.scrollIntoView();
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      width: slideWidth,
      height: slideHeight,
      windowWidth: slideWidth,
      windowHeight: slideHeight
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    if (sectionId !== 'hero') {
      pdf.addPage();
    }

    pdf.addImage(imgData, 'PNG', 0, 0, slideWidth, slideHeight, undefined, 'FAST');
  }

  window.scrollTo(0, 0);
  pdf.save('presentation.pdf');
}