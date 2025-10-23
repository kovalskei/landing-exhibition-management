import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getTagCanonMap } from '@/utils/googleSheetsParser';

interface ProgramHeaderProps {
  title: string;
  date?: string;
  refreshing: boolean;
  generatingPdf: boolean;
  tagDropdownOpen: boolean;
  selectedTags: Set<string>;
  showPlan: boolean;
  theme: 'light' | 'dark';
  onRefresh: () => void;
  onDownloadPdf: () => void;
  onToggleTagDropdown: () => void;
  onTagsChange: (tags: Set<string>) => void;
  onTogglePlan: () => void;
  onToggleTheme: () => void;
}

export default function ProgramHeader({
  title,
  date,
  refreshing,
  generatingPdf,
  tagDropdownOpen,
  selectedTags,
  showPlan,
  theme,
  onRefresh,
  onDownloadPdf,
  onToggleTagDropdown,
  onTagsChange,
  onTogglePlan,
  onToggleTheme
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
      `}</style>
      
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          {date && (
            <div className="text-sm text-[var(--muted)]">
              Дата проведения: {date}
            </div>
          )}
          <div className="text-xs text-[var(--muted)] mt-1">
            Обновлено: {new Date().toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            <Icon name={generatingPdf ? 'Loader2' : 'FileDown'} size={16} className={generatingPdf ? 'animate-spin mr-2' : 'mr-2'} />
            {generatingPdf ? 'Готовлю PDF...' : 'Скачать PDF'}
          </Button>

          <Button variant="outline" size="sm" className="program-button">
            <a
              href={`https://docs.google.com/spreadsheets/d/1HgPCnMmB0KuP080xWYjBlCPdvBy5AzQMeRVX_PUxca4/export?format=xlsx`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Скачать XLSX
            </a>
          </Button>

          <Button onClick={onTogglePlan} variant="outline" size="sm" className="program-button">
            План
          </Button>

          <Button onClick={onToggleTheme} variant="outline" size="sm" className="program-button">
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </div>
      </div>
    </div>
  );
}