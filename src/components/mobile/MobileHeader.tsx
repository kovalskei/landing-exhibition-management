import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface MobileHeaderProps {
  title: string;
  date?: string;
  venue?: string;
  searchQuery: string;
  refreshing: boolean;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onMenuToggle: () => void;
}

export default function MobileHeader({
  title,
  date,
  venue,
  searchQuery,
  refreshing,
  onSearchChange,
  onRefresh,
  onMenuToggle
}: MobileHeaderProps) {
  return (
    <div className="m-top">
      <h1 className="m-title">{title}</h1>
      {(date || venue) && (
        <div className="text-sm text-[var(--muted)] mb-3">
          {date && <span>{date}</span>}
          {date && venue && <span> • </span>}
          {venue && <span>{venue}</span>}
        </div>
      )}
      <div className="m-row">
        <div className="m-search">
          <Icon name="Search" size={18} style={{ color: 'var(--muted)', marginRight: 8 }} />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          onClick={onRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="m-pill"
        >
          <Icon name={refreshing ? 'Loader2' : 'RefreshCw'} size={18} className={refreshing ? 'animate-spin' : ''} />
        </Button>
        <button onClick={onMenuToggle} className="m-pill">
          <Icon name="Menu" size={18} />
        </button>
      </div>
    </div>
  );
}
