export function ConferenceSlide() {
  return (
    <div className="h-full w-full flex flex-col justify-start px-6 py-12 bg-background overflow-y-auto">
      <h2 className="font-heading font-bold text-3xl mb-4 gradient-border pb-3">Конференция и Выставка</h2>
      <p className="text-sm text-muted-foreground mb-6">
        На мероприятии представлены самые современные продукты и услуги для развития компаний, российские и зарубежные кейсы
      </p>
      
      <div className="grid grid-cols-2 gap-6 text-xs mb-8">
        <div>
          <h3 className="font-semibold mb-3">Платформы:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>Размещение вакансий</li>
            <li>Автоматизация рекрутинга</li>
            <li>Онбординг</li>
            <li>Обучение персонала, e-learning</li>
            <li>Автоматизация HR-процессов и аналитика</li>
            <li>Оценка персонала</li>
            <li>Well-being платформы</li>
            <li>AR/VR обучение</li>
            <li>Биржи фриланса и поиска сотрудников на смену</li>
            <li>Сервисы для автоматизации выплат и зарплаты</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Услуги:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>Поиск и подбор персонала</li>
            <li>Корпоративное обучение</li>
            <li>Создание курсов, тестов, вебинаров</li>
            <li>Оценка персонала</li>
            <li>Управление изменениями, стратегии</li>
            <li>HR-консалтинг</li>
            <li>Телемедицина для сотрудников</li>
            <li>Психологическая диагностика сотрудников</li>
            <li>Корпоративная культура</li>
            <li>Бренд работодателя</li>
          </ul>
        </div>
      </div>

      <div className="text-right mt-4">
        <p className="text-2xl font-bold gradient-text">БОЛЕЕ 50</p>
        <p className="text-sm font-semibold">КОМПАНИЙ</p>
        <p className="text-sm font-semibold">И ПРОЕКТОВ</p>
      </div>
    </div>
  );
}
