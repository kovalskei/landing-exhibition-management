import Icon from '@/components/ui/icon';
import { HeroSlide } from './slides/HeroSlide';
import { AboutSlide } from './slides/AboutSlide';
import { AudienceSlide } from './slides/AudienceSlide';
import { ConferenceSlide } from './slides/ConferenceSlide';
import { ParticipantsSlide } from './slides/ParticipantsSlide';

const SLIDES_COUNT = 5;

interface MobileStoriesProps {
  currentSlide: number;
  nextSlide: () => void;
  prevSlide: () => void;
}

export function MobileStories({ currentSlide, nextSlide, prevSlide }: MobileStoriesProps) {
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
