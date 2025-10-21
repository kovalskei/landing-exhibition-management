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

  let isFirstPage = true;

  for (const sectionId of sections) {
    const element = document.getElementById(sectionId);
    if (!element) continue;

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0f',
      logging: false,
      width: slideWidth,
      height: slideHeight,
      windowWidth: slideWidth,
      windowHeight: slideHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(sectionId);
        if (!clonedElement) return;

        clonedElement.style.width = `${slideWidth}px`;
        clonedElement.style.height = `${slideHeight}px`;
        clonedElement.style.minHeight = `${slideHeight}px`;
        clonedElement.style.overflow = 'hidden';
        clonedElement.style.position = 'relative';

        const allElements = clonedElement.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          const bgImage = el.style.backgroundImage;
          if (bgImage && bgImage.includes('noiseFilter')) {
            el.style.backgroundImage = 'none';
          }
          if (el.style.opacity && parseFloat(el.style.opacity) < 0.3) {
            const parent = el.parentElement;
            if (parent && parent.style.backgroundImage?.includes('noiseFilter')) {
              el.style.display = 'none';
            }
          }
        }
      }
    });

    const aspectRatio = canvas.width / canvas.height;
    const targetAspectRatio = slideWidth / slideHeight;

    let finalCanvas = canvas;
    if (Math.abs(aspectRatio - targetAspectRatio) > 0.01) {
      finalCanvas = document.createElement('canvas');
      finalCanvas.width = slideWidth;
      finalCanvas.height = slideHeight;
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, slideWidth, slideHeight);

        let drawWidth = slideWidth;
        let drawHeight = slideHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > targetAspectRatio) {
          drawHeight = slideWidth / aspectRatio;
          offsetY = (slideHeight - drawHeight) / 2;
        } else {
          drawWidth = slideHeight * aspectRatio;
          offsetX = (slideWidth - drawWidth) / 2;
        }

        ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);
      }
    }

    const imgData = finalCanvas.toDataURL('image/jpeg', 0.8);

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    pdf.addImage(imgData, 'JPEG', 0, 0, slideWidth, slideHeight, undefined, 'FAST');
  }

  pdf.save('presentation.pdf');
}