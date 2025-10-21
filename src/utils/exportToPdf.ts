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

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080]
  });

  let isFirst = true;

  for (const sectionId of sections) {
    const element = document.getElementById(sectionId);
    if (!element) continue;

    if (!isFirst) {
      pdf.addPage();
    }
    isFirst = false;

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      logging: false,
      width: 1920,
      height: 1080
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
  }

  pdf.save('presentation.pdf');
}
