const SHEET_ID = '1HgPCnMmB0KuP080xWYjBlCPdvBy5AzQMeRVX_PUxca4';
const SHEET_NAME = 'Лист1';

export interface Hall {
  id: string;
  name: string;
  bullets?: string[];
}

export interface Session {
  id: string;
  hallId: string;
  hall: string;
  start: string;
  end: string;
  title: string;
  speaker?: string;
  role?: string;
  desc?: string;
  tags?: string[];
  tagsCanon?: string[];
}

export interface ProgramData {
  title: string;
  halls: Hall[];
  sessions: Session[];
  now: string;
  meta?: {
    title?: string;
    date?: string;
    venue?: string;
  };
}

const MIN_START_MIN = 9 * 60;

function normalizeTime(v: string): string {
  const s = String(v || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return '';
  const hh = +m[1];
  const mm = +m[2];
  const total = hh * 60 + mm;
  if (hh === 0 || total < MIN_START_MIN) return '';
  return hh + ':' + (mm < 10 ? '0' + mm : mm);
}

function toMin(hhmm: string): number {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  return m ? (+m[1] * 60 + +m[2]) : NaN;
}

function parseCell(raw: string): { title: string; speaker: string; role: string; desc: string; tags: string[] } {
  const lines = String(raw).split(/\n+/).map(x => x.trim()).filter(Boolean);
  const title = lines.shift() || '';
  let speaker = '', role = '';

  if (lines.length) {
    const t = lines[0];
    const m = t.match(/^(.+?)\s*[—-]\s*(.+)$/);
    if (m) {
      speaker = m[1].trim();
      role = m[2].trim();
      lines.shift();
    } else if (/^[A-ZА-ЯЁ][^,]+$/.test(t)) {
      speaker = t;
      lines.shift();
    }
  }

  const desc = lines.join('\n');
  const tags: string[] = [];
  
  return { title, speaker, role, desc, tags };
}

export async function fetchProgramData(): Promise<ProgramData> {
  try {
    // Используем публичный CSV экспорт
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    const rows = csvText.split('\n').map(row => {
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          cols.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current);
      return cols;
    });

    if (rows.length < 6) {
      throw new Error('Недостаточно данных в таблице');
    }

    const title = rows[0]?.[0] || 'Программа мероприятия';
    const date = rows[1]?.[0] || '';
    const venue = rows[2]?.[0] || '';

    const halls: Hall[] = [];
    const sessions: Session[] = [];
    const START_ROW = 5;
    const LOOK = Math.min(rows.length - START_ROW, 40);

    // Поиск троек столбцов (время начало, время конец, доклад)
    const C = rows[0].length;
    for (let c = 0; c <= C - 3;) {
      let hits = 0;
      for (let r = START_ROW; r < START_ROW + LOOK; r++) {
        const s = normalizeTime(rows[r]?.[c] || '');
        const e = normalizeTime(rows[r]?.[c + 1] || '');
        const t = String(rows[r]?.[c + 2] || '').trim();
        if (s && e && t) hits++;
      }

      if (hits >= 2) {
        const hallName = String(rows[0]?.[c + 2] || `Зал ${halls.length + 1}`).trim();
        const bullets = String(rows[1]?.[c + 2] || '').split('•').map(x => x.trim()).filter(Boolean);
        halls.push({ id: String(c), name: hallName, bullets });
        c += 3;
      } else {
        c += 1;
      }
    }

    // Парсинг докладов
    for (let h = 0; h < halls.length; h++) {
      const cs = parseInt(halls[h].id);
      const ce = cs + 1;
      const ct = cs + 2;

      for (let r2 = START_ROW; r2 < rows.length; r2++) {
        const s0 = normalizeTime(rows[r2]?.[cs] || '');
        const e0 = normalizeTime(rows[r2]?.[ce] || '');
        const raw0 = String(rows[r2]?.[ct] || '').trim();

        if (!s0 || !e0 || !raw0) continue;

        const parsed = parseCell(raw0);
        const sm = toMin(s0);
        const em = toMin(e0);
        if (!isFinite(sm) || !isFinite(em) || em <= sm) continue;

        sessions.push({
          id: halls[h].name + '|' + s0 + '|' + e0 + '|' + (parsed.title || raw0),
          hallId: halls[h].id,
          hall: halls[h].name,
          start: s0,
          end: e0,
          title: parsed.title || '',
          speaker: parsed.speaker || '',
          role: parsed.role || '',
          desc: parsed.desc || '',
          tags: parsed.tags,
          tagsCanon: []
        });
      }
    }

    sessions.sort((a, b) => toMin(a.start) - toMin(b.start) || a.hall.localeCompare(b.hall));

    const now = new Date();
    const nowTime = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

    return {
      title,
      halls,
      sessions,
      now: nowTime,
      meta: { title, date, venue }
    };
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    throw error;
  }
}