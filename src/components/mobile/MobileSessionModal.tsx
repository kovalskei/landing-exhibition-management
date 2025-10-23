import { Session } from '@/utils/googleSheetsParser';
import Icon from '@/components/ui/icon';

interface MobileSessionModalProps {
  session: Session;
  inPlan: boolean;
  hallName: string;
  duration: string;
  onClose: () => void;
  onTogglePlan: () => void;
}

export default function MobileSessionModal({
  session,
  inPlan,
  hallName,
  duration,
  onClose,
  onTogglePlan
}: MobileSessionModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">
          <Icon name="X" size={24} />
        </button>

        <div className="modal-time">
          {session.start}–{session.end} <span className="ses-mins">({duration})</span>
        </div>

        <div className="modal-hall">{hallName}</div>

        {session.speaker && <h2 className="modal-speaker">{session.speaker}</h2>}
        {session.role && <div className="modal-role">{session.role}</div>}
        {session.title && <h3 className="modal-title">{session.title}</h3>}

        {session.desc && (
          <div className="modal-desc">{session.desc}</div>
        )}

        {session.tags && session.tags.length > 0 && (
          <div className="modal-tags">
            {session.tags.map((tag, i) => (
              <span key={i} className="modal-tag">{tag}</span>
            ))}
          </div>
        )}

        <button onClick={onTogglePlan} className={`modal-btn ${inPlan ? 'remove' : ''}`}>
          {inPlan ? '★ Убрать из плана' : '☆ Добавить в план'}
        </button>
      </div>
    </div>
  );
}
