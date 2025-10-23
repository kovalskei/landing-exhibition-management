import { Session } from '@/utils/googleSheetsParser';
import Icon from '@/components/ui/icon';

interface MobileSessionCardProps {
  session: Session;
  inPlan: boolean;
  hallName: string;
  duration: string;
  hasConflict: boolean;
  onTogglePlan: () => void;
  onClick: () => void;
}

export default function MobileSessionCard({
  session,
  inPlan,
  hallName,
  duration,
  hasConflict,
  onTogglePlan,
  onClick
}: MobileSessionCardProps) {
  return (
    <div className="session-card" onClick={onClick}>
      <div className="ses-top">
        <div className="ses-time">
          {session.start}–{session.end} <span className="ses-mins">({duration})</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onTogglePlan(); }}
          className={`ses-heart ${inPlan ? 'active' : ''}`}
          aria-label={inPlan ? 'Убрать из плана' : 'Добавить в план'}
        >
          {inPlan ? '★' : '☆'}
        </button>
      </div>

      <div className="ses-hall">{hallName}</div>

      {session.speaker && <div className="ses-speaker">{session.speaker}</div>}
      {session.role && <div className="ses-role">{session.role}</div>}
      {session.title && <div className="ses-title">{session.title}</div>}

      {hasConflict && (
        <div className="conflict">
          <Icon name="AlertCircle" size={14} />
          <span>Накладка с планом</span>
        </div>
      )}
    </div>
  );
}
