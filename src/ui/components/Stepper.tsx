import { useState } from 'react';

interface Props {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step: number;
  min?: number;
  /** Shown after the number, e.g. "kg". */
  suffix?: string;
  /** Allow clearing the field (for optional values like weight). */
  optional?: boolean;
  /** Custom display (e.g. m:ss for rest). When set, the field is read-only and uses the buttons. */
  format?: (value: number) => string;
  decimals?: boolean;
}

/** A labelled number field with big − / + buttons for gym-friendly editing. */
export function Stepper({ label, value, onChange, step, min = 0, suffix, optional, format, decimals }: Props) {
  // While typing, show the draft text; otherwise show the current value.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? (value === undefined ? '' : String(value));

  const bump = (dir: 1 | -1) => {
    const base = value ?? (dir === 1 ? min - step : min);
    const next = Math.max(min, Math.round((base + dir * step) * 1000) / 1000);
    onChange(next);
  };

  const commit = (raw: string) => {
    const trimmed = raw.trim().replace(',', '.');
    if (trimmed === '') {
      onChange(optional ? undefined : min);
      return;
    }
    const n = Number(trimmed);
    if (Number.isFinite(n)) onChange(Math.max(min, decimals ? n : Math.round(n)));
  };

  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button type="button" className="stepper-btn" aria-label={`Decrease ${label}`} onClick={() => bump(-1)}>
          −
        </button>
        {format ? (
          <output className="stepper-value num">{value === undefined ? '—' : format(value)}</output>
        ) : (
          <label className="stepper-field">
            <input
              className="stepper-input num"
              inputMode={decimals ? 'decimal' : 'numeric'}
              aria-label={label}
              placeholder={optional ? '—' : undefined}
              value={text}
              onFocus={(e) => setDraft(e.target.value)}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => {
                commit(e.target.value);
                setDraft(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
            {suffix && <span className="stepper-suffix">{suffix}</span>}
          </label>
        )}
        <button type="button" className="stepper-btn" aria-label={`Increase ${label}`} onClick={() => bump(1)}>
          +
        </button>
      </div>
    </div>
  );
}
