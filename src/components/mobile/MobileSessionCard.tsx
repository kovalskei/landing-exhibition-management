import { Session } from '@/utils/googleSheetsParser';
import Icon from '@/components/ui/icon';

interface MobileSessionCardProps {
  session: Session;
  inPlan: boolean;
  hallName: string;
  duration: string;
  hasConflict: boolean;
  conflictSession?: Session;
  conflictHallName?: string;
  onTogglePlan: () => void;
  onClick: () => void;
}

export default function MobileSessionCard({
  session,
  inPlan,
  hallName,
  duration,
  hasConflict,
  conflictSession,
  conflictHallName,
  onTogglePlan,
  onClick
}: MobileSessionCardProps) {
  const isTimeOverlap = conflictSession && session.start < conflictSession.end && conflictSession.start < session.end;
  const isTransition = conflictSession && !isTimeOverlap;

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

      {hasConflict && conflictSession && conflictHallName && isTimeOverlap && (
        <div className="conflict">
          <Icon name="AlertCircle" size={14} />
          <span>Пересечение залов по времени</span>
        </div>
      )}
      
      {hasConflict && conflictSession && conflictHallName && isTransition && (
        <div className="conflict">
          <Icon name="AlertCircle" size={14} />
          <span>Переход: {hallName} → {conflictHallName} к {conflictSession.start}</span>
        </div>
      )}

      {hasConflict && (!conflictSession || !conflictHallName) && (
        <div className="conflict">
          <Icon name="AlertCircle" size={14} />
          <span>Пересечение залов по времени</span>
        </div>
      )}
    </div>
  );
}