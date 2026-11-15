import { useEffect, useRef, useState } from 'react';

import { registerDialogHost, type DialogRequest } from '../dialog';

/** Mount once near the root of the app. */
export function DialogHost() {
  const [req, setReq] = useState<DialogRequest>();
  const [text, setText] = useState('');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerDialogHost((r) => {
      setText(r.input?.value ?? '');
      setReq(r);
    });
    return () => registerDialogHost(undefined);
  }, []);

  useEffect(() => {
    if (!req) return;
    if (req.input) inputRef.current?.select();
    else confirmRef.current?.focus();
  }, [req]);

  if (!req) return null;

  const close = (ok: boolean) => {
    req.resolve({ ok, text });
    setReq(undefined);
  };

  return (
    <div className="dialog-backdrop" onKeyDown={(e) => e.key === 'Escape' && close(false)}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby={req.message ? 'dialog-message' : undefined}>
        <div className="dialog-body">
          <h2 id="dialog-title" className="dialog-title">
            {req.title}
          </h2>
          {req.message && (
            <p id="dialog-message" className="dialog-message">
              {req.message}
            </p>
          )}
          {req.input && (
            <input
              ref={inputRef}
              id="dialog-input"
              className="text-input dialog-input"
              aria-label={req.input.label}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && close(true)}
            />
          )}
        </div>
        <div className={`dialog-actions${req.cancelLabel === null ? ' single' : ''}`}>
          {req.cancelLabel !== null && (
            <button type="button" className="dialog-btn" onClick={() => close(false)}>
              {req.cancelLabel}
            </button>
          )}
          <button ref={confirmRef} type="button" className={`dialog-btn strong${req.destructive ? ' destructive' : ''}`} onClick={() => close(true)}>
            {req.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
