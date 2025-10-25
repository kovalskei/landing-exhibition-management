import { Session, getTagCanonMap } from '@/utils/googleSheetsParser';
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
  theme: 'light' | 'dark';
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
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
  onClick,
  theme
}: MobileSessionCardProps) {
  const tagMap = getTagCanonMap();
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

      {session.tagsCanon && session.tagsCanon.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {session.tagsCanon.map(c => {
            const h = hashStr(c) % 360;
            const isLight = theme === 'light';
            const bg = `hsl(${h}, 65%, ${isLight ? 85 : 30}%)`;
            const bd = `hsl(${h}, 65%, ${isLight ? 75 : 38}%)`;
            
            return (
              <span
                key={c}
                style={{
                  background: bg,
                  borderColor: bd,
                  border: '1px solid',
                  padding: '3px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}
              >
                {tagMap[c] || c}
              </span>
            );
          })}
        </div>
      )}

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