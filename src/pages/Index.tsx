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

      <section id="hero" style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        position: 'relative', 
        overflow: 'hidden',
        paddingTop: '80px'
      }}>
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('https://cdn.poehali.dev/projects/daf53b5d-153d-4ab0-8c8c-b14375e2b34d/files/28289127-dabc-4d7b-aba7-fb686fb72963.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7))'
          }}
        />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '768px' }}>
            <p style={{ 
              color: '#D4AF37',
              fontSize: '26px',
              letterSpacing: '0.25em',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
              marginBottom: '32px',
              textTransform: 'uppercase',
              fontWeight: 800
            }}>
              20 НОЯБРЯ 2025
            </p>
            <h1 style={{
              fontSize: '96px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 30px rgba(0,0,0,0.5), 0 0 40px rgba(59, 130, 246, 0.2)',
              color: 'white',
              textTransform: 'uppercase',
              lineHeight: 0.95,
              marginBottom: '40px'
            }}>
              МАСШТАБНАЯ<br />
              КОНФЕРЕНЦИЯ<br />
              И ВЫСТАВКА
            </h1>
            <div style={{
              width: '97.5%',
              height: '7.5px',
              background: 'linear-gradient(to right, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
              boxShadow: '0 0 25px rgba(79, 70, 229, 0.5)',
              marginBottom: '48px'
            }} />
            <div>
              <div style={{
                display: 'flex',
                gap: '64px',
                fontSize: '30px',
                letterSpacing: '0.03em',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                color: 'white',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                <span>70 ЭКСПОНЕНТОВ</span>
                <span>70 СПИКЕРОВ</span>
              </div>
              <div style={{
                fontSize: '30px',
                letterSpacing: '0.03em',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                color: 'white',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginTop: '8px'
              }}>
                1200 ПОСЕТИТЕЛЕЙ
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" style={{ padding: '96px 0', position: 'relative', backgroundColor: '#0f172a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ 
                fontSize: '60px', 
                fontWeight: 700, 
                marginBottom: '48px', 
                color: 'white',
                position: 'relative',
                display: 'inline-block'
              }}>
                О мероприятии
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '8px',
                  zIndex: -1,
                  background: 'linear-gradient(to right, #4F46E5 0%, #7C3AED 100%)'
                }} />
              </h2>
              <div style={{ marginTop: '32px' }}>
                <p style={{ 
                  fontSize: '20px', 
                  lineHeight: '1.8', 
                  color: 'white', 
                  fontWeight: 400,
                  marginBottom: '32px'
                }}>
                  Поток - это масштабное событие, которое объединяет 2000 руководителей и ведущих специалистов по персоналу.
                </p>
                <p style={{ 
                  fontSize: '20px', 
                  lineHeight: '1.8', 
                  color: 'rgba(255,255,255,0.8)', 
                  fontWeight: 400
                }}>
                  Посетители мероприятия интересуются продуктами и услугами для развития, ищут кейсы и идеи для внедрения в свои компании.
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format"
                alt="Speaker"
                crossOrigin="anonymous"
                style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '48px' }}>
            <img
              src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format"
              alt="Networking"
              crossOrigin="anonymous"
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <img
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format"
              alt="Exhibition"
              crossOrigin="anonymous"
              style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <img
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format"
              alt="Conversation"
              crossOrigin="anonymous"
              style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
        </div>
      </section>

      <section id="audience" style={{ padding: '96px 0', backgroundColor: 'rgba(17, 24, 39, 0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ 
            fontSize: '48px', 
            fontWeight: 700, 
            marginBottom: '64px', 
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            display: 'inline-block',
            width: '100%'
          }}>
            Аудитория мероприятия
            <div style={{
              height: '4px',
              background: 'linear-gradient(to right, #4F46E5 0%, #7C3AED 100%)',
              marginTop: '16px'
            }} />
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', maxWidth: '1000px', margin: '48px auto 0' }}>
            <div style={{ 
              padding: '32px', 
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '72px', fontWeight: 700, color: '#4F46E5', marginBottom: '16px' }}>43%</div>
              <p style={{ fontSize: '16px', color: 'white' }}>Руководители по персоналу, HR-директора, HRBP</p>
            </div>
            <div style={{ 
              padding: '32px', 
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '72px', fontWeight: 700, color: '#7C3AED', marginBottom: '16px' }}>36%</div>
              <p style={{ fontSize: '16px', color: 'white' }}>ТОП-менеджмент, генеральные директора</p>
            </div>
            <div style={{ 
              padding: '32px', 
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '72px', fontWeight: 700, color: '#06B6D4', marginBottom: '16px' }}>21%</div>
              <p style={{ fontSize: '16px', color: 'white' }}>HR-специалисты, HR-менеджеры</p>
            </div>
          </div>
        </div>
      </section>

      <section id="exponent" style={{ padding: '96px 0', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0f1e' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ 
                fontSize: '60px', 
                fontWeight: 700, 
                marginBottom: '16px', 
                color: 'white',
                position: 'relative',
                display: 'inline-block'
              }}>
                №1 «Экспонент»
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '8px',
                  zIndex: -1,
                  background: 'linear-gradient(to right, #4F46E5 0%, #7C3AED 100%)'
                }} />
              </h2>
              <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)', marginBottom: '48px', marginTop: '32px' }}>
                Представить свой продукт/услугу в экспозоне
              </p>

              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '30px', fontWeight: 600, marginBottom: '24px', color: '#6B9FFF' }}>Формат участия</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {['Площадь 2x2 м (4 кв.м.)', '2 бейджа экспонента', 'Логотип участника на сайте с активной ссылкой', 'Место под хранение промо-материалов в отдельной зоне', '2 билета на Конференцию и Выставку', 'Размещение информации о продукте или услуге на сайте мероприятия', 'Сертификат экспонента'].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>
                      <span style={{ color: '#6B9FFF', marginTop: '4px' }}>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '30px', fontWeight: 600, marginBottom: '24px', color: '#6B9FFF' }}>Стоимость</h3>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 700, color: 'white' }}>{exponentData.price_early}</span>
                    <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)' }}>{exponentData.date_early}</span>
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>раннее бронирование</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: 'white' }}>{exponentData.price_regular}</span>
                  <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)' }}>{exponentData.date_regular}</span>
                </div>
              </div>

              <div style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '8px' }}>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 600 }}>Бонус: Маркетинговая поддержка «Экспонент»</span><br/>
                  (включение информации о продукте в рассылки, анонсы)
                </p>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)' }}>
                  Также имеется выставочная площадь 3x2 м (6 кв.м.)<br/>
                  Стоимость уточнять у менеджера
                </p>
              </div>
            </div>

            <div>
              <img 
                src="https://cdn.poehali.dev/files/f6e65250-add3-4632-bed6-68ca8f4d5853.png" 
                alt="Экспонент"
                crossOrigin="anonymous"
                style={{ borderRadius: '8px', width: '100%', height: 'auto', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="conference" style={{ padding: '96px 0', backgroundColor: '#0f172a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ 
            fontSize: '48px', 
            fontWeight: 700, 
            marginBottom: '24px',
            color: 'white',
            position: 'relative',
            display: 'inline-block'
          }}>
            Конференция и Выставка
            <div style={{
              height: '4px',
              background: 'linear-gradient(to right, #4F46E5 0%, #7C3AED 100%)',
              marginTop: '16px'
            }} />
          </h2>
          <p style={{ 
            fontSize: '18px', 
            color: 'rgba(255, 255, 255, 0.6)', 
            marginBottom: '48px', 
            maxWidth: '896px'
          }}>
            На мероприятии представлены самые современные продукты и услуги для развития компаний, российские и зарубежные кейсы
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', maxWidth: '1152px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'white' }}>Платформы:</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Размещение вакансий', 'Автоматизация рекрутинга', 'Онбординг', 'Обучение персонала, e-learning', 'Автоматизация HR-процессов и аналитика', 'Оценка персонала', 'Well-being платформы', 'AR/VR обучение', 'Биржи фриланса и поиска сотрудников на смену', 'Сервисы для автоматизации выплат и зарплаты'].map((item, i) => (
                  <li key={i} style={{ marginBottom: '12px', fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)' }}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'white' }}>Услуги:</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Поиск и подбор персонала', 'Корпоративное обучение', 'Создание курсов, тестов, вебинаров', 'Оценка персонала', 'Управление изменениями, стратегии', 'HR-консалтинг', 'Телемедицина для сотрудников', 'Психологическая диагностика сотрудников', 'Корпоративная культура', 'Бренд работодателя'].map((item, i) => (
                  <li key={i} style={{ marginBottom: '12px', fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '48px', textAlign: 'right', maxWidth: '1152px' }}>
            <p style={{ fontSize: '48px', fontWeight: 700, background: 'linear-gradient(to right, #4F46E5, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>БОЛЕЕ 50</p>
            <p style={{ fontSize: '20px', fontWeight: 600, color: 'white' }}>КОМПАНИЙ И ПРОЕКТОВ</p>
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