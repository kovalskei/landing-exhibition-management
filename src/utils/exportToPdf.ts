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

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080]
  });

  let isFirstPage = true;

  for (const sectionId of sections) {
    const element = document.getElementById(sectionId);
    if (!element) continue;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0f',
      width: 1920,
      height: 1080,
      windowWidth: 1920,
      windowHeight: 1080
    });

    const imgData = canvas.toDataURL('image/png');

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
  }

  pdf.save('presentation.pdf');
}
