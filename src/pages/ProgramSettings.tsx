import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ProgramEvent {
  id: string;
  name: string;
  sheetUrl: string;
  createdAt: string;
}

export default function ProgramSettings() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ProgramEvent[]>([]);
  const [newEventName, setNewEventName] = useState('');
  const [newEventUrl, setNewEventUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('programEvents');
    if (stored) {
      setEvents(JSON.parse(stored));
    }
  }, []);

  const saveEvents = (updatedEvents: ProgramEvent[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('programEvents', JSON.stringify(updatedEvents));
  };

  const addEvent = () => {
    if (!newEventName.trim() || !newEventUrl.trim()) return;

    const newEvent: ProgramEvent = {
      id: Date.now().toString(),
      name: newEventName.trim(),
      sheetUrl: newEventUrl.trim(),
      createdAt: new Date().toISOString()
    };

    saveEvents([...events, newEvent]);
    setNewEventName('');
    setNewEventUrl('');
  };

  const deleteEvent = (id: string) => {
    if (confirm('Удалить это событие?')) {
      saveEvents(events.filter(e => e.id !== id));
    }
  };

  const updateEvent = (id: string, name: string, url: string) => {
    saveEvents(events.map(e => 
      e.id === id ? { ...e, name, sheetUrl: url } : e
    ));
    setEditingId(null);
  };

  const setAsDefault = (url: string) => {
    localStorage.setItem('defaultProgramSheet', url);
    alert('Источник данных установлен по умолчанию');
  };

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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const name = (document.getElementById(`name-${event.id}`) as HTMLInputElement).value;
                          const url = (document.getElementById(`url-${event.id}`) as HTMLInputElement).value;
                          updateEvent(event.id, name, url);
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
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          localStorage.setItem('currentProgramSheet', event.sheetUrl);
                          navigate('/program');
                        }}
                      >
                        <Icon name="Eye" size={14} className="mr-1" />
                        Открыть
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAsDefault(event.sheetUrl)}
                      >
                        <Icon name="Star" size={14} className="mr-1" />
                        По умолчанию
                      </Button>
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
