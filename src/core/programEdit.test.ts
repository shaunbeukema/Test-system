import { describe, expect, it } from 'vitest';
import {
  addDay,
  addWeek,
  createProgram,
  describePlanned,
  duplicateWeek,
  moveItem,
  plannedFromShorthand,
  removeDay,
  removeWeek,
  shorthandOf,
  updateDay,
} from './programEdit';
import type { Exercise } from './types';

const bench: Exercise = { id: 'bench-press', name: 'Bench Press', type: 'weight', defaultRestSec: 180, incrementKg: 2.5, custom: false };

describe('program editing', () => {
  it('creates a blank program with an empty Week 1', () => {
    const p = createProgram('  Strength  ');
    expect(p.name).toBe('Strength');
    expect(p.weeks).toHaveLength(1);
    expect(p.weeks[0].days).toHaveLength(0);
  });

  it('adds weeks and days', () => {
    let p = addWeek(createProgram('P'));
    const { program, day } = addDay(p, p.weeks[1].id, 'Push');
    p = program;
    expect(p.weeks.map((w) => w.name)).toEqual(['Week 1', 'Week 2']);
    expect(p.weeks[1].days[0]).toBe(day);
  });

  it('duplicates a week after itself and renumbers', () => {
    let p = createProgram('P');
    p = addDay(p, p.weeks[0].id, 'Push').program;
    p = addWeek(p);
    p = duplicateWeek(p, p.weeks[0].id);
    expect(p.weeks.map((w) => w.name)).toEqual(['Week 1', 'Week 2', 'Week 3']);
    expect(p.weeks[1].days[0].name).toBe('Push');
    expect(p.weeks[1].days[0].id).not.toBe(p.weeks[0].days[0].id);
    expect(p.weeks[2].days).toHaveLength(0);
  });

  it('removes weeks and days', () => {
    let p = addWeek(createProgram('P'));
    const { program, day } = addDay(p, p.weeks[0].id, 'Push');
    p = removeDay(program, day.id);
    expect(p.weeks[0].days).toHaveLength(0);
    p = removeWeek(p, p.weeks[0].id);
    expect(p.weeks.map((w) => w.name)).toEqual(['Week 1']);
  });

  it('updates a day without touching others', () => {
    let p = createProgram('P');
    p = addDay(p, p.weeks[0].id, 'Push').program;
    p = addDay(p, p.weeks[0].id, 'Pull').program;
    const pullId = p.weeks[0].days[1].id;
    p = updateDay(p, pullId, (d) => ({ ...d, name: 'Back' }));
    expect(p.weeks[0].days.map((d) => d.name)).toEqual(['Push', 'Back']);
  });

  it('moves items', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
  });
});

describe('shorthand', () => {
  it('expands sets × reps into individual sets and back', () => {
    const planned = plannedFromShorthand('bench-press', { sets: 5, reps: 5, weightKg: 80, restSec: 180 });
    expect(planned.sets).toHaveLength(5);
    expect(planned.sets.every((s) => s.reps === 5 && s.weightKg === 80)).toBe(true);
    expect(shorthandOf(planned)).toEqual({ sets: 5, reps: 5, weightKg: 80, restSec: 180 });
  });

  it('describes planned exercises by type', () => {
    const p = (s: Parameters<typeof plannedFromShorthand>[1]) => plannedFromShorthand('x', s);
    expect(describePlanned(p({ sets: 5, reps: 5, weightKg: 80, restSec: 0 }), bench, 'kg')).toBe('5 × 5 @ 80 kg');
    expect(describePlanned(p({ sets: 3, reps: 8, restSec: 0 }), bench, 'kg')).toBe('3 × 8');
    expect(describePlanned(p({ sets: 3, reps: 10, restSec: 0 }), { ...bench, type: 'bodyweight' }, 'kg')).toBe('3 × 10');
    expect(describePlanned(p({ sets: 3, durationSec: 45, restSec: 0 }), { ...bench, type: 'timed' }, 'kg')).toBe('3 × 0:45');
    expect(describePlanned(p({ sets: 1, durationSec: 600, distanceM: 2000, restSec: 0 }), { ...bench, type: 'cardio' }, 'kg')).toBe('10:00 · 2 km');
  });
});
