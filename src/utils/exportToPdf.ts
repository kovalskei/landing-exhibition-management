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

  window.scrollTo(0, 0);
  
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '0';
  tempContainer.style.left = '0';
  tempContainer.style.width = `${slideWidth}px`;
  tempContainer.style.height = `${slideHeight}px`;
  tempContainer.style.overflow = 'hidden';
  tempContainer.style.zIndex = '-9999';
  tempContainer.style.backgroundColor = '#0a0a0f';
  document.body.appendChild(tempContainer);

  let isFirstPage = true;

  for (const sectionId of sections) {
    const element = document.getElementById(sectionId);
    if (!element) continue;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = `${slideWidth}px`;
    clone.style.height = `${slideHeight}px`;
    clone.style.minHeight = `${slideHeight}px`;
    clone.style.position = 'relative';
    clone.style.overflow = 'hidden';
    
    console.log(`Processing section: ${sectionId}`);
    
    const allElements = clone.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i] as HTMLElement;
      const computedStyle = window.getComputedStyle(element.getElementsByTagName('*')[i]);
      
      if (computedStyle.backgroundImage && computedStyle.backgroundImage.includes('noiseFilter')) {
        console.log(`Found noise filter in ${sectionId}, opacity: ${computedStyle.opacity}`);
        el.style.removeProperty('background-image');
      }
    }

    tempContainer.innerHTML = '';
    tempContainer.appendChild(clone);

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0f',
      logging: false,
      width: slideWidth,
      height: slideHeight,
      windowWidth: slideWidth,
      windowHeight: slideHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85);

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    pdf.addImage(imgData, 'JPEG', 0, 0, slideWidth, slideHeight, undefined, 'FAST');
  }

  document.body.removeChild(tempContainer);
  
  pdf.save('presentation.pdf');
}
