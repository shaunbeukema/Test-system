import { useState } from 'react';

interface Props {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  decimals?: boolean;
  disabled?: boolean;
}

/** Compact number input for set rows. Shows a draft while typing; commits on blur/enter. */
export function NumberCell({ label, value, onChange, decimals, disabled }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? (value === undefined ? '' : String(value));

  const commit = (raw: string) => {
    const trimmed = raw.trim().replace(',', '.');
    if (trimmed === '') return onChange(undefined);
    const n = Number(trimmed);
    if (Number.isFinite(n) && n >= 0) onChange(decimals ? n : Math.round(n));
  };

  return (
    <input
      className="cell-input num"
      inputMode={decimals ? 'decimal' : 'numeric'}
      aria-label={label}
      placeholder="—"
      value={text}
      disabled={disabled}
      onFocus={(e) => {
        setDraft(e.target.value);
        e.target.select();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => {
        commit(e.target.value);
        setDraft(null);
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}
