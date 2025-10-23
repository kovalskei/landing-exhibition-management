import { ProgramData, Session } from '@/utils/googleSheetsParser';
import SessionCard from './SessionCard';

interface ProgramGridProps {
  data: ProgramData;
  filteredSessions: Session[];
  theme: 'light' | 'dark';
  onAddToPlan: (session: Session) => void;
}

function toMin(hhmm: string): number {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  return m ? (+m[1] * 60 + +m[2]) : NaN;
}

export default function ProgramGrid({ data, filteredSessions, theme, onAddToPlan }: ProgramGridProps) {
  if (!data || !filteredSessions.length) {
    return (
      <div className="p-12 text-center text-[var(--muted)]">
        Нет данных для отображения
      </div>
    );
  }

  const slots = [...new Set(filteredSessions.map(s => s.start))].sort((a, b) => toMin(a) - toMin(b));
  const byHall: Record<string, Session[]> = {};
  
  data.halls.forEach(h => byHall[h.name] = []);
  filteredSessions.forEach(s => {
    if (byHall[s.hall]) byHall[s.hall].push(s);
  });

  for (const h in byHall) {
    byHall[h].sort((a, b) => toMin(a.start) - toMin(b.start));
  }

  const covered: Record<string, boolean> = {};
  const key = (r: number, c: number) => `${r}|${c}`;

  return (
    <div className="overflow-auto">
      <table className="w-full border-separate border-spacing-0">
        <colgroup>
          <col style={{ width: '96px' }} />
          {data.halls.map((_, i) => <col key={i} />)}
        </colgroup>
        <thead>
          <tr>
            <th className="sticky top-0 bg-[var(--panel)] border-b border-r border-[var(--line)] p-3 text-left font-bold z-10">
              Время
            </th>
            {data.halls.map(h => (
              <th key={h.id} className="sticky top-0 bg-[var(--panel)] border-b border-r border-[var(--line)] p-3 text-left font-bold z-10">
                {h.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, rowIndex) => (
            <tr key={slot}>
              <td className="border-b border-r border-[var(--line)] p-3 align-top">
                <span className="text-sm font-medium">{slot}</span>
              </td>
              {data.halls.map((hall, colIndex) => {
                if (covered[key(rowIndex, colIndex)]) return null;

                const list = byHall[hall.name] || [];
                const session = list.find(s => s.start === slot);
                
                if (!session) {
                  return (
                    <td key={hall.id} className="border-b border-r border-[var(--line)] p-3 align-top"></td>
                  );
                }

                const starts = list.map(s => s.start);
                const sessionIndex = starts.indexOf(session.start);
                let boundary = toMin(session.end);
                
                if (sessionIndex >= 0 && sessionIndex < starts.length - 1) {
                  const nextStart = toMin(starts[sessionIndex + 1]);
                  if (isFinite(nextStart) && nextStart < boundary) {
                    boundary = nextStart;
                  }
                }

                let span = 1;
                for (let t = rowIndex + 1; t < slots.length; t++) {
                  if (toMin(slots[t]) >= boundary) break;
                  span++;
                }

                for (let t = 1; t < span; t++) {
                  covered[key(rowIndex + t, colIndex)] = true;
                }

                return (
                  <td 
                    key={hall.id} 
                    rowSpan={span}
                    className="border-b border-r border-[var(--line)] p-3 align-top"
                  >
                    <div className="bg-[var(--chip)] rounded-lg p-3">
                      <SessionCard session={session} theme={theme} onAddToPlan={onAddToPlan} />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}