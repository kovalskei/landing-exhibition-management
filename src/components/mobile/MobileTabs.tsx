interface MobileTabsProps {
  activeTab: 'now' | 'all';
  onTabChange: (tab: 'now' | 'all') => void;
}

export default function MobileTabs({ activeTab, onTabChange }: MobileTabsProps) {
  return (
    <div className="m-tabs" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      <button
        className={`m-tab ${activeTab === 'now' ? 'active' : ''}`}
        onClick={() => onTabChange('now')}
      >
        По времени
      </button>
      <button
        className={`m-tab ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => onTabChange('all')}
      >
        По залам
      </button>
    </div>
  );
}