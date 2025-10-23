interface MobileTabsProps {
  activeTab: 'now' | 'all' | 'plan';
  planCount: number;
  onTabChange: (tab: 'now' | 'all' | 'plan') => void;
}

export default function MobileTabs({ activeTab, planCount, onTabChange }: MobileTabsProps) {
  return (
    <div className="m-tabs">
      <button
        className={`m-tab ${activeTab === 'now' ? 'active' : ''}`}
        onClick={() => onTabChange('now')}
      >
        Сейчас
      </button>
      <button
        className={`m-tab ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => onTabChange('all')}
      >
        Программа
      </button>
      <button
        className={`m-tab ${activeTab === 'plan' ? 'active' : ''}`}
        onClick={() => onTabChange('plan')}
      >
        План {planCount > 0 && `(${planCount})`}
      </button>
    </div>
  );
}
