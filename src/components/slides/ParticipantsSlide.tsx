export function ParticipantsSlide() {
  const participants = [
    'Avito Работа', 'Avito Подработка × GigAnt', 'Рокет Ворк', 'ПУЛЬС', 'СБЕР ЗДОРОВЬЕ КОМПАНИЯМ',
    'КВИО', 'HOMEOFFICE', 'ГРАНЬ.РФ', 'Teal HR', 'Я ПОНИМАЮ',
    'AON', 'ЭКИПСИ', 'HR Lab', 'examus', 'highlight',
    'FriendWork', 'HRBOX', 'T/&/D/G', 'StartExam', 'KWORK',
    'HAPPY JOB', 'HR Prime', 'TSQ Consulting', 'Jalinga', 'WHEN SPEAK',
    'intella', 'talent.Q', 'TEMPi', 'HintEd', 'WEBSOFT', 'Dаoffice', 'ФИТМОСТ'
  ];

  return (
    <div className="h-full w-full flex flex-col justify-start px-6 py-12 bg-background overflow-y-auto">
      <h2 className="font-heading font-bold text-3xl mb-4 gradient-border pb-3">Наши участники мероприятий</h2>
      <p className="text-sm text-muted-foreground mb-6">в форматах с выступлениями и стендами</p>
      <div className="grid grid-cols-2 gap-3">
        {participants.map((name, i) => (
          <div key={i} className="bg-card p-3 rounded-lg border border-border text-center text-xs font-semibold">
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
