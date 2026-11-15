import { describe, expect, it } from 'vitest';
import { displayWeight, formatDuration, formatWeight, kgToUnit, unitToKg } from './units';

describe('units', () => {
  it('round-trips kg <-> lb', () => {
    expect(unitToKg(kgToUnit(100, 'lb'), 'lb')).toBeCloseTo(100);
  });

  it('formats weights in the chosen unit', () => {
    expect(formatWeight(82.5, 'kg')).toBe('82.5 kg');
    expect(formatWeight(100, 'lb')).toBe('220.5 lb');
  });

  it('uses one rounding rule: kg to 0.25, lb to 0.5, and lb entries round-trip exactly', () => {
    expect(displayWeight(65, 'lb')).toBe(143.5);
    expect(displayWeight(unitToKg(145, 'lb'), 'lb')).toBe(145);
    expect(displayWeight(82.4, 'kg')).toBe(82.5);
  });

  it('formats durations as m:ss', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(5)).toBe('0:05');
  });
});
