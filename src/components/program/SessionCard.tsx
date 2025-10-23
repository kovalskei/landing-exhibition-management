import { Session, getTagCanonMap } from '@/utils/googleSheetsParser';
import { Button } from '@/components/ui/button';

interface SessionCardProps {
  session: Session;
  theme: 'light' | 'dark';
  onAddToPlan: (session: Session) => void;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export default function SessionCard({ session, theme, onAddToPlan }: SessionCardProps) {
  const tagMap = getTagCanonMap();

  return (
    <div className="space-y-2 relative group">
      <style>{`
        .session-add-plan {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .group:hover .session-add-plan {
          opacity: 1;
        }
      `}</style>

      <div className="text-[13px] font-medium text-[var(--muted)] mb-3">
        {session.start} — {session.end}
      </div>

      {session.tagsCanon && session.tagsCanon.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {session.tagsCanon.map(c => {
            const h = hashStr(c) % 360;
            const isLight = theme === 'light';
            const bg = `hsl(${h}, 65%, ${isLight ? 85 : 30}%)`;
            const bd = `hsl(${h}, 65%, ${isLight ? 75 : 38}%)`;
            
            return (
              <span
                key={c}
                className="px-2 py-1 text-xs rounded-full"
                style={{ background: bg, borderColor: bd, border: '1px solid' }}
              >
                {tagMap[c] || c}
              </span>
            );
          })}
        </div>
      )}

      {session.speaker && (
        <div className="font-bold text-[15px] leading-tight">{session.speaker}</div>
      )}

      {session.role && (
        <div className="text-[13px] text-[var(--muted)] mt-1">{session.role}</div>
      )}

      {session.title && (
        <div className="font-bold text-[14px] mt-3 mb-2 leading-snug">{session.title}</div>
      )}

      {session.desc && (
        <div className="text-[13px] leading-relaxed">
          {session.desc.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
              return (
                <div key={i} className="flex gap-2 mb-1.5">
                  <span className="flex-shrink-0 mt-0.5">•</span>
                  <span className="flex-1">{trimmed.slice(2)}</span>
                </div>
              );
            }
            if (trimmed) {
              return <div key={i} className="mb-2">{trimmed}</div>;
            }
            return null;
          })}
        </div>
      )}

      <Button
        onClick={() => onAddToPlan(session)}
        size="sm"
        className="w-full session-add-plan bg-blue-600 hover:bg-blue-700 text-white"
      >
        + В план
      </Button>
    </div>
  );
}