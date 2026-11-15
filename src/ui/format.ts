import type { Exercise, SetLog, WeightUnit } from '../core/types';
import { displayWeight, formatDuration, formatWeight } from '../core/units';

/** "80 kg × 5, 5, 5" when every set used the same weight; otherwise each set in full. */
export function summarizeSets(sets: SetLog[] | undefined, type: Exercise['type'], unit: WeightUnit): string | undefined {
  const done = sets?.filter((s) => s.completed);
  if (!done?.length) return undefined;
  const sameWeight = done.every((s) => s.weightKg === done[0].weightKg);
  if (type === 'weight' && sameWeight && done[0].weightKg !== undefined) {
    return `${formatWeight(done[0].weightKg, unit)} × ${done.map((s) => s.reps ?? 0).join(', ')}`;
  }
  return done.map((s) => describeSet(s, type, unit)).join(', ');
}

export function describeSet(s: SetLog, type: Exercise['type'], unit: WeightUnit, short = false): string {
  const w = s.weightKg !== undefined ? displayWeight(s.weightKg, unit) : undefined;
  switch (type) {
    case 'weight':
      return w !== undefined ? `${w}${short ? '' : ` ${unit}`} × ${s.reps ?? 0}` : `${s.reps ?? 0}`;
    case 'bodyweight':
      return w ? `+${w} × ${s.reps ?? 0}` : `${s.reps ?? 0}`;
    case 'timed':
      return formatDuration(s.durationSec ?? 0);
    case 'cardio':
      return s.distanceM ? `${formatDuration(s.durationSec ?? 0)} · ${s.distanceM / 1000}km` : formatDuration(s.durationSec ?? 0);
  }
}
