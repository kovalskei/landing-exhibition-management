import jsPDF from 'jspdf';
import { ProgramData, Session } from './googleSheetsParser';

async function loadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('Failed to convert image:', url);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const HALL_H1_SIZE = 20;
const TIME_SIZE = 14;
const SPEAKER_SIZE = 12;
const ROLE_SIZE = 11;
const TITLE_SIZE = 12;
const DESC_SIZE = 11;

const META_FOOTER_COLOR = '#7A7A7A';
const BODY_COLOR = '#000000';
const SUBTLE_COLOR = '#1a1a1a';

export async function exportProgramToPdf(data: ProgramData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Добавляем шрифты для кириллицы
  doc.setFont('helvetica');

  // Функция для проверки и добавления новой страницы
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      addFooter(doc, data.meta);
      return true;
    }
    return false;
  };

  // Титульная страница
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(data.meta?.title || 'Программа мероприятия', contentWidth);
  doc.text(titleLines, pageWidth / 2, 60, { align: 'center' });
  
  y = 80;
  if (data.meta?.date) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Дата проведения: ${data.meta.date}`, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }
  
  if (data.meta?.venue) {
    doc.setFontSize(12);
    doc.text(data.meta.venue, pageWidth / 2, y, { align: 'center' });
  }

  addFooter(doc, data.meta);

  // Группируем сессии по залам
  const sessionsByHall = new Map<string, Session[]>();
  data.halls.forEach(hall => {
    const hallSessions = data.sessions
      .filter(s => s.hallId === hall.id)
      .sort((a, b) => {
        const toMin = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        return toMin(a.start) - toMin(b.start);
      });
    
    if (hallSessions.length > 0 || (hall.bullets && hall.bullets.length > 0)) {
      sessionsByHall.set(hall.name, hallSessions);
    }
  });

  // Рендерим каждый зал
  let firstHall = true;
  for (const [hallName, sessions] of sessionsByHall.entries()) {
    const hall = data.halls.find(h => h.name === hallName);
    
    if (!firstHall) {
      doc.addPage();
      y = margin;
      addFooter(doc, data.meta);
    }
    firstHall = false;

    // Заголовок зала
    doc.setFontSize(HALL_H1_SIZE);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BODY_COLOR);
    doc.text(hallName.toUpperCase(), margin, y);
    y += 10;

    // Буллеты зала (если есть)
    if (hall?.bullets && hall.bullets.length > 0) {
      doc.setFontSize(DESC_SIZE);
      doc.setFont('helvetica', 'normal');
      hall.bullets.forEach(bullet => {
        checkPageBreak(8);
        const bulletLines = doc.splitTextToSize(`• ${bullet}`, contentWidth);
        doc.text(bulletLines, margin, y);
        y += bulletLines.length * 5;
      });
      y += 5;
    }

    // Сессии
    for (let idx = 0; idx < sessions.length; idx++) {
      const session = sessions[idx];
      checkPageBreak(40);

      // Время
      doc.setFontSize(TIME_SIZE);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BODY_COLOR);
      const timeText = `${session.start}${session.end ? ' — ' + session.end : ''}`;
      doc.text(timeText, margin, y);
      y += 8;

      // Спикер + фото
      if (session.speaker) {
        const hasPhoto = session.photo && session.photo.startsWith('http');
        const photoSize = 20;
        const textStartX = hasPhoto ? margin + photoSize + 5 : margin;
        const availableWidth = hasPhoto ? contentWidth - photoSize - 5 : contentWidth;

        if (hasPhoto) {
          const photoBase64 = await loadImageAsBase64(session.photo!);
          if (photoBase64) {
            doc.addImage(photoBase64, 'JPEG', margin, y - 5, photoSize, photoSize);
          }
        }

        doc.setFontSize(SPEAKER_SIZE);
        doc.setFont('helvetica', 'bold');
        const speakerLines = doc.splitTextToSize(session.speaker, availableWidth);
        doc.text(speakerLines, textStartX, y);
        y += Math.max(speakerLines.length * 6, hasPhoto ? photoSize : 0);
      }

      // Роль
      if (session.role) {
        doc.setFontSize(ROLE_SIZE);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(SUBTLE_COLOR);
        const roleLines = doc.splitTextToSize(session.role, contentWidth);
        doc.text(roleLines, margin, y);
        y += roleLines.length * 5;
        doc.setTextColor(BODY_COLOR);
      }

      // Заголовок доклада
      if (session.title) {
        doc.setFontSize(TITLE_SIZE);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(session.title, contentWidth);
        doc.text(titleLines, margin, y);
        y += titleLines.length * 6;
      }

      // Описание
      if (session.desc) {
        doc.setFontSize(DESC_SIZE);
        doc.setFont('helvetica', 'normal');
        const descLines = session.desc.split('\n').filter(Boolean);
        descLines.forEach(line => {
          checkPageBreak(6);
          const isBullet = /^\s*-\s+/.test(line);
          const cleanLine = isBullet ? '• ' + line.replace(/^\s*-\s+/, '') : line;
          const wrappedLines = doc.splitTextToSize(cleanLine, contentWidth);
          doc.text(wrappedLines, margin, y);
          y += wrappedLines.length * 5;
        });
      }

      // Разделитель между сессиями
      if (idx < sessions.length - 1) {
        y += 5;
        checkPageBreak(5);
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      } else {
        y += 8;
      }
    }
  }

  // Сохраняем PDF
  doc.save('program.pdf');
}

export async function exportPlanToPdf(data: ProgramData, planSessionIds: Set<string>): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  doc.setFont('helvetica');

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      addFooter(doc, data.meta);
      return true;
    }
    return false;
  };

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize('Мой план посещения', contentWidth);
  doc.text(titleLines, pageWidth / 2, 60, { align: 'center' });
  
  y = 80;
  if (data.meta?.date) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Дата: ${data.meta.date}`, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  addFooter(doc, data.meta);

  const planSessions = data.sessions
    .filter(s => planSessionIds.has(s.id))
    .sort((a, b) => a.start.localeCompare(b.start));

  if (planSessions.length === 0) {
    doc.addPage();
    y = margin;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('План пуст', pageWidth / 2, y + 40, { align: 'center' });
    doc.save('my-plan.pdf');
    return;
  }

  doc.addPage();
  y = margin;
  addFooter(doc, data.meta);

  for (const session of planSessions) {
    const hallName = data.halls.find(h => h.id === session.hallId)?.name || `Зал ${session.hallId}`;
    
    checkPageBreak(40);

    doc.setFontSize(TIME_SIZE);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BODY_COLOR);
    doc.text(`${session.start} – ${session.end}`, margin, y);
    y += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(META_FOOTER_COLOR);
    doc.text(hallName, margin, y);
    y += 7;

    if (session.speaker) {
      const hasPhoto = session.photo && session.photo.startsWith('http');
      const photoSize = 20;
      const textStartX = hasPhoto ? margin + photoSize + 5 : margin;
      const availableWidth = hasPhoto ? contentWidth - photoSize - 5 : contentWidth;

      if (hasPhoto) {
        const photoBase64 = await loadImageAsBase64(session.photo!);
        if (photoBase64) {
          doc.addImage(photoBase64, 'JPEG', margin, y - 5, photoSize, photoSize);
        }
      }

      checkPageBreak(10);
      doc.setFontSize(SPEAKER_SIZE);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BODY_COLOR);
      const speakerLines = doc.splitTextToSize(session.speaker, availableWidth);
      doc.text(speakerLines, textStartX, y);
      y += Math.max(speakerLines.length * 6, hasPhoto ? photoSize : 0);
    }

    if (session.role) {
      checkPageBreak(8);
      doc.setFontSize(ROLE_SIZE);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(SUBTLE_COLOR);
      const roleLines = doc.splitTextToSize(session.role, contentWidth);
      doc.text(roleLines, margin, y);
      y += roleLines.length * 5;
    }

    if (session.title) {
      checkPageBreak(10);
      doc.setFontSize(TITLE_SIZE);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BODY_COLOR);
      const titleLines = doc.splitTextToSize(session.title, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 5.5;
    }

    if (session.desc) {
      checkPageBreak(10);
      doc.setFontSize(DESC_SIZE);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BODY_COLOR);
      const descLines = session.desc.split('\n');
      descLines.forEach(line => {
        checkPageBreak(5);
        const isBullet = /^\s*-\s+/.test(line);
        const cleanLine = isBullet ? '• ' + line.replace(/^\s*-\s+/, '') : line;
        const wrappedLines = doc.splitTextToSize(cleanLine, contentWidth);
        doc.text(wrappedLines, margin, y);
        y += wrappedLines.length * 5;
      });
    }

    if (idx < planSessions.length - 1) {
      y += 5;
      checkPageBreak(5);
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    } else {
      y += 8;
    }
  });

  doc.save('my-plan.pdf');
}

function addFooter(doc: jsPDF, meta?: { date?: string; venue?: string }) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(META_FOOTER_COLOR);

  const footerParts: string[] = [];
  if (meta?.date) footerParts.push(`Дата проведения: ${meta.date}`);
  if (meta?.venue) footerParts.push(meta.venue.replace(/\n+/g, ' · '));

  if (footerParts.length > 0) {
    doc.text(footerParts.join(' • '), margin, pageHeight - 10);
  }
}