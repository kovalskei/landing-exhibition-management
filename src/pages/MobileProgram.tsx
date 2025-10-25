import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProgramData, fetchProgramDataByGid, ProgramData, Session } from '@/utils/googleSheetsParser';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import MobileStyles from '@/components/mobile/MobileStyles';
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileTabs from '@/components/mobile/MobileTabs';
import MobileTimeChips from '@/components/mobile/MobileTimeChips';
import MobileSessionCard from '@/components/mobile/MobileSessionCard';
import MobileSessionModal from '@/components/mobile/MobileSessionModal';
import MobileMenu from '@/components/mobile/MobileMenu';
import MobileHallFilter from '@/components/mobile/MobileHallFilter';

export default function MobileProgram() {
  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');
  
  const [data, setData] = useState<ProgramData | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'now' | 'all' | 'plan'>('now');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHall, setSelectedHall] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);
  const [eventLogoUrl, setEventLogoUrl] = useState<string>('');
  const [eventCoverUrl, setEventCoverUrl] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('0');
  const [daySheets, setDaySheets] = useState<{ name: string; gid: string }[]>([]);

  useEffect(() => {
    const loadSheetId = async () => {
      if (!eventIdFromUrl) return;
      
      try {
        const response = await fetch(`https://functions.poehali.dev/1cac6452-8133-4b28-bd68-feb243859e2c?id=${eventIdFromUrl}`);
        const eventData = await response.json();
        
        if (eventData.sheetUrl) {
          const match = eventData.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          if (match) {
            setSheetId(match[1]);
          }
        }
        
        if (eventData.logoUrl) setEventLogoUrl(eventData.logoUrl);
        if (eventData.coverUrl) setEventCoverUrl(eventData.coverUrl);
        
        if (eventData.daySheets) {
          const lines = eventData.daySheets.split('\n').filter((l: string) => l.trim());
          const parsed = lines.map((line: string) => {
            const [name, gid] = line.split(':').map((s: string) => s.trim());
            return name && gid ? { name, gid } : null;
          }).filter(Boolean);
          
          if (parsed.length > 0) {
            setDaySheets(parsed);
            setSelectedDay(parsed[0].gid);
          }
        }
      } catch (err) {
        console.error('Failed to load event:', err);
      }
    };
    
    loadSheetId();
  }, [eventIdFromUrl]);

  const loadData = async (silent = false, dayGid?: string) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      console.log('🔍 Loading data with sheetId:', sheetId);
      const gidToLoad = dayGid || selectedDay;
      const programData = await fetchProgramDataByGid(sheetId || undefined, gidToLoad);
      console.log('✅ Data loaded:', programData.meta.title);
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
      await loadData(false, selectedDay);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDayChange = async (dayGid: string) => {
    setSelectedDay(dayGid);
    await loadData(false, dayGid);
  };

  useEffect(() => {
    if (!eventIdFromUrl || sheetId) {
      loadData();
    }
  }, [sheetId]);

  // Автообновление отключено - пользователь может обновить вручную через pull-to-refresh
  // (!на мобильной версии автообновление запрещено)

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
    console.log('🟢 scrollToTime вызван для:', time);
    const slot = document.querySelector(`[data-time="${time}"]`) as HTMLElement;
    console.log('🟡 Найден элемент:', slot);
    
    if (slot) {
      isScrollingProgrammatically.current = true;
      
      const appContainer = document.querySelector('.mobile-program-app') as HTMLElement;
      if (appContainer) {
        const yOffset = 200;
        const containerTop = appContainer.scrollTop;
        const slotTop = slot.offsetTop;
        const scrollPosition = slotTop - yOffset;
        
        console.log('🟠 Прокручиваю контейнер к позиции:', scrollPosition);
        appContainer.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      }
      
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 1000);
    } else {
      console.error('❌ Элемент с data-time не найден:', time);
    }
  };

  useEffect(() => {
    if (!data || tab !== 'now') return;

    let rafId: number | null = null;
    let lastUpdate = 0;

    const updateSelectedTime = () => {
      if (isScrollingProgrammatically.current) return;
      
      const now = Date.now();
      if (now - lastUpdate < 50) return;
      lastUpdate = now;
      
      const allSlots = Array.from(document.querySelectorAll('[data-time]'));
      const mapped = allSlots.map(slot => {
        const rect = slot.getBoundingClientRect();
        return { top: rect.top, time: slot.getAttribute('data-time') };
      });
      
      const headerBottom = 180;
      const slotsPassed = mapped.filter(s => s.top < headerBottom);
      
      if (slotsPassed.length > 0) {
        const currentSlot = slotsPassed[slotsPassed.length - 1];
        const time = currentSlot.time;
        if (time) {
          setSelectedTime(time);
        }
      } else if (mapped.length > 0) {
        const time = mapped[0].time;
        if (time) {
          setSelectedTime(time);
        }
      }
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateSelectedTime();
        rafId = null;
      });
    };

    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    updateSelectedTime();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [data, tab]);



  const handleTimeChipClick = (time: string) => {
    console.log('🔵 Клик по чипу времени:', time);
    setSelectedTime(time);
    scrollToTime(time);
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
    let result = sessions;
    
    if (q) {
      result = result.filter(s => 
        (s.title + ' ' + (s.speaker || '') + ' ' + (s.desc || '')).toLowerCase().includes(q)
      );
    }
    
    if (selectedHall !== 'all') {
      result = result.filter(s => s.hallId === selectedHall);
    }
    
    return result;
  };

  const overlap = (a: Session, b: Session) => a.start < b.end && b.start < a.end;

  const jumpToNow = () => {
    if (!data) return;
    const times = [...new Set(data.sessions.map(s => s.start))].sort();
    const nearest = nearestSlot(times, data.now);
    setSelectedTime(nearest);
    scrollToTime(nearest);
  };

  const handleSharePlan = async () => {
    if (!data || !eventIdFromUrl || plan.size === 0) return;
    
    try {
      const userId = localStorage.getItem('userId') || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
      
      const sessionIds = Array.from(plan);
      
      const response = await fetch('https://functions.poehali.dev/6ce5a94c-00ee-49fc-b106-0af8a1b0380f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventIdFromUrl,
          userId: userId,
          sessionIds: sessionIds
        })
      });
      
      if (!response.ok) {
        throw new Error('Не удалось сохранить план');
      }
      
      alert('✅ Ваш план успешно сохранён! Организаторы увидят статистику интереса к докладам.');
    } catch (error) {
      console.error('Ошибка при сохранении плана:', error);
      alert('❌ Не удалось сохранить план. Попробуйте позже.');
    }
  };

  const handleExportPdf = async () => {
    if (!data) return;
    try {
      setExportingPdf(true);
      
      const hallIntros: Record<string, string[]> = {};
      data.halls.forEach(h => {
        if (h.bullets && h.bullets.length) hallIntros[h.name] = h.bullets.slice();
      });

      const pdfData = {
        halls: data.halls.map(h => h.name),
        sessions: data.sessions.map(s => ({
          hall: s.hall,
          start: s.start,
          end: s.end,
          title: s.title || '',
          speaker: s.speaker || '',
          role: s.role || '',
          desc: s.desc || '',
          photo: s.photo || '',
          tagsCanon: (s.tagsCanon || []).slice()
        })),
        meta: {
          date: data.meta.date || '',
          title: data.meta.title || '',
          subtitle: data.meta.subtitle || '',
          venue: data.meta.venue || '',
          logoId: eventLogoUrl || data.meta.logoId || '',
          coverId: eventCoverUrl || data.meta.coverId || ''
        },
        hallIntros
      };

      const response = await fetch('https://functions.poehali.dev/627176dc-e9bb-4240-b145-2a99dfd51f06', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData)
      });

      if (!response.ok) {
        throw new Error('Ошибка сервера при генерации PDF');
      }

      const result = await response.json();
      
      if (!result.ok || !result.b64) {
        throw new Error(result.error || 'Неизвестная ошибка');
      }

      // Конвертируем base64 в Blob для мобильных браузеров
      const binaryString = atob(result.b64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'program.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем память
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Ошибка экспорта PDF:', err);
      alert('Не удалось создать PDF: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportPlanPdf = async () => {
    if (!data || plan.size === 0) {
      alert('План пуст — добавьте доклады кнопкой «+ В план»');
      return;
    }
    
    try {
      setExportingPdf(true);
      
      const planSessions = data.sessions.filter(s => plan.has(s.id));
      const sorted = [...planSessions].sort((a, b) => {
        const toMin = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        return toMin(a.start) - toMin(b.start) || (data.halls.find(h => h.id === a.hallId)?.name || '').localeCompare(data.halls.find(h => h.id === b.hallId)?.name || '');
      });
      
      const halls: string[] = [];
      sorted.forEach(s => {
        const hallName = data.halls.find(h => h.id === s.hallId)?.name || '';
        if (hallName && !halls.includes(hallName)) halls.push(hallName);
      });

      const pdfData = {
        halls,
        sessions: sorted.map(s => ({
          hall: data.halls.find(h => h.id === s.hallId)?.name || '',
          start: s.start,
          end: s.end,
          title: s.title || '',
          speaker: s.speaker || '',
          role: s.role || '',
          desc: s.desc || '',
          photo: s.photo || '',
          tagsCanon: (s.tagsCanon || []).slice()
        })),
        meta: {
          title: (data.meta.title || 'Программа мероприятия') + ' — Мой план',
          subtitle: 'Мой план',
          date: data.meta.date || '',
          venue: data.meta.venue || '',
          logoId: eventLogoUrl || data.meta.logoId || '',
          coverId: eventCoverUrl || data.meta.coverId || ''
        },
        hallIntros: {}
      };

      const response = await fetch('https://functions.poehali.dev/627176dc-e9bb-4240-b145-2a99dfd51f06', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData)
      });

      if (!response.ok) {
        throw new Error('Ошибка сервера при генерации PDF');
      }

      const result = await response.json();
      
      if (!result.ok || !result.b64) {
        throw new Error(result.error || 'Неизвестная ошибка');
      }

      // Конвертируем base64 в Blob для мобильных браузеров
      const binaryString = atob(result.b64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-plan.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем память
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
    } catch (err) {
      console.error('Ошибка генерации PDF плана:', err);
      alert('Ошибка при генерации PDF: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
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

  const times = [...new Set(data.sessions.map(s => s.start))].sort((a, b) => {
    const [ha, ma] = a.split(':').map(Number);
    const [hb, mb] = b.split(':').map(Number);
    return (ha * 60 + ma) - (hb * 60 + mb);
  });
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
          <div style={{ padding: '8px 14px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: daySheets.length > 1 ? '8px' : '0' }}>
              {daySheets.length > 1 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  overflowX: 'auto',
                  flex: 1
                }}>
                  {daySheets.map((day) => (
                    <button
                      key={day.gid}
                      onClick={() => handleDayChange(day.gid)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: 'none',
                        background: selectedDay === day.gid ? 'var(--accent)' : 'var(--panel)',
                        color: selectedDay === day.gid ? '#fff' : 'var(--text)',
                        fontWeight: selectedDay === day.gid ? '600' : '500',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setTab('plan')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'var(--ok)',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: '0 0 auto'
                }}
              >
                План {plan.size > 0 && `(${plan.size})`}
              </button>
            </div>
            
            <MobileTimeChips
              times={times}
              selectedTime={selectedTime}
              onTimeSelect={handleTimeChipClick}
            />
          </div>
        </div>
      )}

      {tab === 'all' && (
        <div className="sticky-time-chips">
          <div style={{ padding: '8px 14px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: daySheets.length > 1 ? '8px' : '0' }}>
              {daySheets.length > 1 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  overflowX: 'auto',
                  flex: 1
                }}>
                  {daySheets.map((day) => (
                    <button
                      key={day.gid}
                      onClick={() => handleDayChange(day.gid)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: 'none',
                        background: selectedDay === day.gid ? 'var(--accent)' : 'var(--panel)',
                        color: selectedDay === day.gid ? '#fff' : 'var(--text)',
                        fontWeight: selectedDay === day.gid ? '600' : '500',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setTab('plan')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'var(--ok)',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: '0 0 auto'
                }}
              >
                План {plan.size > 0 && `(${plan.size})`}
              </button>
            </div>
            
            <MobileHallFilter
              halls={data.halls}
              selectedHall={selectedHall}
              onHallSelect={setSelectedHall}
            />
          </div>
        </div>
      )}

      <div style={{ padding: '0 14px', paddingBottom: '100px', minHeight: 'calc(100vh - 280px)' }}>
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
                  const conflictingSession = planList.find(p => overlap(p, session));
                  const hasConflict = inPlan ? false : !!conflictingSession;

                  return (
                    <MobileSessionCard
                      key={session.id}
                      session={session}
                      inPlan={inPlan}
                      hallName={hallName(session.hallId)}
                      duration={durationText(session)}
                      hasConflict={hasConflict}
                      conflictSession={conflictingSession}
                      conflictHallName={conflictingSession ? hallName(conflictingSession.hallId) : undefined}
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
          <div style={{ padding: '0 14px', paddingTop: 0 }}>
            {filtered.map(session => {
              const inPlan = plan.has(session.id);
              const planList = data.sessions.filter(s => plan.has(s.id));
              const conflictingSession = planList.find(p => overlap(p, session));
              const hasConflict = inPlan ? false : !!conflictingSession;

              return (
                <MobileSessionCard
                  key={session.id}
                  session={session}
                  inPlan={inPlan}
                  hallName={hallName(session.hallId)}
                  duration={durationText(session)}
                  hasConflict={hasConflict}
                  conflictSession={conflictingSession}
                  conflictHallName={conflictingSession ? hallName(conflictingSession.hallId) : undefined}
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
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                  <button onClick={handleExportPlanPdf} disabled={exportingPdf} className="plan-action">
                    <Icon name={exportingPdf ? 'Loader2' : 'FileDown'} size={18} className={exportingPdf ? 'animate-spin' : ''} />
                    {exportingPdf ? 'Создание PDF...' : 'Скачать PDF'}
                  </button>
                  <button onClick={handleSharePlan} className="plan-action">
                    <Icon name="Share2" size={18} />
                    Поделиться планом
                  </button>
                  <button onClick={() => setPlan(new Set())} className="plan-clear">
                    Очистить план
                  </button>
                </div>
                <div style={{ paddingTop: 0 }}>
                  {data.sessions
                    .filter(s => plan.has(s.id))
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((session, index, sortedPlan) => {
                      const planList = data.sessions.filter(s => plan.has(s.id)).sort((a, b) => a.start.localeCompare(b.start));
                      
                      const conflictingSession = planList.find(p => p.id !== session.id && overlap(p, session));
                      const hasConflict = !!conflictingSession;
                      
                      const nextSession = sortedPlan[index + 1];
                      const needsTransition = !hasConflict && nextSession && nextSession.hallId !== session.hallId;

                      return (
                        <MobileSessionCard
                          key={session.id}
                          session={session}
                          inPlan={true}
                          hallName={hallName(session.hallId)}
                          duration={durationText(session)}
                          hasConflict={hasConflict || needsTransition}
                          conflictSession={hasConflict ? conflictingSession : (needsTransition ? nextSession : undefined)}
                          conflictHallName={hasConflict ? (conflictingSession ? hallName(conflictingSession.hallId) : undefined) : (needsTransition ? hallName(nextSession.hallId) : undefined)}
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