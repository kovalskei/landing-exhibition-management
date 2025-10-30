import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface ProgramEvent {
  id: string;
  name: string;
  sheetUrl: string;
  logoUrl?: string;
  coverUrl?: string;
  daySheets?: string;
  createdAt: string;
}

interface SessionStat {
  session_id: string;
  interest_count: number;
}

interface EventStats {
  totalUsers: number;
  sessions: SessionStat[];
}

const API_URL = 'https://functions.poehali.dev/1cac6452-8133-4b28-bd68-feb243859e2c';

export default function ProgramSettings() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ProgramEvent[]>([]);
  const [newEventName, setNewEventName] = useState('');
  const [newEventUrl, setNewEventUrl] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newDaySheets, setNewDaySheets] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingEditLogo, setUploadingEditLogo] = useState<string | null>(null);
  const [uploadingEditCover, setUploadingEditCover] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, EventStats>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});

  const loadEvents = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const addEvent = async () => {
    if (!newEventName.trim() || !newEventUrl.trim()) return;

    const newEvent: ProgramEvent = {
      id: Date.now().toString(),
      name: newEventName.trim(),
      sheetUrl: newEventUrl.trim(),
      logoUrl: newLogoUrl.trim() || undefined,
      coverUrl: newCoverUrl.trim() || undefined,
      daySheets: newDaySheets.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      
      await loadEvents();
      setNewEventName('');
      setNewEventUrl('');
      setNewLogoUrl('');
      setNewCoverUrl('');
      setNewDaySheets('');
    } catch (err) {
      console.error('Failed to create event:', err);
      alert('Не удалось создать событие');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Удалить это событие?')) return;

    try {
      await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE'
      });
      await loadEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Не удалось удалить событие');
    }
  };

  const updateEvent = async (id: string, name: string, url: string, logoUrl?: string, coverUrl?: string, daySheets?: string) => {
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, sheetUrl: url, logoUrl, coverUrl, daySheets })
      });
      
      await loadEvents();
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update event:', err);
      alert('Не удалось обновить событие');
    }
  };

  const getIframeCode = (eventId: string) => {
    const baseUrl = 'https://landing-exhibition-management--preview.poehali.dev';
    return `<!-- FULL-BLEED контайнер: во всю ширину экрана и на высоту окна -->
<div style="position:relative; width:100vw; height:100vh; left:50%; right:50%; margin-left:-50vw; margin-right:-50vw; overflow:hidden;">
  <iframe src="${baseUrl}/program?eventId=${eventId}" style="position:absolute; inset:0; width:100%; height:100%; border:0; display:block;" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
</div>`;
  };

  const copyIframeCode = (eventId: string) => {
    const code = getIframeCode(eventId);
    navigator.clipboard.writeText(code);
    alert('Код iframe скопирован в буфер обмена!');
  };

  const loadStats = async (eventId: string) => {
    setLoadingStats(prev => ({ ...prev, [eventId]: true }));
    try {
      const response = await fetch(`https://functions.poehali.dev/74b8d859-f86d-4472-8953-60d978dafb94?eventId=${eventId}`);
      const data = await response.json();
      console.log('📊 Данные статистики с сервера:', data);
      console.log('🔍 Примеры session_id:', data.sessions?.slice(0, 5).map((s: SessionStat) => s.session_id));
      setStats(prev => ({ ...prev, [eventId]: data }));
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const downloadStatsCSV = async (eventId: string) => {
    try {
      const programResponse = await fetch(`https://functions.poehali.dev/1cac6452-8133-4b28-bd68-feb243859e2c?id=${eventId}`);
      const eventData = await programResponse.json();
      
      if (!eventData.sheetUrl) {
        alert('Не удалось получить данные программы');
        return;
      }
      
      const sheetMatch = eventData.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetMatch) {
        alert('Неверный формат ссылки на таблицу');
        return;
      }
      
      const sheetId = sheetMatch[1];
      
      // Правильный CSV-парсинг с учетом кавычек
      const parseCSVRow = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      };
      
      // Парсим ВСЕ листы из daySheets
      const sessions: Record<string, { title: string; speaker: string; hall: string; time: string; day: string }> = {};
      const sessionsMap: Record<string, Array<{ title: string; speaker: string; hall: string; time: string; day: string }>> = {};
      const daySheetLines = eventData.daySheets?.split('\n') || [];
      
      console.log('📅 Загружаем листы:', daySheetLines.length);
      
      for (const dayLine of daySheetLines) {
        const [dayName, gid] = dayLine.split(':').map(s => s.trim());
        if (!gid) continue;
        
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        console.log(`📄 Загружаем лист "${dayName}" (gid=${gid})`);
        
        try {
          const csvResponse = await fetch(sheetUrl);
          const csvText = await csvResponse.text();
          const lines = csvText.split('\n');
          
          // Получаем дату из строки 1 (rows[1][0] в таблице) - это дата мероприятия
          const dateLine = lines.length > 1 ? parseCSVRow(lines[1]) : [];
          const sheetDate = dateLine[0]?.trim() || dayName;
          console.log(`📅 Дата листа "${dayName}": ${sheetDate}`);
          
          for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVRow(lines[i]);
            if (cols.length >= 5) {
              // ИСПРАВЛЕНИЕ: Не берём ID из первой колонки, а ГЕНЕРИРУЕМ сами
              // Формат: ДАТА|ЗАЛ|ВРЕМЯ_НАЧАЛА|ВРЕМЯ_КОНЦА
              const hall = cols[1]?.trim();
              const timeStart = cols[2]?.trim();
              const timeEnd = cols[3]?.trim();
              const titleRaw = cols[4]?.trim() || '';
              const speakerRoleRaw = cols[5]?.trim() || '';
              
              // Извлекаем спикера из первой строки поля (до первой запятой или тире)
              const firstLine = speakerRoleRaw.split('\n')[0] || '';
              const speaker = firstLine.split(/[,—–-]/)[0]?.trim() || '';
              
              // Генерируем ID аналогично googleSheetsParser.ts (строка 582-585)
              if (hall && timeStart && timeEnd) {
                const id = sheetDate + '|' + hall + '|' + timeStart + '|' + timeEnd;
                
                // Сохраняем ВСЕ вхождения ID (могут быть на разных днях)
                if (!sessionsMap[id]) sessionsMap[id] = [];
                sessionsMap[id].push({ title: titleRaw, speaker, hall, time: timeStart + '-' + timeEnd, day: dayName });
              }
            }
          }
        } catch (err) {
          console.error(`Ошибка загрузки листа ${dayName}:`, err);
        }
      }
      
      // Преобразуем в старый формат (берём первое вхождение для каждого ID)
      for (const id in sessionsMap) {
        sessions[id] = sessionsMap[id][0];
      }
      
      console.log('📊 Всего уникальных ID:', Object.keys(sessionsMap).length);
      console.log('🔄 ID с дублями:', Object.entries(sessionsMap).filter(([_, arr]) => arr.length > 1).map(([id, arr]) => `${id} (${arr.length} дней)`));
      
      const statsData = stats[eventId];
      if (!statsData) {
        alert('Сначала загрузите статистику');
        return;
      }
      
      console.log('📊 Всего сессий в статистике:', statsData.sessions.length);
      console.log('📋 Сессий найдено в таблице:', Object.keys(sessions).length);
      console.log('🔍 ID из статистики:', statsData.sessions.map(s => s.session_id).slice(0, 10));
      console.log('🔍 ID из таблицы:', Object.keys(sessions).slice(0, 10));
      
      let csv = 'ID,Название,Спикер,Зал,Время,Интерес\n';
      let notFound = 0;
      statsData.sessions.forEach(s => {
        const session = sessions[s.session_id];
        if (!session) {
          notFound++;
          console.warn('⚠️ Сессия не найдена в таблице:', s.session_id);
        }
        const sessionData = session || { title: 'Неизвестно', speaker: '', hall: '', time: '' };
        csv += `"${s.session_id}","${sessionData.title}","${sessionData.speaker}","${sessionData.hall}","${sessionData.time}",${s.interest_count}\n`;
      });
      
      if (notFound > 0) {
        console.warn(`⚠️ Не найдено ${notFound} сессий из ${statsData.sessions.length} в таблице`);
      }
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stats-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      alert('Не удалось скачать статистику');
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'cover', eventId?: string) => {
    const setUploading = eventId 
      ? (type === 'logo' ? setUploadingEditLogo : setUploadingEditCover)
      : (type === 'logo' ? setUploadingLogo : setUploadingCover);
    const setUrl = eventId
      ? null
      : (type === 'logo' ? setNewLogoUrl : setNewCoverUrl);
    
    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch('https://functions.poehali.dev/e6e8b38e-3cf4-4b94-8b02-f8380a12cb42', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });
        
        const result = await response.json();
        
        if (result.success) {
          if (eventId) {
            const input = document.getElementById(`${type}-${eventId}`) as HTMLInputElement;
            if (input) input.value = result.url;
          } else if (setUrl) {
            setUrl(result.url);
          }
        } else {
          alert('Ошибка загрузки: ' + (result.error || 'Неизвестная ошибка'));
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Не удалось загрузить изображение');
    } finally {
      if (eventId) {
        if (type === 'logo') setUploadingEditLogo(null);
        else setUploadingEditCover(null);
      } else {
        setUploading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Настройки программ событий</h1>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Добавить новое событие</h2>
          <div className="space-y-4">
            <Input
              placeholder="Название события"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
            />
            <Input
              placeholder="Ссылка на Google Sheets"
              value={newEventUrl}
              onChange={(e) => setNewEventUrl(e.target.value)}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Логотип (опционально)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="URL логотипа"
                  value={newLogoUrl}
                  onChange={(e) => setNewLogoUrl(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {uploadingLogo ? 'Загрузка...' : <Icon name="Upload" size={16} />}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Титульное изображение (опционально)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="URL титульного изображения"
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingCover}
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  {uploadingCover ? 'Загрузка...' : <Icon name="Upload" size={16} />}
                </Button>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Дни события (опционально)</label>
              <Textarea
                placeholder={'День 1: 0\nДень 2: 1234567\n15 мая: 7654321'}
                value={newDaySheets}
                onChange={(e) => setNewDaySheets(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Формат: Название: GID листа (каждая строка = отдельный день)
              </p>
            </div>
            <Button onClick={addEvent} className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить событие
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Мои события ({events.length})</h2>
          {events.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет добавленных событий</p>
            </Card>
          ) : (
            events.map(event => (
              <Card key={event.id} className="p-4">
                {editingId === event.id ? (
                  <div className="space-y-3">
                    <Input
                      defaultValue={event.name}
                      id={`name-${event.id}`}
                    />
                    <Input
                      defaultValue={event.sheetUrl}
                      id={`url-${event.id}`}
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Логотип</label>
                      <div className="flex gap-2">
                        <Input
                          defaultValue={event.logoUrl || ''}
                          id={`logo-${event.id}`}
                          placeholder="URL логотипа"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingEditLogo === event.id}
                          onClick={() => document.getElementById(`logo-upload-${event.id}`)?.click()}
                        >
                          {uploadingEditLogo === event.id ? 'Загрузка...' : <Icon name="Upload" size={16} />}
                        </Button>
                        <input
                          id={`logo-upload-${event.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo', event.id)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Титульное изображение</label>
                      <div className="flex gap-2">
                        <Input
                          defaultValue={event.coverUrl || ''}
                          id={`cover-${event.id}`}
                          placeholder="URL титульного изображения"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingEditCover === event.id}
                          onClick={() => document.getElementById(`cover-upload-${event.id}`)?.click()}
                        >
                          {uploadingEditCover === event.id ? 'Загрузка...' : <Icon name="Upload" size={16} />}
                        </Button>
                        <input
                          id={`cover-upload-${event.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover', event.id)}
                        />
                      </div>
                    </div>
                    <Textarea
                      defaultValue={event.daySheets || ''}
                      id={`days-${event.id}`}
                      placeholder="День 1: 0&#10;День 2: 1234567"
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const name = (document.getElementById(`name-${event.id}`) as HTMLInputElement).value;
                          const url = (document.getElementById(`url-${event.id}`) as HTMLInputElement).value;
                          const logo = (document.getElementById(`logo-${event.id}`) as HTMLInputElement).value;
                          const cover = (document.getElementById(`cover-${event.id}`) as HTMLInputElement).value;
                          const days = (document.getElementById(`days-${event.id}`) as HTMLTextAreaElement).value;
                          updateEvent(event.id, name, url, logo, cover, days);
                        }}
                      >
                        Сохранить
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{event.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {event.sheetUrl}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingId(event.id)}
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 mt-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/program?eventId=${event.id}`)}
                        >
                          <Icon name="Eye" size={14} className="mr-1" />
                          Открыть
                        </Button>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-muted-foreground">Код для встраивания</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyIframeCode(event.id)}
                          >
                            <Icon name="Copy" size={14} className="mr-1" />
                            Скопировать
                          </Button>
                        </div>
                        <Textarea
                          readOnly
                          value={getIframeCode(event.id)}
                          className="font-mono text-xs h-20 resize-none"
                        />
                      </div>
                      {stats[event.id] && (
                        <div className="bg-muted/50 p-3 rounded-md mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-muted-foreground">Статистика интереса</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadStatsCSV(event.id)}
                                title="Скачать CSV"
                              >
                                <Icon name="Download" size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => loadStats(event.id)}
                                disabled={loadingStats[event.id]}
                              >
                                <Icon name={loadingStats[event.id] ? 'Loader2' : 'RefreshCw'} size={14} className={loadingStats[event.id] ? 'animate-spin' : ''} />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Всего пользователей:</span>
                              <span className="font-semibold">{stats[event.id].totalUsers}</span>
                            </div>
                            {stats[event.id].sessions.length > 0 ? (
                              <div className="mt-3">
                                <p className="text-xs font-medium mb-2">Все доклады ({stats[event.id].sessions.length}):</p>
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                  {stats[event.id].sessions.map((s) => (
                                    <div key={s.session_id} className="flex items-center justify-between text-xs bg-background p-2 rounded">
                                      <span className="font-mono text-muted-foreground">{s.session_id}</span>
                                      <span className="font-semibold">{s.interest_count} ★</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">Пока нет данных о планах посетителей</p>
                            )}
                          </div>
                        </div>
                      )}
                      {!stats[event.id] && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadStats(event.id)}
                          disabled={loadingStats[event.id]}
                          className="w-full mt-3"
                        >
                          <Icon name={loadingStats[event.id] ? 'Loader2' : 'BarChart3'} size={14} className={`mr-2 ${loadingStats[event.id] ? 'animate-spin' : ''}`} />
                          {loadingStats[event.id] ? 'Загрузка...' : 'Показать статистику'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}