import { formatDuration } from '../../core/units';

interface Props {
  endsAt: string;
  totalSec: number;
  now: number;
  onAdjust: (deltaSec: number) => void;
  onDismiss: () => void;
}

/** Rest countdown pinned to the bottom. Flashes when rest is over. */
export function RestBar({ endsAt, totalSec, now, onAdjust, onDismiss }: Props) {
  const remaining = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
  const done = remaining === 0;
  const progress = Math.min(1, Math.max(0, 1 - remaining / totalSec));

  return (
    <div className={`restbar${done ? ' restbar-done' : ''}`} role="timer" aria-live={done ? 'assertive' : 'off'}>
      <div className="restbar-progress" style={{ transform: `scaleX(${progress})` }} />
      <div className="restbar-inner">
        {done ? (
          <>
            <span className="restbar-go">Rest over — GO</span>
            <button type="button" className="restbar-btn strong" onClick={onDismiss}>
              OK
            </button>
          </>
        ) : (
          <>
            <button type="button" className="restbar-btn" aria-label="Rest 15 seconds less" onClick={() => onAdjust(-15)}>
              −15
            </button>
            <div className="restbar-time">
              <span className="restbar-label">Rest</span>
              <span className="num">{formatDuration(remaining)}</span>
            </div>
            <button type="button" className="restbar-btn" aria-label="Rest 15 seconds more" onClick={() => onAdjust(15)}>
              +15
            </button>
            <button type="button" className="restbar-btn strong" onClick={onDismiss}>
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}
