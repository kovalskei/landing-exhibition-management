import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface MobileHeaderProps {
  title: string;
  date?: string;
  venue?: string;
  onMenuToggle: () => void;
}

export default function MobileHeader({
  title,
  date,
  venue,
  onMenuToggle
}: MobileHeaderProps) {
  return (
    <div className="m-top">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="m-title flex-1 mb-0">
          {title}
        </h1>
        <button onClick={onMenuToggle} className="m-pill flex-shrink-0">
          <Icon name="Menu" size={20} />
        </button>
      </div>
      {(date || venue) && (
        <div className="text-sm text-[var(--muted)]">
          {date && <span>{date}</span>}
          {date && venue && <span> • </span>}
          {venue && <span>{venue}</span>}
        </div>
      )}
    </div>
  );
}