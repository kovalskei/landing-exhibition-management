import { useState, useEffect, useRef } from 'react';
import { fetchProgramData, ProgramData, Session } from '@/utils/googleSheetsParser';
import { exportProgramToPdf } from '@/utils/exportProgramToPdf';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import MobileStyles from '@/components/mobile/MobileStyles';
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileTabs from '@/components/mobile/MobileTabs';
import MobileTimeChips from '@/components/mobile/MobileTimeChips';
import MobileSessionCard from '@/components/mobile/MobileSessionCard';
import MobileSessionModal from '@/components/mobile/MobileSessionModal';
import MobileMenu from '@/components/mobile/MobileMenu';

export default function MobileProgram() {
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'now' | 'all' | 'plan'>('now');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const programData = await fetchProgramData();
      setData(programData);
      
      // При первой загрузке устанавливаем время
      if (!silent) {
        const times = [...new Set(programData.sessions.map(s => s.start))].sort();
        setSelectedTime(nearestSlot(times, programData.now));
      }
    } catch (err) {
      if (!silent) {
        setError('Не удалось загрузить данные. Проверьте доступ к таблице.');
      }
      console.error('Ошибка загрузки данных:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true); // Тихое обновление фоном
    }, 30000);
    return () => clearInterval(interval);
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

  const scrollToTime = (time: string) => {
    console.log('scrollToTime вызван для:', time);
    if (!timelineRef.current) {
      console.log('timelineRef.current не найден');
      return;
    }
    
    const slot = timelineRef.current.querySelector(`[data-time="${time}"]`) as HTMLElement;
    console.log('Найден слот:', slot);
    
    if (slot) {
      const headerOffset = 140;
      const elementPosition = slot.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      console.log('Скроллим к позиции:', offsetPosition);
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      console.log('Слот не найден для времени:', time);
    }
  };

  useEffect(() => {
    if (!timelineRef.current || !data || tab !== 'now') return;

    let timeoutId: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const visibleEntries = entries.filter(e => e.isIntersecting && e.intersectionRatio > 0.3);
          if (visibleEntries.length > 0) {
            const topEntry = visibleEntries.reduce((top, curr) => 
              curr.boundingClientRect.top < top.boundingClientRect.top ? curr : top
            );
            const time = topEntry.target.getAttribute('data-time');
            if (time && time !== selectedTime) {
              setSelectedTime(time);
            }
          }
        }, 150);
      },
      {
        root: null,
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 0.3, 0.5, 0.7, 1]
      }
    );

    const slots = timelineRef.current.querySelectorAll('[data-time]');
    slots.forEach(slot => observer.observe(slot));

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [data, selectedTime, tab]);



  const handleTimeChipClick = (time: string) => {
    console.log('Клик по чипу:', time);
    setSelectedTime(time);
    setTimeout(() => scrollToTime(time), 100);
  };



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
    console.log('jumpToNow вызван');
    if (!data) {
      console.log('data не найдена');
      return;
    }
    const times = [...new Set(data.sessions.map(s => s.start))].sort();
    const nearest = nearestSlot(times, data.now);
    console.log('Ближайшее время:', nearest, 'Текущее:', data.now);
    setSelectedTime(nearest);
    setTimeout(() => scrollToTime(nearest), 100);
  };

  const handleExportPdf = async () => {
    if (!data) return;
    try {
      setExportingPdf(true);
      await exportProgramToPdf(data);
    } catch (err) {
      console.error('Ошибка экспорта PDF:', err);
      alert('Не удалось создать PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Загрузка программы...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="text-center max-w-md">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
      </div>
    </div>
  );

  if (!data) return null;

  const times = [...new Set(data.sessions.map(s => s.start))].sort();
  const filtered = matchQuery(data.sessions);

  const cssVars = theme === 'dark' 
    ? {
        '--bg': '#0f1115',
        '--panel': '#151922',
        '--text': '#e9edf3',
        '--muted': '#9aa3ad',
        '--line': '#242a36',
        '--accent': '#3b82f6',
        '--ok': '#10b981',
        '--err': '#ef4444',
        '--shadow': '0 10px 28px rgba(0,0,0,.3)'
      }
    : {
        '--bg': '#f3f6fb',
        '--panel': '#ffffff',
        '--text': '#1a2433',
        '--muted': '#475569',
        '--line': '#e6e8ee',
        '--accent': '#2563eb',
        '--ok': '#10b981',
        '--err': '#ef4444',
        '--shadow': '0 10px 28px rgba(15,23,42,.1)'
      };

  return (
    <div 
      className="mobile-program-app" 
      style={cssVars as React.CSSProperties}
    >
      <MobileStyles theme={theme} />

      <MobileHeader
        title={data.meta.title}
        date={data.meta.date}
        venue={data.meta.venue}
        onMenuToggle={() => setShowMenu(true)}
      />

      <div style={{ padding: '0 14px' }}>
        <MobileTabs
          activeTab={tab}
          planCount={plan.size}
          onTabChange={setTab}
        />

        {tab === 'now' && (
          <div className="now-banner">
            <div className="now-text">⏰ Сейчас: {data.now}</div>
            <button onClick={jumpToNow} className="now-btn">Перейти</button>
          </div>
        )}
      </div>

      {tab === 'now' && (
        <div className="sticky-time-chips">
          <div style={{ padding: '0 14px' }}>
            <MobileTimeChips
              times={times}
              selectedTime={selectedTime}
              onTimeSelect={handleTimeChipClick}
            />
          </div>
        </div>
      )}

      <div style={{ padding: '0 14px' }}>
        {tab === 'now' && (
          <div ref={timelineRef}>
            {times.map(slot => {
            const atSlot = filtered.filter(s => s.start === slot);
            const planList = data.sessions.filter(s => plan.has(s.id));

            return (
              <div key={slot} className="timeline-slot" data-time={slot}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  marginBottom: '12px',
                  color: 'var(--text)'
                }}>
                  {slot}
                </div>
                {atSlot.map(session => {
                  const inPlan = plan.has(session.id);
                  const hasConflict = inPlan ? false : planList.some(p => overlap(p, session));

                  return (
                    <MobileSessionCard
                      key={session.id}
                      session={session}
                      inPlan={inPlan}
                      hallName={hallName(session.hallId)}
                      duration={durationText(session)}
                      hasConflict={hasConflict}
                      onTogglePlan={() => inPlan ? removeFromPlan(session.id) : addToPlan(session.id)}
                      onClick={() => setSelectedSession(session)}
                    />
                  );
                })}
              </div>
            );
            })}
          </div>
        )}

        {tab === 'all' && (
          <div style={{ paddingTop: 14 }}>
            {filtered.map(session => {
              const inPlan = plan.has(session.id);
              const planList = data.sessions.filter(s => plan.has(s.id));
              const hasConflict = inPlan ? false : planList.some(p => overlap(p, session));

              return (
                <MobileSessionCard
                  key={session.id}
                  session={session}
                  inPlan={inPlan}
                  hallName={hallName(session.hallId)}
                  duration={durationText(session)}
                  hasConflict={hasConflict}
                  onTogglePlan={() => inPlan ? removeFromPlan(session.id) : addToPlan(session.id)}
                  onClick={() => setSelectedSession(session)}
                />
              );
            })}
          </div>
        )}

        {tab === 'plan' && (
          <>
            {plan.size === 0 ? (
              <div className="plan-empty">
                <div className="plan-empty-icon">📋</div>
                <div>Ваш план пуст</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Добавьте доклады из программы</div>
              </div>
            ) : (
              <>
                <button onClick={() => setPlan(new Set())} className="plan-clear">
                  Очистить план
                </button>
                <div style={{ paddingTop: 14 }}>
                  {data.sessions.filter(s => plan.has(s.id)).map(session => {
                    const planList = data.sessions.filter(s => plan.has(s.id));
                    const hasConflict = planList.some(p => p.id !== session.id && overlap(p, session));

                    return (
                      <MobileSessionCard
                        key={session.id}
                        session={session}
                        inPlan={true}
                        hallName={hallName(session.hallId)}
                        duration={durationText(session)}
                        hasConflict={hasConflict}
                        onTogglePlan={() => removeFromPlan(session.id)}
                        onClick={() => setSelectedSession(session)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {tab === 'now' && (
        <button onClick={jumpToNow} className="floating-now-btn">
          <Icon name="Clock" size={20} />
          <span>Сейчас</span>
        </button>
      )}

      {selectedSession && (
        <MobileSessionModal
          session={selectedSession}
          inPlan={plan.has(selectedSession.id)}
          hallName={hallName(selectedSession.hallId)}
          duration={durationText(selectedSession)}
          onClose={() => setSelectedSession(null)}
          onTogglePlan={() => {
            if (plan.has(selectedSession.id)) {
              removeFromPlan(selectedSession.id);
            } else {
              addToPlan(selectedSession.id);
            }
          }}
        />
      )}

      {showMenu && (
        <MobileMenu
          exportingPdf={exportingPdf}
          theme={theme}
          searchQuery={searchQuery}
          refreshing={refreshing}
          onClose={() => setShowMenu(false)}
          onExportPdf={handleExportPdf}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}