import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProgramData, ProgramData, Session } from '@/utils/googleSheetsParser';
import { Button } from '@/components/ui/button';
import ProgramHeader from '@/components/program/ProgramHeader';
import ProgramGrid from '@/components/program/ProgramGrid';
import ProgramGridV2 from '@/components/program/ProgramGridV2';
import ProgramPlan from '@/components/program/ProgramPlan';

export default function WebProgram() {
  const [searchParams] = useSearchParams();
  const sheetIdFromUrl = searchParams.get('sheetId');
  
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showPlan, setShowPlan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingPlanPdf, setGeneratingPlanPdf] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const programData = await fetchProgramData(sheetIdFromUrl || undefined);
      setData(programData);
      
      // При фоновой загрузке сохраняем фильтры
      if (!silent || selectedTags.size === 0) {
        setFilteredSessions(programData.sessions);
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

  const toMin = (hhmm: string): number => {
    const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
    return m ? (+m[1] * 60 + +m[2]) : NaN;
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
          logoId: data.meta.logoId || '',
          coverId: data.meta.coverId || ''
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
          logoId: data.meta.logoId || '',
          coverId: data.meta.coverId || ''
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
      loadData(true); // Тихое обновление фоном
    }, 30000);
    
    return () => clearInterval(interval);
  }, [sheetIdFromUrl]);

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
    const existing = plan.find(s => s.id === session.id);
    if (existing) {
      removeFromPlan(session.id);
    } else {
      setPlan(prev => [...prev, session]);
      // Автооткрытие плана при первом добавлении
      if (plan.length === 0) {
        setShowPlan(true);
      }
    }
  };

  const removeFromPlan = (id: string) => {
    setPlan(prev => prev.filter(s => s.id !== id));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('program-theme', newTheme);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <div className="text-center">
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
        '--muted': theme === 'dark' ? '#9aa3ad' : '#475569',
        '--line': theme === 'dark' ? '#242a36' : '#e6e8ee',
        '--chip': theme === 'dark' ? '#1b2130' : '#f0f3f9',
        '--accent': theme === 'dark' ? '#3b82f6' : '#2563eb',
        '--button-bg': theme === 'dark' ? '#1a2130' : '#ffffff',
        '--button-border': theme === 'dark' ? '#2a3544' : '#d1d5db',
        '--button-text': theme === 'dark' ? '#e9edf3' : '#1a2433',
        '--button-hover': theme === 'dark' ? '#242d3d' : '#f3f4f6'
      } as React.CSSProperties}
    >
      <div className="max-w-[1840px] mx-auto px-3 md:px-5 py-3 md:py-5">
        <ProgramHeader
          title={data?.meta.title || 'Программа мероприятия'}
          date={data?.meta.date}
          venue={data?.meta.venue}
          refreshing={refreshing}
          generatingPdf={generatingPdf}
          tagDropdownOpen={tagDropdownOpen}
          selectedTags={selectedTags}
          showPlan={showPlan}
          theme={theme}
          onRefresh={handleRefresh}
          onDownloadPdf={downloadProgramPdf}
          onToggleTagDropdown={() => setTagDropdownOpen(!tagDropdownOpen)}
          onTagsChange={setSelectedTags}
          onTogglePlan={() => setShowPlan(!showPlan)}
          onToggleTheme={toggleTheme}
        />

        <div className="mb-4 flex items-center gap-2">
          <style>{`
            .view-mode-button {
              background: var(--button-bg);
              border: 1px solid var(--button-border);
              color: var(--button-text);
            }
            .view-mode-button:hover:not(:disabled) {
              background: var(--button-hover);
            }
            .view-mode-button-active {
              background: var(--accent);
              color: #ffffff;
              border-color: var(--accent);
            }
            .view-mode-button-active:hover {
              background: var(--accent);
              opacity: 0.9;
            }
          `}</style>
          <Button
            onClick={() => setViewMode('cards')}
            size="sm"
            className={viewMode === 'cards' ? 'view-mode-button-active' : 'view-mode-button'}
          >
            По времени
          </Button>
          <Button
            onClick={() => setViewMode('table')}
            size="sm"
            className={viewMode === 'table' ? 'view-mode-button-active' : 'view-mode-button'}
          >
            По залам
          </Button>
        </div>

        <div className={`grid gap-6 ${showPlan ? 'xl:grid-cols-[1fr_380px] lg:grid-cols-[1fr_320px] grid-cols-1' : 'grid-cols-1'}`}>
          <div className={viewMode === 'table' ? 'border border-[var(--line)] rounded-lg bg-[var(--panel)] overflow-auto max-h-[calc(100vh-200px)]' : ''}>
            {data && (
              viewMode === 'cards' ? (
                <ProgramGridV2
                  data={data}
                  filteredSessions={filteredSessions}
                  theme={theme}
                  onAddToPlan={addToPlan}
                  planSessionIds={new Set(plan.map(s => s.id))}
                />
              ) : (
                <ProgramGrid
                  data={data}
                  filteredSessions={filteredSessions}
                  theme={theme}
                  onAddToPlan={addToPlan}
                  planSessionIds={new Set(plan.map(s => s.id))}
                />
              )
            )}
          </div>

          {showPlan && (
            <ProgramPlan
              plan={plan}
              theme={theme}
              generatingPlanPdf={generatingPlanPdf}
              onClearPlan={() => setPlan([])}
              onDownloadPlanPdf={downloadPlanPdf}
              onRemoveFromPlan={removeFromPlan}
            />
          )}
        </div>
      </div>
    </div>
  );
}