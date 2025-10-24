import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getTagCanonMap } from '@/utils/googleSheetsParser';

interface ProgramHeaderProps {
  title: string;
  date?: string;
  venue?: string;
  refreshing: boolean;
  generatingPdf: boolean;
  tagDropdownOpen: boolean;
  selectedTags: Set<string>;
  showPlan: boolean;
  theme: 'light' | 'dark';
  viewMode: 'table' | 'cards';
  onRefresh: () => void;
  onDownloadPdf: () => void;
  onToggleTagDropdown: () => void;
  onTagsChange: (tags: Set<string>) => void;
  onTogglePlan: () => void;
  onToggleTheme: () => void;
  onViewModeChange: (mode: 'table' | 'cards') => void;
}

export default function ProgramHeader({
  title,
  date,
  venue,
  refreshing,
  generatingPdf,
  tagDropdownOpen,
  selectedTags,
  showPlan,
  theme,
  viewMode,
  onRefresh,
  onDownloadPdf,
  onToggleTagDropdown,
  onTagsChange,
  onTogglePlan,
  onToggleTheme,
  onViewModeChange
}: ProgramHeaderProps) {
  const tagCanonMap = getTagCanonMap();
  const allCanons = Object.keys(tagCanonMap).sort();

  return (
    <div className="sticky top-0 bg-[var(--bg)] border-b border-[var(--line)] pb-3 mb-5 z-50">
      <style>{`
        .program-button {
          background: var(--button-bg);
          border: 1px solid var(--button-border);
          color: var(--button-text);
        }
        .program-button:hover:not(:disabled) {
          background: var(--button-hover);
        }
        .view-mode-button {
          background: var(--button-bg);
          border: 1px solid var(--button-border);
          color: var(--button-text);
        }
        .view-mode-button:hover:not(:disabled) {
          background: var(--button-hover);
        }
        .view-mode-button-active {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
        }
        .view-mode-button-active:hover {
          background: var(--accent);
          opacity: 0.9;
        }
      `}</style>
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold mb-1 truncate">{title}</h1>
          <div className="text-xs lg:text-sm text-[var(--muted)]">
            {date && <span className="hidden sm:inline">Дата проведения: </span>}
            {date && <span>{date}</span>}
            {date && venue && <span className="hidden sm:inline"> • </span>}
            {venue && <span className="hidden sm:inline">{venue}</span>}
          </div>
          <div className="text-xs text-[var(--muted)] mt-1 hidden lg:block">
            Обновлено: {new Date().toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 mr-2">
            <Button
              onClick={() => onViewModeChange('cards')}
              size="sm"
              className={viewMode === 'cards' ? 'view-mode-button-active' : 'view-mode-button'}
            >
              По времени
            </Button>
            <Button
              onClick={() => onViewModeChange('table')}
              size="sm"
              className={viewMode === 'table' ? 'view-mode-button-active' : 'view-mode-button'}
            >
              По залам
            </Button>
          </div>
          <div className="w-px h-6 bg-[var(--line)] hidden lg:block"></div>
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="program-button"
          >
            <Icon name={refreshing ? 'Loader2' : 'RefreshCw'} size={16} className={refreshing ? 'animate-spin' : ''} />
          </Button>

          <div className="relative">
            <Button
              onClick={onToggleTagDropdown}
              variant="outline"
              size="sm"
              className="program-button"
            >
              Теги: {selectedTags.size ? selectedTags.size : 'все'}
            </Button>

            {tagDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[var(--panel)] border border-[var(--line)] rounded-lg shadow-lg p-4 z-50">
                <div className="max-h-96 overflow-auto mb-3">
                  {allCanons.map(canon => (
                    <label key={canon} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[var(--chip)] px-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTags.has(canon)}
                        onChange={(e) => {
                          const newTags = new Set(selectedTags);
                          if (e.target.checked) {
                            newTags.add(canon);
                          } else {
                            newTags.delete(canon);
                          }
                          onTagsChange(newTags);
                        }}
                      />
                      <span>{tagCanonMap[canon]}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                  <Button
                    onClick={() => {
                      onTagsChange(new Set());
                      onToggleTagDropdown();
                    }}
                    variant="outline"
                    size="sm"
                    className="program-button"
                  >
                    Сбросить
                  </Button>
                  <Button onClick={onToggleTagDropdown} size="sm" className="program-button">
                    Применить
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={onDownloadPdf}
            disabled={generatingPdf}
            variant="outline"
            size="sm"
            className="program-button"
          >
            <Icon name={generatingPdf ? 'Loader2' : 'FileDown'} size={16} className={generatingPdf ? 'animate-spin' : ''} />
            <span className="hidden sm:inline ml-2">{generatingPdf ? 'Готовлю PDF...' : 'Скачать PDF'}</span>
          </Button>

          <Button onClick={onTogglePlan} variant="outline" size="sm" className="program-button">
            <span className="hidden sm:inline">План</span>
            <span className="sm:hidden">📋</span>
          </Button>

          <Button onClick={onToggleTheme} variant="outline" size="sm" className="program-button">
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </div>
      </div>
    </div>
  );
}