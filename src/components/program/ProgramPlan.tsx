import React from 'react';
import { Session, getTagCanonMap } from '@/utils/googleSheetsParser';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ProgramPlanProps {
  plan: Session[];
  theme: 'light' | 'dark';
  generatingPlanPdf: boolean;
  onClearPlan: () => void;
  onDownloadPlanPdf: () => void;
  onRemoveFromPlan: (id: string) => void;
}

function toMin(hhmm: string): number {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  return m ? (+m[1] * 60 + +m[2]) : NaN;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export default function ProgramPlan({
  plan,
  theme,
  generatingPlanPdf,
  onClearPlan,
  onDownloadPlanPdf,
  onRemoveFromPlan
}: ProgramPlanProps) {
  const tagMap = getTagCanonMap();
  const sorted = [...plan].sort((a, b) => toMin(a.start) - toMin(b.start) || a.hall.localeCompare(b.hall));
  
  console.log('🗓️ План сессий с датами:', sorted.map(s => ({
    date: s.date,
    time: s.start,
    hall: s.hall,
    title: s.title?.substring(0, 30)
  })));

  return (
    <aside className="sticky top-24 h-[calc(100vh-120px)] overflow-auto border border-[var(--line)] rounded-lg bg-[var(--panel)] p-4">
      <style>{`
        .plan-button {
          background: var(--button-bg);
          border: 1px solid var(--button-border);
          color: var(--button-text);
        }
        .plan-button:hover:not(:disabled) {
          background: var(--button-hover);
        }
      `}</style>
      
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold">Мой план</div>
        <div className="flex gap-2">
          <Button
            onClick={onDownloadPlanPdf}
            disabled={generatingPlanPdf || plan.length === 0}
            variant="outline"
            size="sm"
            className="plan-button"
          >
            <Icon name={generatingPlanPdf ? 'Loader2' : 'FileDown'} size={14} className={generatingPlanPdf ? 'animate-spin' : ''} />
          </Button>
          <Button
            onClick={onClearPlan}
            variant="outline"
            size="sm"
            className="plan-button"
          >
            Очистить
          </Button>
        </div>
      </div>

      {plan.length === 0 ? (
        <div className="text-sm text-[var(--muted)] text-center py-8">
          Пусто. Добавьте доклады из расписания.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((session, i) => {
            const prev = sorted[i - 1];
            const notes = [];
            const isDayChange = prev && prev.date !== session.date;

            if (prev) {
              const sameDay = prev.date === session.date;
              
              if (sameDay && prev.hall !== session.hall) {
                notes.push(
                  <span key="switch" className="text-orange-500">
                    смена зала: {prev.hall} → {session.hall}
                  </span>
                );
              }
              if (sameDay && toMin(prev.end) > toMin(session.start)) {
                notes.push(
                  <span key="conflict" className="text-red-500">
                    пересечение по времени
                  </span>
                );
              }
            }

            return (
              <React.Fragment key={session.id}>
                {isDayChange && session.date && (
                  <div className="text-xs font-semibold text-[var(--muted)] pt-4 pb-2 border-t border-[var(--line)]">
                    {session.date}
                  </div>
                )}
                <div className="border border-[var(--line)] rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold">
                    {session.start} — {session.end} · {session.hall}
                  </div>
                </div>

                {notes.length > 0 && (
                  <div className="text-xs flex flex-wrap gap-2">
                    {notes}
                  </div>
                )}

                {session.tagsCanon && session.tagsCanon.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {session.tagsCanon.map(c => {
                      const h = hashStr(c) % 360;
                      const isLight = theme === 'light';
                      const bg = `hsl(${h}, 65%, ${isLight ? 85 : 30}%)`;
                      const bd = `hsl(${h}, 65%, ${isLight ? 75 : 38}%)`;
                      
                      return (
                        <span
                          key={c}
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{ background: bg, borderColor: bd, border: '1px solid' }}
                        >
                          {tagMap[c] || c}
                        </span>
                      );
                    })}
                  </div>
                )}

                {session.speaker && (
                  <div className="font-semibold text-sm">{session.speaker}</div>
                )}

                {session.role && (
                  <div className="text-xs text-[var(--muted)]">{session.role}</div>
                )}

                {session.title && (
                  <div className="font-medium text-sm">{session.title}</div>
                )}

                {session.desc && (
                  <div className="text-xs text-[var(--muted)] line-clamp-3">
                    {session.desc}
                  </div>
                )}

                <Button
                  onClick={() => onRemoveFromPlan(session.id)}
                  variant="outline"
                  size="sm"
                  className="w-full plan-button"
                >
                  Убрать
                </Button>
              </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </aside>
  );
}