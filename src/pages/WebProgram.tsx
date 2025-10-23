import { useState, useEffect } from 'react';
import { fetchProgramData, ProgramData, Session, getTagCanonMap } from '@/utils/googleSheetsParser';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function WebProgram() {
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showPlan, setShowPlan] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingPlanPdf, setGeneratingPlanPdf] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const programData = await fetchProgramData();
      setData(programData);
      setFilteredSessions(programData.sessions);
    } catch (err) {
      setError('Не удалось загрузить данные. Проверьте доступ к таблице.');
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
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

  const downloadProgramPdf = async () => {
    if (!data) return;
    
    try {
      setGeneratingPdf(true);
      
      const source = filteredSessions.length ? filteredSessions : data.sessions;
      const hallIntros: Record<string, string[]> = {};
      data.halls.forEach(h => {
        if (h.bullets && h.bullets.length) hallIntros[h.name] = h.bullets.slice();
      });

      const pdfData = {
        halls: data.halls.map(h => h.name),
        sessions: source.map(s => ({
          hall: s.hall,
          start: s.start,
          end: s.end,
          title: s.title || '',
          speaker: s.speaker || '',
          role: s.role || '',
          desc: s.desc || '',
          tagsCanon: (s.tagsCanon || []).slice()
        })),
        meta: {
          date: data.meta.date || '',
          title: data.meta.title || '',
          subtitle: data.meta.subtitle || '',
          venue: data.meta.venue || '',
          logoId: '',
          coverId: ''
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

      // Скачивание PDF
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,' + result.b64;
      link.download = 'program.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Ошибка генерации PDF:', err);
      alert('Ошибка при генерации PDF: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const downloadPlanPdf = async () => {
    if (!data || plan.length === 0) {
      alert('План пуст — добавьте доклады кнопкой «+ В план»');
      return;
    }
    
    try {
      setGeneratingPlanPdf(true);
      
      const sorted = [...plan].sort((a, b) => toMin(a.start) - toMin(b.start) || a.hall.localeCompare(b.hall));
      
      const halls: string[] = [];
      sorted.forEach(s => {
        if (!halls.includes(s.hall)) halls.push(s.hall);
      });

      const pdfData = {
        halls,
        sessions: sorted.map(s => ({
          hall: s.hall,
          start: s.start,
          end: s.end,
          title: s.title || '',
          speaker: s.speaker || '',
          role: s.role || '',
          desc: s.desc || '',
          tagsCanon: (s.tagsCanon || []).slice()
        })),
        meta: {
          title: (data.meta.title || 'Программа мероприятия') + ' — Мой план',
          subtitle: 'Мой план',
          date: data.meta.date || '',
          venue: data.meta.venue || '',
          logoId: '',
          coverId: ''
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

      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,' + result.b64;
      link.download = 'my-plan.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Ошибка генерации PDF плана:', err);
      alert('Ошибка при генерации PDF: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setGeneratingPlanPdf(false);
    }
  };

  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('web-program-plan');
    if (saved) setPlan(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('web-program-plan', JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('program-theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (!data) return;
    
    if (selectedTags.size === 0) {
      setFilteredSessions(data.sessions);
    } else {
      const filtered = data.sessions.filter(s =>
        (s.tagsCanon || []).some(c => selectedTags.has(c))
      );
      setFilteredSessions(filtered);
    }
  }, [selectedTags, data]);

  const addToPlan = (session: Session) => {
    if (plan.find(s => s.id === session.id)) return;
    setPlan(prev => [...prev, session]);
  };

  const removeFromPlan = (id: string) => {
    setPlan(prev => prev.filter(s => s.id !== id));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('program-theme', newTheme);
  };

  const toMin = (hhmm: string): number => {
    const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
    return m ? (+m[1] * 60 + +m[2]) : NaN;
  };

  const hashStr = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  const renderTags = (tagsCanon: string[]) => {
    if (!tagsCanon || !tagsCanon.length) return null;
    const tagMap = getTagCanonMap();
    
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {tagsCanon.map(c => {
          const h = hashStr(c) % 360;
          const isLight = theme === 'light';
          const bg = `hsl(${h}, 65%, ${isLight ? 85 : 30}%)`;
          const bd = `hsl(${h}, 65%, ${isLight ? 75 : 38}%)`;
          
          return (
            <span
              key={c}
              className="px-2 py-1 text-xs rounded-full"
              style={{ background: bg, borderColor: bd, border: '1px solid' }}
            >
              {tagMap[c] || c}
            </span>
          );
        })}
      </div>
    );
  };

  const renderSession = (session: Session) => {
    return (
      <div className="relative p-3 bg-[var(--chip)] border border-[var(--line)] rounded-lg">
        <button
          onClick={() => addToPlan(session)}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-[var(--panel)] border border-[var(--line)] rounded hover:bg-[var(--chip)] transition-opacity opacity-0 hover:opacity-100"
        >
          + В план
        </button>
        
        <div className="text-xs mb-2 font-medium">{session.start} — {session.end}</div>
        {renderTags(session.tagsCanon)}
        
        {session.speaker && <div className="font-bold mb-1">{session.speaker}</div>}
        {session.role && <div className="text-sm text-[var(--muted)] mb-1">{session.role}</div>}
        {session.title && <div className="font-semibold mb-2">{session.title}</div>}
        {session.desc && (
          <div className="text-sm whitespace-pre-wrap text-[var(--text)]">
            {session.desc}
          </div>
        )}
      </div>
    );
  };

  const buildGrid = () => {
    if (!data || !filteredSessions.length) return null;

    const slots = [...new Set(filteredSessions.map(s => s.start))].sort((a, b) => toMin(a) - toMin(b));
    const byHall: Record<string, Session[]> = {};
    
    data.halls.forEach(h => byHall[h.name] = []);
    filteredSessions.forEach(s => {
      if (byHall[s.hall]) byHall[s.hall].push(s);
    });

    for (const h in byHall) {
      byHall[h].sort((a, b) => toMin(a.start) - toMin(b.start));
    }

    // Карта покрытых ячеек (из-за rowspan)
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
                  // Пропускаем покрытые ячейки
                  if (covered[key(rowIndex, colIndex)]) return null;

                  const list = byHall[hall.name] || [];
                  const session = list.find(s => s.start === slot);
                  
                  if (!session) {
                    return (
                      <td key={hall.id} className="border-b border-r border-[var(--line)] p-3 align-top"></td>
                    );
                  }

                  // Рассчитываем rowspan: до следующего доклада или до конца
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

                  // Отмечаем покрытые ячейки
                  for (let t = 1; t < span; t++) {
                    covered[key(rowIndex + t, colIndex)] = true;
                  }

                  return (
                    <td 
                      key={hall.id} 
                      rowSpan={span}
                      className="border-b border-r border-[var(--line)] p-3 align-top"
                    >
                      {renderSession(session)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPlan = () => {
    const sorted = [...plan].sort((a, b) => toMin(a.start) - toMin(b.start) || a.hall.localeCompare(b.hall));

    return (
      <div className="flex flex-col gap-3">
        {sorted.map((s, i) => {
          const prev = sorted[i - 1];
          const notes: string[] = [];
          
          if (prev) {
            if (prev.hall !== s.hall) notes.push(`Смена зала: ${prev.hall} → ${s.hall}`);
            if (toMin(prev.end) > toMin(s.start)) notes.push('Пересечение по времени');
          }

          return (
            <div key={s.id} className="p-3 border border-[var(--line)] rounded-lg bg-[var(--panel)]">
              <div className="text-xs text-[var(--muted)] mb-1">
                <strong>{s.start} — {s.end}</strong> · {s.hall}
              </div>
              
              {notes.length > 0 && (
                <div className="text-xs mb-2">
                  {notes.map((note, idx) => (
                    <div key={idx} className="text-orange-500">{note}</div>
                  ))}
                </div>
              )}

              {renderTags(s.tagsCanon)}
              
              {s.speaker && <div className="font-bold">{s.speaker}</div>}
              {s.role && <div className="text-sm text-[var(--muted)]">{s.role}</div>}
              {s.title && <div className="font-semibold mt-1">«{s.title}»</div>}
              {s.desc && <div className="text-sm mt-2 whitespace-pre-wrap">{s.desc}</div>}
              
              <Button
                onClick={() => removeFromPlan(s.id)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Убрать
              </Button>
            </div>
          );
        })}
        
        {plan.length === 0 && (
          <div className="text-sm text-[var(--muted)]">
            Пусто. Добавьте доклады из расписания.
          </div>
        )}
      </div>
    );
  };

  const allTags = data ? Object.keys(getTagCanonMap()).sort() : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-2" size={32} />
          <div>Загрузка программы...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={loadData}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
      style={{
        '--bg': theme === 'dark' ? '#0f1115' : '#f3f6fb',
        '--panel': theme === 'dark' ? '#151922' : '#ffffff',
        '--text': theme === 'dark' ? '#e9edf3' : '#1a2433',
        '--muted': theme === 'dark' ? '#9aa3ad' : '#5b6572',
        '--line': theme === 'dark' ? '#242a36' : '#e6e8ee',
        '--chip': theme === 'dark' ? '#1b2130' : '#f0f3f9',
        '--accent': theme === 'dark' ? '#3b82f6' : '#2563eb'
      } as React.CSSProperties}
    >
      <div className="max-w-[1840px] mx-auto p-5">
        {/* Sticky header */}
        <div className="sticky top-0 bg-[var(--bg)] border-b border-[var(--line)] pb-3 mb-5 z-50">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold mb-1">{data?.title || 'Программа мероприятия'}</h1>
              {data?.meta.date && (
                <div className="text-sm text-[var(--muted)]">
                  Дата проведения: {data.meta.date}
                </div>
              )}
              <div className="text-xs text-[var(--muted)] mt-1">
                Обновлено: {new Date().toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <Icon name={refreshing ? 'Loader2' : 'RefreshCw'} size={16} className={refreshing ? 'animate-spin' : ''} />
              </Button>

              <div className="relative">
                <Button
                  onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                  variant="outline"
                  size="sm"
                >
                  Теги: {selectedTags.size || 'все'}
                </Button>

                {tagDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[520px] max-h-[60vh] overflow-auto bg-[var(--panel)] border border-[var(--line)] rounded-lg shadow-lg p-3 z-50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {allTags.map(canon => (
                        <label key={canon} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTags.has(canon)}
                            onChange={(e) => {
                              const newTags = new Set(selectedTags);
                              if (e.target.checked) {
                                newTags.add(canon);
                              } else {
                                newTags.delete(canon);
                              }
                              setSelectedTags(newTags);
                            }}
                          />
                          <span>{getTagCanonMap()[canon]}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                      <Button
                        onClick={() => {
                          setSelectedTags(new Set());
                          setTagDropdownOpen(false);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Сбросить
                      </Button>
                      <Button onClick={() => setTagDropdownOpen(false)} size="sm">
                        Применить
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={downloadProgramPdf}
                disabled={generatingPdf}
                variant="outline"
                size="sm"
              >
                <Icon name={generatingPdf ? 'Loader2' : 'FileDown'} size={16} className={generatingPdf ? 'animate-spin mr-2' : 'mr-2'} />
                {generatingPdf ? 'Готовлю PDF...' : 'Скачать PDF'}
              </Button>

              <Button variant="outline" size="sm">
                <a
                  href={`https://docs.google.com/spreadsheets/d/1HgPCnMmB0KuP080xWYjBlCPdvBy5AzQMeRVX_PUxca4/export?format=xlsx`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Скачать XLSX
                </a>
              </Button>

              <Button onClick={() => setShowPlan(!showPlan)} variant="outline" size="sm">
                План
              </Button>

              <Button onClick={toggleTheme} variant="outline" size="sm">
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className={`grid gap-6 ${showPlan ? 'grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
          <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] overflow-hidden">
            {buildGrid()}
          </div>

          {showPlan && (
            <aside className="sticky top-24 h-[calc(100vh-120px)] overflow-auto border border-[var(--line)] rounded-lg bg-[var(--panel)] p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold">Мой план</div>
                <div className="flex gap-2">
                  <Button
                    onClick={downloadPlanPdf}
                    disabled={generatingPlanPdf || plan.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    <Icon name={generatingPlanPdf ? 'Loader2' : 'FileDown'} size={14} className={generatingPlanPdf ? 'animate-spin' : ''} />
                  </Button>
                  <Button
                    onClick={() => setPlan([])}
                    variant="outline"
                    size="sm"
                  >
                    Очистить
                  </Button>
                </div>
              </div>
              
              {renderPlan()}
            </aside>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {tagDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setTagDropdownOpen(false)}
        />
      )}
    </div>
  );
}