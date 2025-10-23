import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface MobileMenuProps {
  exportingPdf: boolean;
  theme: 'light' | 'dark';
  onClose: () => void;
  onExportPdf: () => void;
  onDownloadXlsx: () => void;
  onToggleTheme: () => void;
}

export default function MobileMenu({
  exportingPdf,
  theme,
  onClose,
  onExportPdf,
  onDownloadXlsx,
  onToggleTheme
}: MobileMenuProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">
          <Icon name="X" size={24} />
        </button>

        <h2 className="modal-title mb-4">Меню</h2>

        <div className="space-y-3">
          <Button
            onClick={onExportPdf}
            disabled={exportingPdf}
            variant="outline"
            className="w-full justify-start"
          >
            <Icon name={exportingPdf ? 'Loader2' : 'FileDown'} size={18} className={exportingPdf ? 'animate-spin mr-2' : 'mr-2'} />
            {exportingPdf ? 'Генерация PDF...' : 'Скачать PDF'}
          </Button>

          <Button
            onClick={onDownloadXlsx}
            variant="outline"
            className="w-full justify-start"
          >
            <Icon name="FileSpreadsheet" size={18} className="mr-2" />
            Скачать XLSX
          </Button>

          <Button
            onClick={onToggleTheme}
            variant="outline"
            className="w-full justify-start"
          >
            <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} className="mr-2" />
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </Button>
        </div>
      </div>
    </div>
  );
}