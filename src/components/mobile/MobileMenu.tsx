import Icon from '@/components/ui/icon';

interface MobileMenuProps {
  exportingPdf: boolean;
  theme: 'light' | 'dark';
  searchQuery: string;
  refreshing: boolean;
  onClose: () => void;
  onExportPdf: () => void;
  onToggleTheme: () => void;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
}

export default function MobileMenu({
  exportingPdf,
  theme,
  searchQuery,
  refreshing,
  onClose,
  onExportPdf,
  onToggleTheme,
  onSearchChange,
  onRefresh
}: MobileMenuProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">
          <Icon name="X" size={24} />
        </button>

        <h2 className="modal-title mb-4">Меню</h2>

        <div className="space-y-3">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Поиск по программе..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--line)] rounded-lg bg-[var(--panel)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="menu-btn"
          >
            <Icon name={refreshing ? 'Loader2' : 'RefreshCw'} size={18} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Обновление...' : 'Обновить программу'}
          </button>

          <button
            onClick={onExportPdf}
            disabled={exportingPdf}
            className="menu-btn"
          >
            <Icon name={exportingPdf ? 'Loader2' : 'FileDown'} size={18} className={exportingPdf ? 'animate-spin' : ''} />
            {exportingPdf ? 'Генерация PDF...' : 'Скачать PDF'}
          </button>

          <button
            onClick={onToggleTheme}
            className="menu-btn"
          >
            <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
        </div>
      </div>
    </div>
  );
}