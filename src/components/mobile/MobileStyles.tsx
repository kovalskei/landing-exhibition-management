interface MobileStylesProps {
  theme: 'light' | 'dark';
}

export default function MobileStyles({ theme }: MobileStylesProps) {
  const vars = theme === 'dark' 
    ? {
        bg: '#0f1115',
        panel: '#151922',
        text: '#e9edf3',
        muted: '#9aa3ad',
        line: '#242a36',
        accent: '#3b82f6',
        ok: '#10b981',
        err: '#ef4444',
        shadow: '0 10px 28px rgba(0,0,0,.3)'
      }
    : {
        bg: '#f3f6fb',
        panel: '#ffffff',
        text: '#1a2433',
        muted: '#475569',
        line: '#e6e8ee',
        accent: '#2563eb',
        ok: '#10b981',
        err: '#ef4444',
        shadow: '0 10px 28px rgba(15,23,42,.1)'
      };

  return (
    <style>{`
      .mobile-program-app {
        --bg: ${vars.bg};
        --panel: ${vars.panel};
        --text: ${vars.text};
        --muted: ${vars.muted};
        --line: ${vars.line};
        --accent: ${vars.accent};
        --ok: ${vars.ok};
        --err: ${vars.err};
        --shadow: ${vars.shadow};
        --tap: 48px;
        --radius: 16px;
        height: 100vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        background: var(--bg);
        color: var(--text);
        font-family: system-ui, -apple-system, sans-serif;
      }
      .m-top {
        background: var(--bg);
        border-bottom: 1px solid var(--line);
        padding: 14px;
      }
      .m-title {
        margin: 0 0 12px;
        font-weight: 800;
        font-size: 22px;
        letter-spacing: -0.02em;
      }
      .m-row {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
      }
      .m-search {
        flex: 1;
        display: flex;
        align-items: center;
        height: var(--tap);
        padding: 0 14px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--panel);
      }
      .m-search input {
        flex: 1;
        background: transparent;
        border: 0;
        outline: 0;
        color: var(--text);
        font-size: 16px;
      }
      .m-pill {
        min-height: var(--tap);
        padding: 0 16px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--panel);
        font-weight: 600;
        cursor: pointer;
      }
      .m-tabs {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding: 8px 0;
      }
      .m-tab {
        min-height: var(--tap);
        padding: 0 16px;
        font-weight: 700;
        font-size: 15px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: var(--panel);
        transition: all 0.15s;
        cursor: pointer;
      }
      .m-tab.active {
        background: var(--accent);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(59,130,246,.25);
      }
      .sticky-time-chips {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--bg);
        padding: 12px 0;
        border-bottom: 1px solid var(--line);
      }
      .chips {
        display: flex;
        gap: 10px;
        padding: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .chips::-webkit-scrollbar { display: none; }
      .chip {
        flex-shrink: 0;
        padding: 10px 18px;
        font-size: 15px;
        font-weight: 700;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--panel);
        cursor: pointer;
        transition: all 0.15s;
      }
      .chip-active {
        background: var(--accent);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 3px 10px rgba(59,130,246,.2);
      }
      .hall-filter {
        display: flex;
        gap: 8px;
        padding: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        margin-bottom: 14px;
      }
      .hall-filter::-webkit-scrollbar { display: none; }
      .hall-chip {
        flex-shrink: 0;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--panel);
        color: var(--text);
        cursor: pointer;
        transition: all 0.15s;
      }
      .hall-chip.active {
        background: var(--accent);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 2px 8px rgba(59,130,246,.2);
      }
      .now-banner {
        background: linear-gradient(135deg, var(--accent), #8b5cf6);
        color: #fff;
        padding: 12px 14px;
        margin: 8px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 12px rgba(59,130,246,.2);
        border-radius: 12px;
      }
      .now-text {
        font-weight: 700;
        font-size: 15px;
      }
      .now-btn {
        background: rgba(255,255,255,.2);
        border: 0;
        padding: 8px 14px;
        border-radius: 8px;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }

      .timeline-slot {
        margin-bottom: 24px;
      }
      .timeline-slot:first-child {
        margin-top: 14px;
      }
      .session-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: var(--shadow);
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .session-card:active {
        transform: scale(0.98);
        box-shadow: 0 5px 15px rgba(15,23,42,.08);
      }
      .ses-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }
      .ses-time {
        font-weight: 700;
        font-size: 15px;
        color: var(--accent);
      }
      .ses-mins {
        font-weight: 400;
        color: var(--muted);
      }
      .ses-heart {
        background: none;
        border: 0;
        font-size: 22px;
        cursor: pointer;
        padding: 0;
        color: var(--muted);
        transition: transform 0.15s;
      }
      .ses-heart:active { transform: scale(1.2); }
      .ses-heart.active { color: #fbbf24; }
      .ses-hall {
        display: inline-block;
        background: var(--bg);
        color: var(--muted);
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 10px;
      }
      .ses-speaker {
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 4px;
      }
      .ses-role {
        color: var(--muted);
        font-size: 14px;
        margin-bottom: 8px;
      }
      .ses-title {
        font-weight: 600;
        font-size: 15px;
        line-height: 1.4;
      }
      .conflict {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--err);
        font-size: 13px;
        font-weight: 600;
        margin-top: 10px;
        padding: 8px;
        background: rgba(239,68,68,.08);
        border-radius: 8px;
      }
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.5);
        z-index: 100;
        display: flex;
        align-items: flex-end;
        animation: fadeIn 0.2s;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .modal-content {
        background: var(--panel);
        width: 100%;
        max-height: 85vh;
        border-radius: var(--radius) var(--radius) 0 0;
        padding: 20px;
        padding-bottom: max(20px, env(safe-area-inset-bottom));
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        animation: slideUp 0.25s ease-out;
        position: relative;
      }
      @supports (height: 100dvh) {
        .modal-content {
          max-height: 85dvh;
        }
      }
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: var(--bg);
        border: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .modal-time {
        font-weight: 700;
        font-size: 16px;
        color: var(--accent);
        margin-bottom: 10px;
      }
      .modal-hall {
        display: inline-block;
        background: var(--bg);
        color: var(--muted);
        padding: 6px 12px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 14px;
      }
      .modal-speaker {
        font-weight: 800;
        font-size: 20px;
        margin: 0 0 6px;
        line-height: 1.3;
      }
      .modal-role {
        color: var(--muted);
        font-size: 15px;
        margin-bottom: 12px;
      }
      .modal-title {
        font-weight: 700;
        font-size: 17px;
        margin: 0 0 14px;
        line-height: 1.4;
      }
      .modal-desc {
        color: var(--text);
        line-height: 1.6;
        margin-bottom: 16px;
        white-space: pre-wrap;
      }
      .modal-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 20px;
      }
      .modal-tag {
        background: var(--bg);
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
      }
      .modal-btn {
        width: 100%;
        min-height: 52px;
        background: var(--accent);
        color: #fff;
        border: 0;
        border-radius: 14px;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .modal-btn:active { opacity: 0.8; }
      .modal-btn.remove {
        background: var(--err);
      }
      .plan-empty {
        text-align: center;
        padding: 60px 20px;
        color: var(--muted);
      }
      .plan-empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
      .plan-clear {
        background: var(--err);
        color: #fff;
        border: 0;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 700;
        margin: 14px;
        cursor: pointer;
      }
      .floating-now-btn {
        position: fixed;
        bottom: 24px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--accent);
        color: #fff;
        border: 0;
        padding: 14px 20px;
        border-radius: 24px;
        font-weight: 700;
        font-size: 15px;
        box-shadow: 0 8px 24px rgba(59,130,246,0.4);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        z-index: 50;
      }
      .floating-now-btn:active {
        transform: scale(0.95);
        box-shadow: 0 4px 12px rgba(59,130,246,0.3);
      }
    `}</style>
  );
}