import { useState, useEffect, useRef } from 'react';

interface Hall {
  id: string;
  name: string;
}

interface Session {
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

interface ProgramData {
  title: string;
  halls: Hall[];
  sessions: Session[];
  now: string;
}

const mockData = (): ProgramData => ({
  title: 'HUMAN — Обучение',
  now: '10:00',
  halls: [
    { id: 'A', name: 'ПАЛЬМИРА I' },
    { id: 'B', name: 'ПАЛЬМИРА II' },
    { id: 'C', name: 'ПАЛЬМИРА III' },
    { id: 'D', name: 'МАСТЕРМАЙНДЫ' },
    { id: 'E', name: 'GPT-КОМНАТА' }
  ],
  sessions: [
    { id: 'A-1', hallId: 'A', hall: 'ПАЛЬМИРА I', start: '10:00', end: '10:45', title: 'Введение в AI и машинное обучение', speaker: 'Иван Иванов', role: 'CEO', desc: 'Подробное описание доклада о введении в искусственный интеллект' },
    { id: 'B-1', hallId: 'B', hall: 'ПАЛЬМИРА II', start: '10:00', end: '10:40', title: 'Практика применения нейросетей', speaker: 'Мария Петрова', role: 'CTO', desc: 'Реальные кейсы внедрения' },
    { id: 'C-1', hallId: 'C', hall: 'ПАЛЬМИРА III', start: '10:00', end: '10:30', title: 'Метрики эффективности команд', speaker: 'Алексей Смирнов', role: 'Head of HR', desc: 'Обсуждение ключевых метрик' },
    { id: 'D-1', hallId: 'D', hall: 'МАСТЕРМАЙНДЫ', start: '10:00', end: '10:30', title: 'AI в бизнесе', speaker: 'Ольга Коваленко', role: 'Product Manager', desc: 'Как AI меняет бизнес' },
    { id: 'E-1', hallId: 'E', hall: 'GPT-КОМНАТА', start: '10:00', end: '10:45', title: 'ChatGPT для разработчиков', speaker: 'Дмитрий Сидоров', role: 'Senior Developer', desc: 'Практические советы' },
    { id: 'A-2', hallId: 'A', hall: 'ПАЛЬМИРА I', start: '11:00', end: '11:45', title: 'UX/UI дизайн будущего', speaker: 'Алексей Смирнов', role: 'Lead Designer', desc: 'Тренды и прогнозы' },
    { id: 'B-2', hallId: 'B', hall: 'ПАЛЬМИРА II', start: '11:00', end: '11:30', title: 'Agile трансформация', speaker: 'Екатерина Волкова', role: 'Agile Coach', desc: '' },
    { id: 'C-2', hallId: 'C', hall: 'ПАЛЬМИРА III', start: '11:00', end: '11:45', title: 'Тестирование и QA', speaker: 'Николай Морозов', role: 'QA Lead', desc: 'Подходы к тестированию' },
    { id: 'D-2', hallId: 'D', hall: 'МАСТЕРМАЙНДЫ', start: '11:00', end: '11:30', title: 'Networking секреты', speaker: '', role: '', desc: 'Как правильно знакомиться' },
    { id: 'A-3', hallId: 'A', hall: 'ПАЛЬМИРА I', start: '12:00', end: '12:45', title: 'Blockchain и Web3', speaker: 'Игорь Петренко', role: 'Blockchain Expert', desc: '' },
    { id: 'C-3', hallId: 'C', hall: 'ПАЛЬМИРА III', start: '12:00', end: '12:30', title: 'Кибербезопасность', speaker: 'Андрей Соколов', role: 'Security Officer', desc: 'Защита данных компании' },
  ]
});

export default function MobileProgram() {
  const [data, setData] = useState<ProgramData | null>(null);
  const [plan, setPlan] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'now' | 'all' | 'plan'>('now');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const loadedData = mockData();
    setData(loadedData);
    const times = [...new Set(loadedData.sessions.map(s => s.start))].sort();
    setSelectedTime(nearestSlot(times, loadedData.now));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('mobile-program-plan');
    if (saved) setPlan(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    localStorage.setItem('mobile-program-plan', JSON.stringify([...plan]));
  }, [plan]);

  const nearestSlot = (times: string[], now: string) => {
    for (const t of times) {
      if (t >= now) return t;
    }
    return times[0] || '';
  };

  const scrollToActiveChip = () => {
    if (!chipsRef.current) return;
    const active = chipsRef.current.querySelector('.chip-active');
    if (!active) return;
    const container = chipsRef.current;
    const left = (active as HTMLElement).offsetLeft - (container.clientWidth - (active as HTMLElement).offsetWidth) / 2;
    container.scrollTo({ left, behavior: 'smooth' });
  };

  const scrollToActiveTimeline = () => {
    if (!timelineRef.current || !data) return;
    const times = [...new Set(data.sessions.map(s => s.start))].sort();
    const idx = times.indexOf(selectedTime);
    if (idx === -1) return;
    timelineRef.current.scrollTo({ left: idx * timelineRef.current.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToActiveChip();
    scrollToActiveTimeline();
  }, [selectedTime]);

  const addToPlan = (id: string) => {
    setPlan(prev => new Set([...prev, id]));
  };

  const removeFromPlan = (id: string) => {
    setPlan(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const esc = (s: string | undefined) => s || '';

  const durationText = (s: Session) => {
    const [h1, m1] = s.start.split(':').map(Number);
    const [h2, m2] = s.end.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return isFinite(mins) ? `${mins} мин` : '';
  };

  const hallName = (hallId: string) => {
    const h = data?.halls.find(h => h.id === hallId);
    return h ? h.name : `Зал ${hallId}`;
  };

  const matchQuery = (sessions: Session[]) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(s => 
      (s.title + ' ' + (s.speaker || '') + ' ' + (s.desc || '')).toLowerCase().includes(q)
    );
  };

  const overlap = (a: Session, b: Session) => a.start < b.end && b.start < a.end;

  const jumpToNow = () => {
    if (!data) return;
    const times = [...new Set(data.sessions.map(s => s.start))].sort();
    setSelectedTime(nearestSlot(times, data.now));
  };

  if (!data) return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;

  const times = [...new Set(data.sessions.map(s => s.start))].sort();
  const filtered = matchQuery(data.sessions);

  return (
    <div className="mobile-program-app">
      <style>{`
        .mobile-program-app {
          --bg: #f8f9fc;
          --panel: #ffffff;
          --text: #1e293b;
          --muted: #64748b;
          --line: #e2e8f0;
          --accent: #3b82f6;
          --ok: #10b981;
          --err: #ef4444;
          --shadow: 0 10px 28px rgba(15,23,42,.1);
          --tap: 48px;
          --radius: 16px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          color: var(--text);
          font-family: system-ui, -apple-system, sans-serif;
        }
        .m-top {
          position: sticky;
          top: 0;
          z-index: 20;
          background: var(--bg);
          border-bottom: 1px solid var(--line);
          padding: 14px;
          backdrop-filter: blur(12px);
        }
        .m-title {
          margin: 0 0 12px;
          font-weight: 800;
          font-size: 22px;
          letter-spacing: -0.02em;
        }
        .m-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }
        .m-search {
          flex: 1;
          display: flex;
          align-items: center;
          height: var(--tap);
          padding: 0 14px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--panel);
        }
        .m-search input {
          flex: 1;
          background: transparent;
          border: 0;
          outline: 0;
          color: var(--text);
          font-size: 16px;
        }
        .m-pill {
          min-height: var(--tap);
          padding: 0 16px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--panel);
          font-weight: 600;
          cursor: pointer;
        }
        .m-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 10px 0 8px;
        }
        .m-tab {
          min-height: var(--tap);
          padding: 0 16px;
          font-weight: 700;
          font-size: 15px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: var(--panel);
          transition: all 0.15s;
          cursor: pointer;
        }
        .m-tab.active {
          background: var(--accent);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(59,130,246,.25);
        }
        .chips {
          display: flex;
          gap: 10px;
          padding: 10px 0 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .chips::-webkit-scrollbar { display: none; }
        .chip {
          flex: 0 0 auto;
          min-height: var(--tap);
          padding: 0 16px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--panel);
          font-weight: 700;
          font-size: 15px;
          transition: all 0.15s;
          cursor: pointer;
          white-space: nowrap;
        }
        .chip-active {
          background: var(--accent);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(59,130,246,.25);
        }
        .m-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-bottom: 12px;
        }
        .timeline-wrapper {
          flex: 1;
          overflow: hidden;
        }
        .timeline-container {
          display: flex;
          height: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .timeline-container::-webkit-scrollbar { display: none; }
        .time-slot {
          flex: 0 0 100%;
          scroll-snap-align: start;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .hall-card {
          border: 1px solid var(--line);
          background: var(--panel);
          border-radius: var(--radius);
          padding: 14px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .hall-name {
          font-size: 13px;
          color: var(--muted);
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .talk-title {
          font-weight: 800;
          font-size: 16px;
          line-height: 1.3;
          margin: 0;
        }
        .talk-meta {
          color: var(--muted);
          font-size: 14px;
          font-weight: 500;
        }
        .talk-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn {
          height: var(--tap);
          padding: 0 16px;
          font-weight: 700;
          font-size: 15px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--text);
          transition: all 0.15s;
          cursor: pointer;
        }
        .btn-primary {
          background: var(--accent);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(59,130,246,.25);
        }
        .empty-hall {
          color: var(--muted);
          font-size: 14px;
          font-style: italic;
        }
        .plan-view {
          flex: 1;
          overflow: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .badge {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid var(--line);
        }
        .badge-ok { border-color: var(--ok); color: var(--ok); background: rgba(16,185,129,0.1); }
        .badge-conflict { border-color: var(--err); color: var(--err); background: rgba(239,68,68,0.1); }
        .sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 40;
          max-height: 82vh;
          overflow: auto;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          background: var(--panel);
          box-shadow: 0 -20px 48px rgba(15,23,42,.18);
          padding: 20px;
          border: 1px solid var(--line);
        }
        .sheet-title {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 10px;
          line-height: 1.3;
        }
        .sheet-meta {
          color: var(--muted);
          margin: 8px 0;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .sheet-desc {
          white-space: pre-wrap;
          margin-top: 10px;
          line-height: 1.7;
          font-size: 15px;
        }
        .sheet-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
        .fab {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 60;
          height: 56px;
          min-width: 56px;
          padding: 0 18px;
          border: none;
          border-radius: 16px;
          background: var(--accent);
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 8px 24px rgba(59,130,246,.35);
          cursor: pointer;
        }
        .sheet-menu {
          position: fixed;
          inset: 0;
          z-index: 70;
          background: rgba(0,0,0,.4);
          backdrop-filter: blur(2px);
        }
        .sheet-panel {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--panel);
          border-top: 1px solid var(--line);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          box-shadow: 0 -20px 48px rgba(15,23,42,.18);
          padding: 16px;
        }
        .sheet-row {
          display: grid;
          gap: 10px;
        }
        .hide { display: none !important; }
      `}</style>

      <div className="m-top">
        <h1 className="m-title">{data.title}</h1>
        <div className="m-row">
          <div className="m-search">
            <input 
              placeholder="Поиск по темам и спикерам" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="m-pill" onClick={jumpToNow}>Сейчас</button>
        </div>
        <div className="m-tabs">
          <button className={`m-tab ${tab === 'now' ? 'active' : ''}`} onClick={() => setTab('now')}>Сейчас</button>
          <button className={`m-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>Всё</button>
          <button className={`m-tab ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>Мой план</button>
        </div>
        <div className="chips" ref={chipsRef}>
          {times.map(t => (
            <button 
              key={t} 
              className={`chip ${t === selectedTime ? 'chip-active' : ''}`}
              onClick={() => setSelectedTime(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="m-main">
        {tab === 'plan' ? (
          <div className="plan-view">
            {(() => {
              const list = data.sessions.filter(s => plan.has(s.id)).sort((a, b) => a.start.localeCompare(b.start));
              const conflicts = new Set<string>();
              for (let i = 0; i < list.length; i++) {
                for (let j = i + 1; j < list.length; j++) {
                  if (overlap(list[i], list[j])) {
                    conflicts.add(list[i].id);
                    conflicts.add(list[j].id);
                  }
                }
              }
              
              if (list.length === 0) {
                return <div className="hall-card">План пуст. Добавляйте доклады.</div>;
              }

              return list.map(s => {
                const bad = conflicts.has(s.id) ? 'conflict' : 'ok';
                return (
                  <div className="hall-card" key={s.id}>
                    <div className="talk-meta">{esc(s.start)}–{esc(s.end)} · {esc(hallName(s.hallId))}</div>
                    <div className="talk-title">{esc(s.title)}</div>
                    {s.speaker && <div className="talk-meta">{esc(s.speaker)}{s.role ? ` — ${esc(s.role)}` : ''}</div>}
                    <div className="talk-actions">
                      <span className={`badge badge-${bad}`}>{bad === 'ok' ? 'в плане' : 'конфликт по времени'}</span>
                      <button className="btn" onClick={() => removeFromPlan(s.id)}>Убрать</button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="timeline-wrapper">
            <div className="timeline-container" ref={timelineRef}>
              {times.map(time => (
                <div className="time-slot" key={time}>
                  {data.halls.map(hall => {
                    const session = filtered.find(s => s.start === time && s.hallId === hall.id);
                    if (!session) {
                      return (
                        <div className="hall-card" key={hall.id}>
                          <div className="hall-name">{esc(hall.name)}</div>
                          <div className="empty-hall">Нет выступления</div>
                        </div>
                      );
                    }

                    return (
                      <div className="hall-card" key={session.id}>
                        <div className="hall-name">{esc(hall.name)}</div>
                        <div className="talk-title">{esc(session.title)}</div>
                        {session.speaker && <div className="talk-meta">{esc(session.speaker)}{session.role ? ` — ${esc(session.role)}` : ''}</div>}
                        <div className="talk-meta">{esc(session.start)} — {esc(session.end)}{durationText(session) ? ` · ${durationText(session)}` : ''}</div>
                        <div className="talk-actions">
                          {plan.has(session.id) ? (
                            <button className="btn" onClick={() => removeFromPlan(session.id)}>В плане ✓</button>
                          ) : (
                            <button className="btn btn-primary" onClick={() => addToPlan(session.id)}>В план</button>
                          )}
                          <button className="btn" onClick={() => setSelectedSession(session)}>Подробнее</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="sheet">
          <div className="sheet-title">{esc(selectedSession.title)}</div>
          <div className="sheet-meta">{esc(hallName(selectedSession.hallId))} • {esc(selectedSession.start)}–{esc(selectedSession.end)}</div>
          {selectedSession.speaker && <div className="talk-meta">{esc(selectedSession.speaker)}{selectedSession.role ? ` — ${esc(selectedSession.role)}` : ''}</div>}
          <div className="sheet-desc">{esc(selectedSession.desc)}</div>
          <div className="sheet-actions">
            {plan.has(selectedSession.id) ? (
              <button className="btn" onClick={() => { removeFromPlan(selectedSession.id); setSelectedSession(null); }}>В плане ✓</button>
            ) : (
              <button className="btn btn-primary" onClick={() => { addToPlan(selectedSession.id); setSelectedSession(null); }}>В план</button>
            )}
            <button className="btn" onClick={() => setSelectedSession(null)}>Закрыть</button>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setShowMenu(true)}>Меню</button>

      {showMenu && (
        <div className="sheet-menu" onClick={() => setShowMenu(false)}>
          <div className="sheet-panel" onClick={e => e.stopPropagation()}>
            <div className="sheet-row">
              <button className="btn" onClick={() => { setTab('now'); setShowMenu(false); }}>Сейчас</button>
              <button className="btn" onClick={() => { setTab('all'); setShowMenu(false); }}>Всё</button>
              <button className="btn" onClick={() => { setTab('plan'); setShowMenu(false); }}>Мой план</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
