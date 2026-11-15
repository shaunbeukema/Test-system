import { useEffect, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  /** Optional primary action shown top-right (e.g. "Save"). */
  action?: { label: string; onClick: () => void; disabled?: boolean };
  children: ReactNode;
}

/** iOS-style bottom sheet. */
export function Sheet({ title, onClose, action, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <button type="button" className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <h2 className="sheet-title">{title}</h2>
          {action ? (
            <button type="button" className="link-btn strong" onClick={action.onClick} disabled={action.disabled}>
              {action.label}
            </button>
          ) : (
            <span className="link-btn" aria-hidden />
          )}
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
