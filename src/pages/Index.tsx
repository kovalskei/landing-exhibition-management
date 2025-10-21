import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { exportSiteToPdf } from '@/utils/exportToPdf';

const SLIDES_COUNT = 5;
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1e7Wxc3Yhrk9N4_fA3ox2S_ksG1IONPrjNNFq7BIpcvE/edit?usp=sharing';

export default function Index() {
  const { data: exponentData } = useGoogleSheets(GOOGLE_SHEET_URL);
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

  return <DesktopLanding exponentData={exponentData} />;
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

function DesktopLanding({ exponentData }: { exponentData: { price_early: string; date_early: string; price_regular: string; date_regular: string } }) {
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
          <div className="flex gap-8 items-center">
            <a href="#about" className="text-sm hover:text-primary transition-colors">О мероприятии</a>
            <a href="#audience" className="text-sm hover:text-primary transition-colors">Аудитория</a>
            <a href="#conference" className="text-sm hover:text-primary transition-colors">Конференция</a>
            <a href="#participants" className="text-sm hover:text-primary transition-colors">Участники</a>
            <a href="#contact" className="text-sm hover:text-primary transition-colors">Контакты</a>
            <Button onClick={exportSiteToPdf} variant="outline" size="sm" className="ml-4">
              <Icon name="Download" size={16} className="mr-2" />
              Скачать PDF
            </Button>
          </div>
        </div>
      </nav>

      <section id="hero" className="min-h-screen flex items-center justify-start relative overflow-hidden pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/hero-bg')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
        <div className="container mx-auto px-12 relative z-10">
          <div className="max-w-3xl">
            <p className="text-[#D4AF37] text-[26px] tracking-[0.25em] mb-8 uppercase font-extrabold">
              20 НОЯБРЯ 2025
            </p>
            <h1 className="font-heading font-black text-[96px] leading-[0.95] mb-10 text-white uppercase tracking-tight">
              МАСШТАБНАЯ<br />
              КОНФЕРЕНЦИЯ<br />
              И ВЫСТАВКА
            </h1>
            <div className="w-[97.5%] h-[7.5px] mb-12 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#06B6D4]" />
            <div className="space-y-2">
              <div className="flex gap-16 text-[30px] tracking-[0.03em] font-bold text-white uppercase">
                <span>70 ЭКСПОНЕНТОВ</span>
                <span>70 СПИКЕРОВ</span>
              </div>
              <div className="text-[30px] tracking-[0.03em] font-bold text-white uppercase">
                1200 ПОСЕТИТЕЛЕЙ
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-24 relative bg-[#0f172a]">
        <div className="container mx-auto px-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-20 items-start">
            <div>
              <h2 className="font-heading font-bold text-6xl mb-12 text-white relative inline-block">
                О мероприятии
                <div className="absolute bottom-0 left-0 w-full h-[8px] -z-10 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" />
              </h2>
              <div className="space-y-8 mt-8">
                <p className="text-xl leading-relaxed text-white">
                  Поток - это масштабное событие, которое объединяет 2000 руководителей и ведущих специалистов по персоналу.
                </p>
                <p className="text-xl leading-relaxed text-white/80">
                  Посетители мероприятия интересуются продуктами и услугами для развития, ищут кейсы и идеи для внедрения в свои компании.
                </p>
              </div>
            </div>
            <div>
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
              className="w-full h-[200px] object-cover rounded-lg"
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
          <h2 className="font-heading font-bold text-5xl mb-16 text-center text-white w-full">
            Аудитория мероприятия
            <div className="h-1 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] mt-4 mx-auto max-w-md" />
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-12">
            <Card className="p-8 bg-gradient-to-br from-[#4F46E5]/10 to-[#4F46E5]/5 border-[#4F46E5]/20 text-center">
              <div className="text-7xl font-bold text-[#4F46E5] mb-4">43%</div>
              <p className="text-base text-white">Руководители по персоналу, HR-директора, HRBP</p>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-[#7C3AED]/10 to-[#7C3AED]/5 border-[#7C3AED]/20 text-center">
              <div className="text-7xl font-bold text-[#7C3AED] mb-4">36%</div>
              <p className="text-base text-white">ТОП-менеджмент, генеральные директора</p>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-[#06B6D4]/10 to-[#06B6D4]/5 border-[#06B6D4]/20 text-center">
              <div className="text-7xl font-bold text-[#06B6D4] mb-4">21%</div>
              <p className="text-base text-white">HR-специалисты, HR-менеджеры</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="exponent" className="py-24 relative overflow-hidden bg-[#0a0f1e]">
        <div className="container mx-auto px-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-heading font-bold text-6xl mb-4 text-white relative inline-block">
                №1 «Экспонент»
                <div className="absolute bottom-0 left-0 w-full h-[8px] -z-10 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" />
              </h2>
              <p className="text-xl text-white/90 mb-12 mt-8">
                Представить свой продукт/услугу в экспозоне
              </p>

              <div className="mb-10">
                <h3 className="text-3xl font-semibold mb-6 text-[#6B9FFF]">Формат участия</h3>
                <ul className="space-y-4 text-lg text-white/90">
                  <li className="flex items-start gap-3">
                    <span className="text-[#6B9FFF] mt-1">•</span>
                    <span>Площадь 2x2 м (4 кв.м.)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#6B9FFF] mt-1">•</span>
                    <span>2 бейджа экспонента</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#6B9FFF] mt-1">•</span>
                    <span>Логотип участника на сайте с активной ссылкой</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#6B9FFF] mt-1">•</span>
                    <span>Место под хранение промо-материалов в отдельной зоне</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#6B9FFF] mt-1">•</span>
                    <span>2 билета на Конференцию и Выставку</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#6B9FFF] mt-1">•</span>
                    <span>Размещение информации о продукте или услуге на сайте мероприятия</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#6B9FFF] mt-1">•</span>
                    <span>Сертификат экспонента</span>
                  </li>
                </ul>
              </div>

              <div className="mb-10">
                <h3 className="text-3xl font-semibold mb-6 text-[#6B9FFF]">Стоимость</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-white">{exponentData.price_early}</span>
                    <span className="text-xl text-white/70">{exponentData.date_early}</span>
                    <span className="text-sm text-white/50 ml-2">раннее бронирование</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-white">{exponentData.price_regular}</span>
                    <span className="text-xl text-white/70">{exponentData.date_regular}</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/20 bg-black/40 p-6 rounded-lg">
                <p className="text-base text-white/90 mb-4">
                  <span className="font-semibold">Бонус: Маркетинговая поддержка «Экспонент»</span><br/>
                  (включение информации о продукте в рассылки, анонсы)
                </p>
                <p className="text-base text-white/80">
                  Также имеется выставочная площадь 3x2 м (6 кв.м.)<br/>
                  Стоимость уточнять у менеджера
                </p>
              </div>
            </div>

            <div>
              <img 
                src="https://cdn.poehali.dev/files/f6e65250-add3-4632-bed6-68ca8f4d5853.png" 
                alt="Экспонент"
                className="rounded-lg w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="conference" className="py-24 bg-[#0f172a]">
        <div className="container mx-auto px-6">
          <h2 className="font-heading font-bold text-5xl mb-6 text-white w-full">
            Конференция и Выставка
            <div className="h-1 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] mt-4 max-w-2xl" />
          </h2>
          <p className="text-lg text-white/60 mb-12 max-w-4xl">
            На мероприятии представлены самые современные продукты и услуги для развития компаний, российские и зарубежные кейсы
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl">
            <div>
              <h3 className="text-xl font-semibold mb-6 text-white">Платформы:</h3>
              <ul className="space-y-3 text-base text-white/90">
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
              <h3 className="text-xl font-semibold mb-6 text-white">Услуги:</h3>
              <ul className="space-y-3 text-base text-white/90">
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
            <p className="text-5xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">БОЛЕЕ 50</p>
            <p className="text-xl font-semibold text-white">КОМПАНИЙ И ПРОЕКТОВ</p>
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