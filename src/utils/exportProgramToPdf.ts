import jsPDF from 'jspdf';
import { ProgramData, Session } from './googleSheetsParser';

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
  sessionsByHall.forEach((sessions, hallName) => {
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
    sessions.forEach((session, idx) => {
      checkPageBreak(40);

      // Время
      doc.setFontSize(TIME_SIZE);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BODY_COLOR);
      const timeText = `${session.start}${session.end ? ' — ' + session.end : ''}`;
      doc.text(timeText, margin, y);
      y += 8;

      // Спикер
      if (session.speaker) {
        doc.setFontSize(SPEAKER_SIZE);
        doc.setFont('helvetica', 'bold');
        const speakerLines = doc.splitTextToSize(session.speaker, contentWidth);
        doc.text(speakerLines, margin, y);
        y += speakerLines.length * 6;
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
    });
  });

  // Сохраняем PDF
  doc.save('program.pdf');
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
