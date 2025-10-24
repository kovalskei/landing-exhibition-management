const SHEET_ID = '1-W6lgnoQKfKhbeUgRBjnUVv7yf5hahdimJc1psEMpo0';
const META_SHEET_GID = '1494690392';

const DAY_SHEETS: { name: string; gid: string }[] = [
  { name: 'День 1', gid: '0' },
];

export interface Hall {
  id: string;
  name: string;
  bullets: string[];
}

export interface Session {
  id: string;
  hallId: string;
  hall: string;
  start: string;
  end: string;
  title: string;
  speaker: string;
  role: string;
  desc: string;
  tags: string[];
  tagsCanon: string[];
  photo?: string;
}

export interface ProgramData {
  title: string;
  halls: Hall[];
  sessions: Session[];
  now: string;
  meta: {
    title: string;
    subtitle: string;
    date: string;
    venue: string;
    logoId?: string;
    coverId?: string;
    logoUrl?: string;
    coverUrl?: string;
  };
}

const MIN_START_MIN = 9 * 60;
// Колонки G (6) и H (7) игнорируются при формировании имени зала (0-based индексы)
const EXCLUDED_HEADER_COLS: Record<number, boolean> = { 6: true, 7: true };

const TAG_CANON_MAP: Record<string, string> = {};

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

function canonicalTag(s: string): string {
  return String(s || '')
    .replace(/[{}\[\]()]/g, ' ')
    .replace(/[.,;:!?/\\|'"""''`~^]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\./g, '')
    .trim();
}

function prettyTagFromCanon(c: string): string {
  return c.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}

function parseTalk(text: string): {
  speaker: string;
  role: string;
  title: string;
  abstract: string;
  tagsCanon: string[];
} {
  const raw = String(text || '').replace(/\r/g, '').trim();
  const allLines = raw.split('\n');
  const head = allLines.shift() || '';

  const tagsRaw: string[] = [];
  const pullTags = (s: string) =>
    s.replace(/\{([^}]+)\}/g, (m, g) => {
      const t = String(g || '').trim();
      if (t) tagsRaw.push(t);
      return '';
    });

  const cleanHead = pullTags(head).trim();

  let title = '';
  const bodyLines = allLines.filter(line => {
    const m = line.match(/^\s*Тема\s*:\s*(.+)$/i);
    if (m) {
      title = m[1].trim();
      return false;
    }
    return true;
  });

  const out = { speaker: '', role: '', title, abstract: '' };

  const q = cleanHead.match(/[«"](.*?)[»"]/);
  if (q && !out.title) out.title = q[1].trim();

  const dashParts = cleanHead.split(/\s[—–-]\s/).map(x => x.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    const left = dashParts.shift()!;
    if (!out.title) out.title = dashParts.join(' — ');
    const p2 = left.split(/\s*,\s*/);
    out.speaker = p2.shift() || '';
    out.role = p2.join(', ');
  } else {
    const p = cleanHead.split(/\s*,\s*/);
    if (
      p.length >= 2 &&
      /директор|руковод|менеджер|основател|эксперт|инженер|профессор|доцент|автор/i.test(
        p.slice(1).join(', ')
      )
    ) {
      out.speaker = p.shift()!;
      out.role = p.join(', ');
    } else {
      const d = cleanHead.split(/\s[—–-]\s/);
      if (d.length === 2) {
        out.speaker = d[0];
        out.title = out.title || d[1];
      } else if (!out.title) {
        out.title = cleanHead;
      }
    }
  }

  const cleanBody = pullTags(bodyLines.join('\n')).trim();
  out.abstract = cleanBody;

  return {
    ...out,
    tagsCanon: (tagsRaw || []).map(canonicalTag).filter(Boolean)
  };
}

function smartMergeText(a: string, b: string): string {
  a = (a || '').trim();
  b = (b || '').trim();
  if (!a) return b;
  if (!b) return a;

  const na = normAll(a);
  const nb = normAll(b);
  if (nb.indexOf(na) === 0) return b;
  if (na.indexOf(nb) === 0) return a;

  const lines = [...splitLines(a), ...splitLines(b)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ln of lines) {
    const n = normLine(ln);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(ln);
  }
  return out.join('\n');
}

function splitLines(s: string): string[] {
  return String(s || '')
    .split(/\n+/)
    .map(x => x.replace(/^\s*[–—-]\s*/, '').trim())
    .filter(Boolean);
}

function normLine(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normAll(s: string): string {
  return splitLines(s).map(normLine).join(' ');
}

export async function fetchProgramData(customSheetId?: string): Promise<ProgramData> {
  try {
    const sheetId = customSheetId || SHEET_ID;
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Таблица не найдена. Проверьте ID таблицы.');
      }
      if (response.status === 403) {
        throw new Error(
          'Доступ запрещён. Откройте доступ к таблице: Настройки доступа → "Все, у кого есть ссылка"'
        );
      }
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }

    const csvText = await response.text();
    
    const metaFromSheet: Record<string, string> = {};
    
    if (META_SHEET_GID) {
      try {
        const metaUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${META_SHEET_GID}`;
        console.log('📋 Loading Meta sheet:', metaUrl);
        const metaResponse = await fetch(metaUrl, {
          method: 'GET',
          headers: { Accept: 'text/csv' }
        });
        
        if (metaResponse.ok) {
          const metaText = await metaResponse.text();
          
          const metaRows: string[][] = [];
          let metaCurrentRow: string[] = [];
          let metaCurrentCell = '';
          let metaInQuotes = false;
          
          for (let i = 0; i < metaText.length; i++) {
            const ch = metaText[i];
            
            if (ch === '"') {
              if (metaInQuotes && metaText[i + 1] === '"') {
                metaCurrentCell += '"';
                i++;
              } else {
                metaInQuotes = !metaInQuotes;
              }
            } else if (ch === ',' && !metaInQuotes) {
              metaCurrentRow.push(metaCurrentCell);
              metaCurrentCell = '';
            } else if ((ch === '\n' || ch === '\r') && !metaInQuotes) {
              if (ch === '\r' && metaText[i + 1] === '\n') i++;
              metaCurrentRow.push(metaCurrentCell);
              if (metaCurrentRow.some(c => c.trim())) {
                metaRows.push(metaCurrentRow);
              }
              metaCurrentRow = [];
              metaCurrentCell = '';
            } else {
              metaCurrentCell += ch;
            }
          }
          
          if (metaCurrentCell || metaCurrentRow.length > 0) {
            metaCurrentRow.push(metaCurrentCell);
            if (metaCurrentRow.some(c => c.trim())) {
              metaRows.push(metaCurrentRow);
            }
          }
          
          for (const row of metaRows) {
            if (row.length >= 2) {
              const key = row[0].trim().toLowerCase();
              const value = row.slice(1).join(',').trim();
              if (key && value) {
                metaFromSheet[key] = value;
              }
            }
          }
          console.log('✅ Meta data loaded:', metaFromSheet);
        }
      } catch (e) {
        console.warn('⚠️ Не удалось загрузить лист Meta:', e);
      }
    }

    // Правильный CSV-парсинг: обрабатываем кавычки и переносы строк внутри ячеек
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Экранированная кавычка внутри ячейки
          currentCell += '"';
          i++;
        } else {
          // Начало или конец quoted ячейки
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Разделитель колонок
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\n' && !inQuotes) {
        // Конец строки (если не внутри кавычек)
        currentRow.push(currentCell);
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else if (char === '\r') {
        // Пропускаем \r
        continue;
      } else {
        // Обычный символ (включая \n внутри кавычек)
        currentCell += char;
      }
    }
    
    // Добавляем последнюю ячейку и строку
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      if (currentRow.length > 0) rows.push(currentRow);
    }
    
    if (rows.length < 6) {
      throw new Error('Недостаточно данных в таблице');
    }

    const R = rows.length;
    const C = rows[0].length;
    // START_ROW = 5 соответствует строке 6 в Excel (строки 1-4 это meta, row 5 это заголовки времени)
    const START_ROW = 5;

    const halls: Hall[] = [];
    const sessions: Session[] = [];

    function headerName(c1: number, c2: number): string {
      let s = '';
      for (let c = c1; c <= c2 && c < C; c++) {
        if (EXCLUDED_HEADER_COLS[c]) continue;
        const v = String(rows[0][c] || '').trim();
        if (v) s += (s ? ' ' : '') + v;
      }
      return s.trim();
    }

    function hallBullets(c1: number, c2: number): string[] {
      let txt = '';
      for (let c = c1; c <= c2 && c < C; c++) {
        const v = String(rows[1][c] || '').trim();
        if (v) txt += (txt ? ' ' : '') + v;
      }
      return splitBullets(txt);
    }

    function splitBullets(s: string): string[] {
      s = String(s || '')
        .replace(/\r/g, '')
        .trim();
      if (!s) return [];
      if (s.includes('•')) return s.split('•').map(x => x.trim()).filter(Boolean);
      if (/\n/.test(s)) return s.split(/\n+/).map(x => x.trim()).filter(Boolean);
      const parts = s
        .split(/\s*[;|·]\s*|\s+[–—-]\s+/)
        .map(x => x.trim())
        .filter(Boolean);
      return parts.length ? parts : [s];
    }

    // Поиск троек столбцов (начало, конец, доклад) — динамическое определение залов
    // Используем ту же логику, что в оригинальном JS коде, но адаптируем для неполной таблицы
    for (let c = 0; c <= C - 3; ) {
      let hits = 0;
      
      // Проверяем, есть ли в этой тройке колонок доклады (время начала + конца + текст)
      for (let r = START_ROW; r < R; r++) {
        const s = normalizeTime(rows[r]?.[c] || '');
        const e = normalizeTime(rows[r]?.[c + 1] || '');
        const t = String(rows[r]?.[c + 2] || '').trim();
        if (s && e && t) hits++;
      }

      // Если найдено хотя бы 1 доклад (адаптация для неполной таблицы) — это зал
      if (hits >= 1) {
        const name = headerName(c, c + 2);
        const bullets = hallBullets(c, c + 2);
        if (name) {
          halls.push({ id: String(c), name, bullets });
        }
        c += 3;
      } else {
        c += 1;
      }
    }

    // Парсинг докладов
    let totalParsed = 0;
    let skipped = 0;
    for (let h = 0; h < halls.length; h++) {
      const cs = parseInt(halls[h].id);
      const ce = cs + 1;
      const ct = cs + 2;
      let hallCount = 0;

      for (let r2 = START_ROW; r2 < R; r2++) {
        const s0 = normalizeTime(rows[r2]?.[cs] || '');
        const e0 = normalizeTime(rows[r2]?.[ce] || '');
        let raw0 = String(rows[r2]?.[ct] || '').trim();
        const photoUrl = String(rows[r2]?.[ct + 1] || '').trim();

        // Пропускаем полностью пустые строки
        if (!s0 && !e0 && !raw0) continue;
        
        // Если нет времени начала/конца — строка не начинает новый доклад, пропускаем
        if (!s0 || !e0) {
          skipped++;
          continue;
        }
        
        // Есть время — это начало доклада. Проверяем, есть ли текст
        if (!raw0) {
          skipped++;
          continue;
        }

        // Собираем продолжения доклада из следующих строк (без времени, но с текстом)
        let nextRow = r2 + 1;
        let merged = 0;
        while (nextRow < R) {
          const nextStart = normalizeTime(rows[nextRow]?.[cs] || '');
          const nextEnd = normalizeTime(rows[nextRow]?.[ce] || '');
          const nextText = String(rows[nextRow]?.[ct] || '').trim();
          
          // Если следующая строка без времени, но с текстом — это продолжение текущего доклада
          if (!nextStart && !nextEnd && nextText) {
            raw0 += '\n' + nextText;
            merged++;
            nextRow++;
          } else {
            break;
          }
        }
        
        // Пропускаем обработанные строки-продолжения
        r2 = nextRow - 1;

        const parts = raw0.replace(/\r/g, '').split(/\n{2,}/);
        const header = (parts.shift() || '').trim();
        const rest = parts.join('\n\n').trim();

        const tagsRaw: string[] = [];
        const cleanHeader = header.replace(/\{([^}]+)\}/g, (m, g1) => {
          const t = String(g1 || '').trim();
          if (t) tagsRaw.push(t);
          return '';
        }).trim();
        const cleanRest = rest.replace(/\{([^}]+)\}/g, (m, g1) => {
          const t = String(g1 || '').trim();
          if (t) tagsRaw.push(t);
          return '';
        }).trim();

        const talk = parseTalk(cleanHeader);
        const desc = smartMergeText(talk.abstract, cleanRest);

        const tagsCanon: string[] = [];
        const tagsDisp: string[] = [];
        for (const tr of [...tagsRaw, ...talk.tagsCanon]) {
          const canon = canonicalTag(tr);
          if (!canon) continue;
          if (!TAG_CANON_MAP[canon]) TAG_CANON_MAP[canon] = prettyTagFromCanon(canon);
          if (!tagsCanon.includes(canon)) {
            tagsCanon.push(canon);
            tagsDisp.push(TAG_CANON_MAP[canon]);
          }
        }

        const sm = toMin(s0);
        const em = toMin(e0);
        if (!isFinite(sm) || !isFinite(em) || em <= sm) {
          if (!isFinite(sm) || !isFinite(em)) {
            console.log(`Пропуск (невалидное время) row ${r2} в ${halls[h].name}: "${s0}" → "${e0}"`);
          } else if (em <= sm) {
            console.log(`Пропуск (конец <= начала) row ${r2} в ${halls[h].name}: "${s0}" (${sm}мин) → "${e0}" (${em}мин)`);
          }
          continue;
        }
        
        hallCount++;
        totalParsed++;

        sessions.push({
          id: halls[h].name + '|' + s0 + '|' + e0 + '|' + (talk.title || cleanHeader || raw0),
          hallId: halls[h].id,
          hall: halls[h].name,
          start: s0,
          end: e0,
          title: talk.title || '',
          speaker: talk.speaker || '',
          role: talk.role || '',
          desc,
          tags: tagsDisp,
          tagsCanon,
          photo: photoUrl || undefined
        });
      }
    }

    sessions.sort((a, b) => toMin(a.start) - toMin(b.start) || a.hall.localeCompare(b.hall));

    const now = new Date();
    const nowTime = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

    const metaTitle = metaFromSheet['title'] || String(rows[0]?.[0] || 'Программа мероприятия').trim();
    const metaSubtitle = metaFromSheet['subtitle'] || String(rows[1]?.[0] || '').trim();
    const metaDate = metaFromSheet['date'] || String(rows[2]?.[0] || '').trim();
    const metaVenue = metaFromSheet['venue'] || String(rows[3]?.[0] || '').trim();
    const metaLogoId = metaFromSheet['logoid'] || '';
    const metaCoverId = metaFromSheet['coverid'] || '';
    
    return {
      title: metaTitle,
      halls,
      sessions,
      now: nowTime,
      meta: {
        title: metaTitle,
        subtitle: metaSubtitle,
        date: metaDate,
        venue: metaVenue,
        logoId: metaLogoId,
        coverId: metaCoverId
      }
    };
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    throw error;
  }
}

export function getTagCanonMap(): Record<string, string> {
  return TAG_CANON_MAP;
}

export function getDaySheets(): { name: string; gid: string }[] {
  return DAY_SHEETS;
}

export async function fetchProgramDataByGid(customSheetId: string | undefined, gid: string): Promise<ProgramData> {
  try {
    const sheetId = customSheetId || SHEET_ID;
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv'
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки листа: ${response.status}`);
    }

    const csvText = await response.text();
    
    const metaFromSheet: Record<string, string> = {};
    
    if (META_SHEET_GID) {
      try {
        const metaUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${META_SHEET_GID}`;
        const metaResponse = await fetch(metaUrl, {
          method: 'GET',
          headers: { Accept: 'text/csv' }
        });
        
        if (metaResponse.ok) {
          const metaText = await metaResponse.text();
          
          const metaRows: string[][] = [];
          let metaCurrentRow: string[] = [];
          let metaCurrentCell = '';
          let metaInQuotes = false;
          
          for (let i = 0; i < metaText.length; i++) {
            const ch = metaText[i];
            
            if (ch === '"') {
              if (metaInQuotes && metaText[i + 1] === '"') {
                metaCurrentCell += '"';
                i++;
              } else {
                metaInQuotes = !metaInQuotes;
              }
            } else if (ch === ',' && !metaInQuotes) {
              metaCurrentRow.push(metaCurrentCell);
              metaCurrentCell = '';
            } else if ((ch === '\n' || ch === '\r') && !metaInQuotes) {
              if (ch === '\r' && metaText[i + 1] === '\n') {
                i++;
              }
              metaCurrentRow.push(metaCurrentCell);
              if (metaCurrentRow.some(c => c.trim() !== '')) {
                metaRows.push(metaCurrentRow);
              }
              metaCurrentRow = [];
              metaCurrentCell = '';
            } else {
              metaCurrentCell += ch;
            }
          }
          
          if (metaCurrentCell || metaCurrentRow.length) {
            metaCurrentRow.push(metaCurrentCell);
            if (metaCurrentRow.some(c => c.trim() !== '')) {
              metaRows.push(metaCurrentRow);
            }
          }
          
          for (const row of metaRows) {
            if (row.length >= 2) {
              const key = String(row[0] || '').trim();
              const val = String(row[1] || '').trim();
              if (key && val) {
                metaFromSheet[key] = val;
              }
            }
          }
        }
      } catch (metaErr) {
        console.warn('Meta sheet not loaded:', metaErr);
      }
    }

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const ch = csvText[i];
      
      if (ch === '"') {
        if (inQuotes && csvText[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && csvText[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentCell);
        if (currentRow.some(c => c.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
    
    if (currentCell || currentRow.length) {
      currentRow.push(currentCell);
      if (currentRow.some(c => c.trim() !== '')) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) {
      throw new Error('Недостаточно данных в таблице');
    }

    const header = rows[0];
    const dataRows = rows.slice(1);

    const halls: Hall[] = [];
    const hallMap: Map<number, string> = new Map();

    for (let col = 2; col < header.length; col++) {
      if (EXCLUDED_HEADER_COLS[col]) continue;
      const hallName = String(header[col] || '').trim();
      if (!hallName) continue;
      
      let hallObj = halls.find(h => h.name === hallName);
      if (!hallObj) {
        hallObj = { id: `hall-${halls.length}`, name: hallName, bullets: [] };
        halls.push(hallObj);
      }
      hallMap.set(col, hallObj.id);
    }

    const sessions: Session[] = [];

    for (const row of dataRows) {
      const start = normalizeTime(row[0] || '');
      const end = normalizeTime(row[1] || '');
      if (!start) continue;

      for (let col = 2; col < row.length; col++) {
        if (EXCLUDED_HEADER_COLS[col]) continue;
        const cellContent = (row[col] || '').trim();
        if (!cellContent) continue;
        const hallId = hallMap.get(col);
        if (!hallId) continue;

        const hallObj = halls.find(h => h.id === hallId);
        if (!hallObj) continue;

        const existingSession = sessions.find(
          s => s.hallId === hallId && s.start === start
        );

        if (existingSession) {
          const ex = existingSession;
          const parsed = parseTalk(cellContent);
          
          ex.speaker = smartMergeText(ex.speaker, parsed.speaker);
          ex.role = smartMergeText(ex.role, parsed.role);
          ex.title = smartMergeText(ex.title, parsed.title);
          ex.desc = smartMergeText(ex.desc, parsed.abstract);
          
          const oldCanons = new Set(ex.tagsCanon || []);
          parsed.tagsCanon.forEach(c => oldCanons.add(c));
          ex.tagsCanon = Array.from(oldCanons);
          ex.tags = ex.tagsCanon.map(c => TAG_CANON_MAP[c] || prettyTagFromCanon(c));
        } else {
          const parsed = parseTalk(cellContent);
          parsed.tagsCanon.forEach(c => {
            if (!TAG_CANON_MAP[c]) {
              TAG_CANON_MAP[c] = prettyTagFromCanon(c);
            }
          });

          sessions.push({
            id: `${hallId}-${start}`,
            hallId,
            hall: hallObj.name,
            start,
            end: end || start,
            title: parsed.title,
            speaker: parsed.speaker,
            role: parsed.role,
            desc: parsed.abstract,
            tags: parsed.tagsCanon.map(c => TAG_CANON_MAP[c] || prettyTagFromCanon(c)),
            tagsCanon: parsed.tagsCanon
          });
        }
      }
    }

    const now = new Date();
    const nowStr = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

    const metaTitle = metaFromSheet['Название мероприятия'] || metaFromSheet['title'] || 'Программа мероприятия';
    const metaSubtitle = metaFromSheet['Подзаголовок'] || metaFromSheet['subtitle'] || '';
    const metaDate = metaFromSheet['Дата проведения'] || metaFromSheet['date'] || '';
    const metaVenue = metaFromSheet['Место проведения'] || metaFromSheet['venue'] || '';
    const metaLogoId = metaFromSheet['ID логотипа'] || metaFromSheet['logoId'] || '';
    const metaCoverId = metaFromSheet['ID обложки'] || metaFromSheet['coverId'] || '';

    return {
      title: metaTitle,
      halls,
      sessions,
      now: nowStr,
      meta: {
        title: metaTitle,
        subtitle: metaSubtitle,
        date: metaDate,
        venue: metaVenue,
        logoId: metaLogoId,
        coverId: metaCoverId
      }
    };
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    throw error;
  }
}