import { describe, expect, it } from 'vitest';
import { findLastPerformance, recommendWeight } from './progression';
import type { Exercise, PlannedExercise, Workout, WorkoutExercise } from './types';

const bench: Exercise = { id: 'bench-press', name: 'Bench Press', type: 'weight', defaultRestSec: 180, incrementKg: 2.5, custom: false };
const plan5x5: PlannedExercise = { id: 'p1', exerciseId: 'bench-press', restSec: 180, sets: Array(5).fill({ reps: 5 }) };

function entry(reps: number[], weightKg = 80): WorkoutExercise {
  return { exerciseId: 'bench-press', restSec: 180, sets: reps.map((r) => ({ weightKg, reps: r, completed: true })) };
}

describe('recommendWeight', () => {
  it('adds the increment when every target was hit', () => {
    expect(recommendWeight(bench, plan5x5, entry([5, 5, 5, 5, 5]))).toEqual({ weightKg: 82.5, increase: true });
  });

  it('counts extra reps as hitting the target', () => {
    expect(recommendWeight(bench, plan5x5, entry([6, 5, 7, 5, 5]))?.increase).toBe(true);
  });

  it('keeps the same weight when a set falls short (never lowers)', () => {
    expect(recommendWeight(bench, plan5x5, entry([5, 5, 5, 4, 3]))).toEqual({ weightKg: 80, increase: false });
  });

  it('keeps the same weight when fewer sets were completed than planned', () => {
    expect(recommendWeight(bench, plan5x5, entry([5, 5, 5]))?.increase).toBe(false);
  });

  it('ignores uncompleted sets', () => {
    const last = entry([5, 5, 5, 5, 5]);
    last.sets[4].completed = false;
    expect(recommendWeight(bench, plan5x5, last)?.increase).toBe(false);
  });

  it('returns nothing without history, or for non-weight exercises', () => {
    expect(recommendWeight(bench, plan5x5, undefined)).toBeUndefined();
    expect(recommendWeight({ ...bench, type: 'timed' }, plan5x5, entry([5, 5, 5, 5, 5]))).toBeUndefined();
  });
});

describe('findLastPerformance', () => {
  const w = (id: string, finishedAt: string | undefined, reps: number[]): Workout => ({
    id,
    startedAt: finishedAt ?? '2026-12-01',
    finishedAt,
    exercises: [entry(reps)],
  });

  it('returns the most recent finished workout with the exercise', () => {
    const workouts = [w('old', '2026-11-01T10:00:00Z', [5]), w('new', '2026-11-08T10:00:00Z', [5]), w('unfinished', undefined, [5])];
    expect(findLastPerformance('bench-press', workouts)?.workout.id).toBe('new');
  });

  it('returns undefined when never performed', () => {
    expect(findLastPerformance('deadlift', [w('a', '2026-11-01', [5])])).toBeUndefined();
  });
});
