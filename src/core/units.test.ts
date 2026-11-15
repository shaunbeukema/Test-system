import { describe, expect, it } from 'vitest';
import { formatDuration, formatWeight, kgToUnit, unitToKg } from './units';

describe('units', () => {
  it('round-trips kg <-> lb', () => {
    expect(unitToKg(kgToUnit(100, 'lb'), 'lb')).toBeCloseTo(100);
  });

  it('formats weights in the chosen unit', () => {
    expect(formatWeight(82.5, 'kg')).toBe('82.5 kg');
    expect(formatWeight(100, 'lb')).toBe('220.5 lb');
  });

  it('formats durations as m:ss', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(5)).toBe('0:05');
  });
});
