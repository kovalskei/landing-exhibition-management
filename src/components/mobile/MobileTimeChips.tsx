import { useRef, useEffect } from 'react';

interface MobileTimeChipsProps {
  times: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

export default function MobileTimeChips({ times, selectedTime, onTimeSelect }: MobileTimeChipsProps) {
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chipsRef.current) return;
    const active = chipsRef.current.querySelector('.chip-active');
    if (!active) return;
    const container = chipsRef.current;
    const left = (active as HTMLElement).offsetLeft - (container.clientWidth - (active as HTMLElement).offsetWidth) / 2;
    container.scrollTo({ left, behavior: 'smooth' });
  }, [selectedTime]);

  return (
    <div ref={chipsRef} className="chips">
      {times.map(t => (
        <div
          key={t}
          onClick={() => onTimeSelect(t)}
          className={`chip ${t === selectedTime ? 'chip-active' : ''}`}
        >
          {t}
        </div>
      ))}
    </div>
  );
}