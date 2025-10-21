import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

const SLIDES_COUNT = 5;

export default function Index() {
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES_COUNT);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES_COUNT) % SLIDES_COUNT);

  if (isMobile) {
    return <MobileStories currentSlide={currentSlide} nextSlide={nextSlide} prevSlide={prevSlide} />;
  }

  return <DesktopLanding />;
}

function MobileStories({ currentSlide, nextSlide, prevSlide }: { currentSlide: number; nextSlide: () => void; prevSlide: () => void }) {
  const slides = [
    <HeroSlide key="hero" />,
    <AboutSlide key="about" />,
    <AudienceSlide key="audience" />,
    <ConferenceSlide key="conference" />,
    <ParticipantsSlide key="participants" />
  ];

  return (
    <div className="h-screen w-full bg-background overflow-hidden relative">
      <div className="absolute top-4 left-0 right-0 z-20 flex gap-1 px-4">
        {Array.from({ length: SLIDES_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i === currentSlide ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="h-full w-full" onClick={nextSlide}>
        <div className="absolute left-4 top-1/2 z-10" onClick={(e) => { e.stopPropagation(); prevSlide(); }}>
          <Icon name="ChevronLeft" className="text-white/50" size={32} />
        </div>
        <div className="absolute right-4 top-1/2 z-10">
          <Icon name="ChevronRight" className="text-white/50" size={32} />
        </div>
        {slides[currentSlide]}
      </div>
    </div>
  );
}

function HeroSlide() {
  return (
    <div className="h-full w-full flex flex-col justify-center items-start px-6 py-12 bg-gradient-to-br from-background via-background to-primary/10">
      <p className="text-gold text-sm font-semibold tracking-wider mb-4">20 НОЯБРЯ 2025</p>
      <h1 className="font-heading font-bold text-4xl leading-tight mb-6">
        МАСШТАБНАЯ <br />
        КОНФЕРЕНЦИЯ <br />
        И ВЫСТАВКА
      </h1>
      <div className="gradient-border pb-4 mb-6 w-full" />
      <div className="space-y-2 text-lg">
        <p className="font-semibold">70 ЭКСПОНЕНТОВ</p>
        <p className="font-semibold">70 СПИКЕРОВ</p>
        <p className="font-semibold">1200 ПОСЕТИТЕЛЕЙ</p>
      </div>
    </div>
  );
}

function AboutSlide() {
  return (
    <div className="h-full w-full flex flex-col justify-center px-6 py-12 bg-background">
      <h2 className="font-heading font-bold text-3xl mb-6 gradient-border pb-3">О мероприятии</h2>
      <p className="text-base leading-relaxed mb-4">
        Поток - это масштабное событие, которое объединяет 2000 руководителей и ведущих специалистов по персоналу.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Посетители мероприятия интересуются продуктами и услугами для развития, ищут кейсы и идеи для внедрения в свои компании.
      </p>
    </div>
  );
}

function AudienceSlide() {
  return (
    <div className="h-full w-full flex flex-col justify-center px-6 py-12 bg-background">
      <h2 className="font-heading font-bold text-3xl mb-8 gradient-border pb-3">Аудитория мероприятия</h2>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-primary">43%</div>
          <p className="text-sm flex-1">Руководители по персоналу, HR-директора, HRBP</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-secondary">36%</div>
          <p className="text-sm flex-1">ТОП-менеджмент, генеральные директора</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-accent">21%</div>
          <p className="text-sm flex-1">HR-специалисты, HR-менеджеры</p>
        </div>
      </div>
    </div>
  );
}

function ConferenceSlide() {
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

function ParticipantsSlide() {
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

function DesktopLanding() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-heading font-bold text-2xl gradient-text">ПОТОК 2025</div>
          <div className="flex gap-8">
            <a href="#about" className="text-sm hover:text-primary transition-colors">О мероприятии</a>
            <a href="#audience" className="text-sm hover:text-primary transition-colors">Аудитория</a>
            <a href="#conference" className="text-sm hover:text-primary transition-colors">Конференция</a>
            <a href="#participants" className="text-sm hover:text-primary transition-colors">Участники</a>
            <a href="#contact" className="text-sm hover:text-primary transition-colors">Контакты</a>
          </div>
        </div>
      </nav>

      <section className="min-h-screen flex items-center justify-start relative overflow-hidden pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://cdn.poehali.dev/projects/daf53b5d-153d-4ab0-8c8c-b14375e2b34d/files/ac507beb-835a-42d8-9449-0df63e3039bd.jpg')`,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
            backgroundBlendMode: 'overlay'
          }}
        />
        <div className="container mx-auto px-12 relative z-10">
          <div className="max-w-3xl animate-fade-in">
            <p 
              className="tracking-[0.25em] mb-8 uppercase text-4xl font-extrabold"
              style={{ 
                color: '#D4AF37',
                fontSize: '26px',
                letterSpacing: '0.25em',
                textShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
              }}
            >
              20 НОЯБРЯ 2025
            </p>
            <h1 
              className="font-heading font-black leading-[0.95] mb-10 text-white uppercase text-7xl"
              style={{
                fontSize: '96px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                textShadow: '0 4px 30px rgba(0,0,0,0.5), 0 0 40px rgba(59, 130, 246, 0.2)'
              }}
            >
              МАСШТАБНАЯ<br />
              КОНФЕРЕНЦИЯ<br />
              И ВЫСТАВКА
            </h1>
            <div className="w-[97.5%] h-[7.5px] mb-12" style={{
              background: 'linear-gradient(to right, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
              boxShadow: '0 0 25px rgba(79, 70, 229, 0.5)'
            }} />
            <div className="space-y-2">
              <div className="flex gap-16 font-bold text-white uppercase" style={{
                fontSize: '30px',
                letterSpacing: '0.03em',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}>
                <span>70 ЭКСПОНЕНТОВ</span>
                <span>70 СПИКЕРОВ</span>
              </div>
              <div className="font-bold text-white uppercase" style={{
                fontSize: '30px',
                letterSpacing: '0.03em',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}>
                1200 ПОСЕТИТЕЛЕЙ
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-24 relative">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
            backgroundBlendMode: 'overlay',
            pointerEvents: 'none'
          }}
        />
        <div className="container mx-auto px-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-20 items-start">
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-6xl mb-12 text-white relative inline-block">
                О мероприятии
                <div className="absolute bottom-0 left-0 w-full h-[8px]" style={{
                  background: 'linear-gradient(to right, #4F46E5 0%, #7C3AED 100%)'
                }} />
              </h2>
              <div className="space-y-8 mt-8">
                <p className="text-xl leading-relaxed text-white font-normal">
                  Поток - это масштабное событие, которое объединяет 2000 руководителей и ведущих специалистов по персоналу.
                </p>
                <p className="text-xl leading-relaxed text-white/80 font-normal">
                  Посетители мероприятия интересуются продуктами и услугами для развития, ищут кейсы и идеи для внедрения в свои компании.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://cdn.poehali.dev/projects/daf53b5d-153d-4ab0-8c8c-b14375e2b34d/files/7654e33a-fc9a-46c5-a5a0-a3db02695766.jpg"
                alt="Speaker"
                className="w-full h-[500px] object-cover rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-12">
            <img
              src="https://cdn.poehali.dev/projects/daf53b5d-153d-4ab0-8c8c-b14375e2b34d/files/25a31e94-8d84-4f73-a0ec-8f9fd409d28c.jpg"
              alt="Networking"
              className="w-full h-[280px] object-cover rounded-lg"
            />
            <img
              src="https://cdn.poehali.dev/projects/daf53b5d-153d-4ab0-8c8c-b14375e2b34d/files/b422f665-8127-4557-bd8f-998890904df5.jpg"
              alt="Exhibition"
              className="w-full h-[280px] object-cover rounded-lg"
            />
            <img
              src="https://cdn.poehali.dev/projects/daf53b5d-153d-4ab0-8c8c-b14375e2b34d/files/41a88ad5-0e5c-45ae-9f90-d7a19b6a31ee.jpg"
              alt="Conversation"
              className="w-full h-[280px] object-cover rounded-lg"
            />
          </div>
        </div>
      </section>

      <section id="audience" className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <h2 className="font-heading font-bold text-5xl mb-16 text-center gradient-border pb-4 inline-block">
            Аудитория мероприятия
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-12">
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-center animate-fade-in">
              <div className="text-7xl font-bold text-primary mb-4">43%</div>
              <p className="text-base">Руководители по персоналу, HR-директора, HRBP</p>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 text-center animate-fade-in">
              <div className="text-7xl font-bold text-secondary mb-4">36%</div>
              <p className="text-base">ТОП-менеджмент, генеральные директора</p>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 text-center animate-fade-in">
              <div className="text-7xl font-bold text-accent mb-4">21%</div>
              <p className="text-base">HR-специалисты, HR-менеджеры</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="conference" className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="font-heading font-bold text-5xl mb-6 gradient-border pb-4 inline-block">
            Конференция и Выставка
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-4xl">
            На мероприятии представлены самые современные продукты и услуги для развития компаний, российские и зарубежные кейсы
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl">
            <div>
              <h3 className="font-heading font-semibold text-xl mb-6">Платформы:</h3>
              <ul className="space-y-3 text-base">
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
              <h3 className="font-heading font-semibold text-xl mb-6">Услуги:</h3>
              <ul className="space-y-3 text-base">
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

          <div className="mt-12 text-right max-w-6xl">
            <p className="text-5xl font-bold gradient-text">БОЛЕЕ 50</p>
            <p className="text-xl font-semibold">КОМПАНИЙ И ПРОЕКТОВ</p>
          </div>
        </div>
      </section>

      <section id="participants" className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <h2 className="font-heading font-bold text-5xl mb-6 text-center gradient-border pb-4 inline-block">
            Наши участники мероприятий
          </h2>
          <p className="text-center text-muted-foreground mb-12">в форматах с выступлениями и стендами</p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 max-w-6xl mx-auto">
            {[
              'Avito Работа', 'Avito Подработка × GigAnt', 'Рокет Ворк', 'ПУЛЬС', 'СБЕР ЗДОРОВЬЕ КОМПАНИЯМ', 'КВИО',
              'HOMEOFFICE', 'ГРАНЬ.РФ', 'Teal HR', 'Я ПОНИМАЮ', 'AON', 'ЭКИПСИ',
              'HR Lab', 'examus', 'highlight', 'FriendWork', 'HRBOX', 'T/&/D/G',
              'StartExam', 'KWORK', 'HAPPY JOB', 'HR Prime', 'TSQ Consulting', 'Jalinga',
              'WHEN SPEAK', 'intella', 'talent.Q', 'TEMPi', 'HintEd', 'WEBSOFT',
              'Dаoffice', 'ФИТМОСТ'
            ].map((name, i) => (
              <Card
                key={i}
                className="p-6 bg-card hover:bg-card/80 border-border hover:border-primary/50 transition-all text-center flex items-center justify-center min-h-24 font-semibold text-sm"
              >
                {name}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading font-bold text-5xl mb-8 text-center gradient-border pb-4 inline-block">
              Свяжитесь с нами
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6 mt-12">
              <div>
                <label className="text-sm font-semibold mb-2 block">Имя</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ваше имя"
                  className="bg-card border-border"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="bg-card border-border"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Сообщение</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Расскажите о ваших планах участия..."
                  className="bg-card border-border min-h-32"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold"
              >
                Отправить заявку
              </Button>
            </form>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border bg-card/30">
        <div className="container mx-auto px-6 text-center">
          <div className="font-heading font-bold text-2xl gradient-text mb-4">ПОТОК 2025</div>
          <p className="text-sm text-muted-foreground">20 ноября 2025 · Москва</p>
        </div>
      </footer>
    </div>
  );
}