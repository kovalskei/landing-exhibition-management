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
    <ParticipantsSlide key="participants" />,
    <PricingSlide key="pricing" />
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
      <p className="text-accent text-sm font-semibold tracking-wider mb-4">20 НОЯБРЯ 2025</p>
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

function ParticipantsSlide() {
  const participants = [
    'Avito', 'Рокет Ворк', 'ПУЛЬС', 'КВИО', 'HOMEOFFICE',
    'ГРАНЬ.РФ', 'Teal HR', 'Я ПОНИМАЮ', 'AON', 'ЭКИПСИ',
    'HR Lab', 'examus', 'highlight', 'FriendWork', 'HRBOX'
  ];

  return (
    <div className="h-full w-full flex flex-col justify-center px-6 py-12 bg-background overflow-y-auto">
      <h2 className="font-heading font-bold text-3xl mb-6 gradient-border pb-3">Наши участники</h2>
      <p className="text-sm text-muted-foreground mb-6">в форматах с выступлениями и стендами</p>
      <div className="grid grid-cols-2 gap-4">
        {participants.map((name, i) => (
          <div key={i} className="bg-card p-4 rounded-lg border border-border text-center text-sm font-semibold">
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingSlide() {
  return (
    <div className="h-full w-full flex flex-col justify-center px-6 py-12 bg-background">
      <h2 className="font-heading font-bold text-3xl mb-6 gradient-border pb-3">Цены</h2>
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <h3 className="font-heading font-bold text-xl mb-4">Стандартный стенд</h3>
        <div className="text-4xl font-bold gradient-text mb-2">250 000 ₽</div>
        <p className="text-sm text-muted-foreground mb-6">Действует до 15 ноября</p>
        <Button className="w-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold">
          Забронировать
        </Button>
      </Card>
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
            <a href="#participants" className="text-sm hover:text-primary transition-colors">Участники</a>
            <a href="#pricing" className="text-sm hover:text-primary transition-colors">Цены</a>
            <a href="#contact" className="text-sm hover:text-primary transition-colors">Контакты</a>
          </div>
        </div>
      </nav>

      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl animate-fade-in">
            <p className="text-accent text-lg font-semibold tracking-wider mb-6">20 НОЯБРЯ 2025</p>
            <h1 className="font-heading font-extrabold text-7xl leading-tight mb-8">
              МАСШТАБНАЯ<br />
              КОНФЕРЕНЦИЯ<br />
              И ВЫСТАВКА
            </h1>
            <div className="gradient-border pb-6 mb-8" />
            <div className="flex gap-12 text-2xl mb-12">
              <div className="flex items-center gap-3">
                <Icon name="Users" className="text-primary" size={32} />
                <span className="font-semibold">70 ЭКСПОНЕНТОВ</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="Mic" className="text-secondary" size={32} />
                <span className="font-semibold">70 СПИКЕРОВ</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="UserCheck" className="text-accent" size={32} />
                <span className="font-semibold">1200 ПОСЕТИТЕЛЕЙ</span>
              </div>
            </div>
            <Button size="lg" className="bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold px-8 py-6 text-lg">
              Стать участником
            </Button>
          </div>
        </div>
      </section>

      <section id="about" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-5xl mb-8 gradient-border pb-4">О мероприятии</h2>
              <p className="text-lg leading-relaxed mb-6">
                Поток - это масштабное событие, которое объединяет 2000 руководителей и ведущих специалистов по персоналу.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Посетители мероприятия интересуются продуктами и услугами для развития, ищут кейсы и идеи для внедрения в свои компании.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://cdn.poehali.dev/files/58ef7c9e-a8d7-4e1e-bf3b-7681f3726475.png"
                alt="Event"
                className="w-full h-64 object-cover rounded-lg"
              />
              <img
                src="https://cdn.poehali.dev/files/58ef7c9e-a8d7-4e1e-bf3b-7681f3726475.png"
                alt="Event"
                className="w-full h-64 object-cover rounded-lg mt-8"
              />
            </div>
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

      <section id="participants" className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="font-heading font-bold text-5xl mb-6 text-center gradient-border pb-4 inline-block">
            Наши участники мероприятий
          </h2>
          <p className="text-center text-muted-foreground mb-12">в форматах с выступлениями и стендами</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {[
              'Avito Работа', 'Avito Подработка × GigAnt', 'Рокет Ворк', 'ПУЛЬС', 'СБЕР ЗДОРОВЬЕ',
              'КВИО', 'HOMEOFFICE', 'ГРАНЬ.РФ', 'Teal HR', 'Я ПОНИМАЮ',
              'AON', 'ЭКИПСИ', 'HR Lab', 'examus', 'highlight',
              'FriendWork', 'HRBOX', 'T/&/D/G', 'StartExam', 'KWORK',
              'HAPPY JOB', 'HR Prime', 'TSQ Consulting', 'Jalinga', 'WHEN SPEAK',
              'intella', 'talent.Q', 'TEMPi', 'HintEd', 'WEBSOFT'
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

      <section id="pricing" className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <h2 className="font-heading font-bold text-5xl mb-16 text-center gradient-border pb-4 inline-block">Цены</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <h3 className="font-heading font-bold text-2xl mb-6">Стандартный стенд</h3>
              <div className="text-5xl font-bold gradient-text mb-3">250 000 ₽</div>
              <p className="text-sm text-muted-foreground mb-8">Действует до 15 ноября</p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-primary mt-1" size={16} />
                  <span>Площадь 9 м²</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-primary mt-1" size={16} />
                  <span>Стандартное оборудование</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-primary mt-1" size={16} />
                  <span>Брендирование стенда</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                Забронировать
              </Button>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-secondary/10 to-accent/10 border-secondary/20 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                ПОПУЛЯРНЫЙ
              </div>
              <h3 className="font-heading font-bold text-2xl mb-6">VIP стенд</h3>
              <div className="text-5xl font-bold gradient-text mb-3">500 000 ₽</div>
              <p className="text-sm text-muted-foreground mb-8">Действует до 15 ноября</p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-secondary mt-1" size={16} />
                  <span>Площадь 18 м²</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-secondary mt-1" size={16} />
                  <span>Premium оборудование</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-secondary mt-1" size={16} />
                  <span>Приоритетное расположение</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-secondary mt-1" size={16} />
                  <span>Выступление спикера</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-secondary to-accent text-white font-semibold">
                Забронировать
              </Button>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
              <h3 className="font-heading font-bold text-2xl mb-6">Индивидуальный</h3>
              <div className="text-5xl font-bold gradient-text mb-3">От 750 000 ₽</div>
              <p className="text-sm text-muted-foreground mb-8">Под ваши задачи</p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-accent mt-1" size={16} />
                  <span>Площадь от 25 м²</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-accent mt-1" size={16} />
                  <span>Индивидуальный дизайн</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-accent mt-1" size={16} />
                  <span>Эксклюзивная локация</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" className="text-accent mt-1" size={16} />
                  <span>Полный пакет возможностей</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-accent to-primary text-white font-semibold">
                Обсудить детали
              </Button>
            </Card>
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
