import type { WeightUnit } from './types';

export const KG_PER_LB = 0.45359237;

export function kgToUnit(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

export function unitToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KG_PER_LB;
}

/** Round to the nearest step (e.g. 0.5) and drop floating-point noise. */
export function roundTo(value: number, step: number): number {
  return Math.round(Math.round(value / step) * step * 1000) / 1000;
}

/** A stored kg value as a display number in the chosen unit (kg to 0.25, lb to 0.5). The one rounding rule for every screen. */
export function displayWeight(kg: number, unit: WeightUnit): number {
  return roundTo(kgToUnit(kg, unit), unit === 'kg' ? 0.25 : 0.5);
}

/** Format a stored kg value for display, e.g. "82.5 kg" or "180 lb". */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${displayWeight(kg, unit)} ${unit}`;
}

/** Format seconds as m:ss, e.g. 90 -> "1:30". */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
