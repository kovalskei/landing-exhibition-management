import { ProgramData, Session } from '@/utils/googleSheetsParser';
import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface ProgramGridV2Props {
  data: ProgramData;
  filteredSessions: Session[];
  theme: 'light' | 'dark';
  onAddToPlan: (session: Session) => void;
  planSessionIds: Set<string>;
}

function toMin(hhmm: string): number {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  return m ? (+m[1] * 60 + +m[2]) : NaN;
}

const getHallColors = (theme: 'light' | 'dark') => {
  if (theme === 'light') {
    return [
      'from-blue-50 to-blue-100/50 border-blue-200',
      'from-purple-50 to-purple-100/50 border-purple-200',
      'from-green-50 to-green-100/50 border-green-200',
      'from-orange-50 to-orange-100/50 border-orange-200',
      'from-pink-50 to-pink-100/50 border-pink-200',
      'from-cyan-50 to-cyan-100/50 border-cyan-200',
    ];
  }
  return [
    'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    'from-green-500/10 to-green-600/5 border-green-500/20',
    'from-orange-500/10 to-orange-600/5 border-orange-500/20',
    'from-pink-500/10 to-pink-600/5 border-pink-500/20',
    'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
  ];
};

const HALL_ACCENTS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
];

export default function ProgramGridV2({ data, filteredSessions, theme, onAddToPlan, planSessionIds }: ProgramGridV2Props) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const HALL_COLORS = getHallColors(theme);

  if (!data || !filteredSessions.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--muted)]">
        <div className="text-center">
          <Icon name="CalendarX" size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  const byTime: Record<string, Session[]> = {};
  filteredSessions.forEach(s => {
    if (!byTime[s.start]) byTime[s.start] = [];
    byTime[s.start].push(s);
  });

  const timeSlots = Object.keys(byTime).sort((a, b) => toMin(a) - toMin(b));

  const toggleExpanded = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const hallColorIndex = (hallName: string) => {
    const index = data.halls.findIndex(h => h.name === hallName);
    return index % HALL_COLORS.length;
  };

  return (
    <div className="space-y-12 pb-16">
      {timeSlots.map(time => (
        <div key={time} className="relative">
          {/* Временная метка */}
          <div className="sticky top-[120px] z-30 -mx-4 px-4 py-3 mb-6 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--line)]">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-[var(--accent)] rounded-full" />
              <h2 className="text-2xl font-bold text-[var(--text)]">{time}</h2>
            </div>
          </div>

          {/* Сетка сессий */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {byTime[time].map(session => {
              const isExpanded = expandedSessions.has(session.id);
              const isInPlan = planSessionIds.has(session.id);
              const colorIndex = hallColorIndex(session.hall);
              const duration = toMin(session.end) - toMin(session.start);

              return (
                <div
                  key={session.id}
                  className={`
                    relative group rounded-xl border overflow-hidden
                    bg-gradient-to-br ${HALL_COLORS[colorIndex]}
                    transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
                    ${isInPlan ? 'ring-2 ring-[var(--accent)]' : ''}
                  `}
                >
                  {/* Цветовой акцент */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${HALL_ACCENTS[colorIndex]}`} />

                  <div className="p-5">
                    {/* Заголовок */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="MapPin" size={16} className="text-[var(--muted)]" />
                          <span className="text-sm font-medium text-[var(--muted)]">
                            {session.hall}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold leading-tight text-[var(--text)]">
                          {session.title || session.speaker}
                        </h3>
                      </div>
                      
                      <button
                        onClick={() => onAddToPlan(session)}
                        className={`
                          shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                          transition-all duration-200
                          ${isInPlan 
                            ? 'bg-[var(--accent)] text-white shadow-lg' 
                            : 'bg-[var(--panel)] hover:bg-[var(--chip)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]'
                          }
                        `}
                        title={isInPlan ? 'Удалить из плана' : 'Добавить в план'}
                      >
                        <Icon name={isInPlan ? 'Check' : 'Plus'} size={18} />
                      </button>
                    </div>

                    {/* Спикер */}
                    {session.speaker && session.title && (
                      <div className="flex items-start gap-2 mb-3">
                        <Icon name="User" size={16} className="text-[var(--muted)] mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-[var(--text)]">{session.speaker}</p>
                          {session.role && (
                            <p className="text-sm text-[var(--muted)]">{session.role}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Время */}
                    <div className="flex items-center gap-4 text-sm text-[var(--muted)] mb-3">
                      <div className="flex items-center gap-1.5">
                        <Icon name="Clock" size={14} />
                        <span>{session.start} — {session.end}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="Timer" size={14} />
                        <span>{duration} мин</span>
                      </div>
                    </div>

                    {/* Описание */}
                    {session.desc && (
                      <div className="relative">
                        <p 
                          className={`
                            text-sm text-[var(--muted)] leading-relaxed
                            ${isExpanded ? '' : 'line-clamp-2'}
                          `}
                        >
                          {session.desc}
                        </p>
                        {session.desc.length > 100 && (
                          <button
                            onClick={() => toggleExpanded(session.id)}
                            className="mt-2 text-sm font-medium text-[var(--accent)] hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                Свернуть <Icon name="ChevronUp" size={14} />
                              </>
                            ) : (
                              <>
                                Подробнее <Icon name="ChevronDown" size={14} />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Теги */}
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {session.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--chip)] text-[var(--text)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}