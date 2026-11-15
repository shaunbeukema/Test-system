// Liftr's own confirmation dialogs (iOS "alert" style), used instead of the browser's
// confirm()/alert()/prompt(), which look out of place in a Home Screen app. Rendered by <DialogHost />.

export interface DialogRequest {
  title: string;
  message?: string;
  confirmLabel: string;
  /** null = no Cancel button (an information notice). */
  cancelLabel: string | null;
  destructive: boolean;
  input?: { value: string; label: string };
  resolve: (result: { ok: boolean; text?: string }) => void;
}

let show: ((r: DialogRequest) => void) | undefined;

/** Called by DialogHost to receive dialog requests. */
export function registerDialogHost(fn: ((r: DialogRequest) => void) | undefined) {
  show = fn;
}

interface AskOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

/** Ask a yes/no question. Resolves true when confirmed. */
export function ask({ title, message, confirmLabel = 'OK', destructive = false }: AskOptions): Promise<boolean> {
  return open({ title, message, confirmLabel, cancelLabel: 'Cancel', destructive }).then((r) => r.ok);
}

/** Show a notice with a single OK button. */
export function tell(title: string, message?: string): Promise<void> {
  return open({ title, message, confirmLabel: 'OK', cancelLabel: null, destructive: false }).then(() => undefined);
}

/** Ask for a line of text. Resolves the trimmed text, or null if cancelled or empty. */
export function askText(title: string, label: string, value: string, confirmLabel = 'Save'): Promise<string | null> {
  return open({ title, confirmLabel, cancelLabel: 'Cancel', destructive: false, input: { value, label } }).then((r) =>
    r.ok && r.text?.trim() ? r.text.trim() : null,
  );
}

function open(opts: Omit<DialogRequest, 'resolve'>) {
  return new Promise<{ ok: boolean; text?: string }>((resolve) => {
    if (!show) return resolve({ ok: false });
    show({ ...opts, resolve });
  });
}
