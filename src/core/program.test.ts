import { describe, expect, it } from 'vitest';
import { copyWeek, isBlockComplete, nextDay } from './program';
import type { Program, Workout } from './types';

const program: Program = {
  id: 'prog',
  name: 'Strength Block',
  createdAt: '2026-11-01T00:00:00Z',
  runStartedAt: '2026-11-01T00:00:00Z',
  weeks: [
    { id: 'w1', name: 'Week 1', days: [{ id: 'd1', name: 'Push', exercises: [] }, { id: 'd2', name: 'Pull', exercises: [] }] },
    { id: 'w2', name: 'Week 2', days: [{ id: 'd3', name: 'Push', exercises: [] }] },
  ],
};

const done = (dayId: string, startedAt = '2026-11-02T10:00:00Z'): Workout => ({
  id: dayId + startedAt, programId: 'prog', dayId, startedAt, finishedAt: startedAt, exercises: [],
});

describe('nextDay', () => {
  it('starts at week 1 day 1', () => {
    expect(nextDay(program, [])?.day.id).toBe('d1');
  });

  it('moves to the next uncompleted day, across weeks', () => {
    expect(nextDay(program, [done('d1')])?.day.id).toBe('d2');
    expect(nextDay(program, [done('d1'), done('d2')])?.day.id).toBe('d3');
  });

  it('ignores workouts from before the current run (repeated block)', () => {
    const repeated = { ...program, runStartedAt: '2026-12-01T00:00:00Z' };
    expect(nextDay(repeated, [done('d1'), done('d2'), done('d3')])?.day.id).toBe('d1');
  });

  it('ignores unfinished workouts', () => {
    expect(nextDay(program, [{ ...done('d1'), finishedAt: undefined }])?.day.id).toBe('d1');
  });

  it('reports block completion', () => {
    expect(isBlockComplete(program, [done('d1'), done('d2')])).toBe(false);
    expect(isBlockComplete(program, [done('d1'), done('d2'), done('d3')])).toBe(true);
  });
});

describe('copyWeek', () => {
  it('deep-copies with new IDs so edits do not affect the original', () => {
    const src = { id: 'w', name: 'W1', days: [{ id: 'd', name: 'Push', exercises: [{ id: 'e', exerciseId: 'bench-press', restSec: 120, sets: [{ reps: 5 }] }] }] };
    const copy = copyWeek(src, 'Week 2');
    expect(copy.name).toBe('Week 2');
    expect(copy.id).not.toBe(src.id);
    expect(copy.days[0].id).not.toBe('d');
    copy.days[0].exercises[0].sets[0].reps = 8;
    expect(src.days[0].exercises[0].sets[0].reps).toBe(5);
  });
});
