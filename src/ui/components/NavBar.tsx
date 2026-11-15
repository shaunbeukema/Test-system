import type { ReactNode } from 'react';

interface Props {
  backLabel: string;
  onBack: () => void;
  right?: ReactNode;
}

/** Top bar with an iOS-style back button. */
export function NavBar({ backLabel, onBack, right }: Props) {
  return (
    <div className="navbar">
      <button type="button" className="back-btn" onClick={onBack}>
        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10 2 2 10l8 8" />
        </svg>
        {backLabel}
      </button>
      <div>{right}</div>
    </div>
  );
}
