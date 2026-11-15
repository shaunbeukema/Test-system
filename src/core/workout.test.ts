import { describe, expect, it } from 'vitest';
import { BUILT_IN_EXERCISES } from './exercises';
import { allDays } from './program';
import { plannedFromShorthand } from './programEdit';
import type { Program, Workout } from './types';
import {
  addExercise,
  addSet,
  adjustRest,
  completeSet,
  needsStartingWeight,
  removeExercise,
  removeLastSet,
  startWorkoutFromDay,
  uncompleteSet,
} from './workout';

const t = (sec: number) => new Date(Date.UTC(2026, 10, 15, 10, 0, sec));

const program: Program = {
  id: 'prog',
  name: 'Block',
  createdAt: '2026-11-01T00:00:00Z',
  runStartedAt: '2026-11-01T00:00:00Z',
  weeks: [
    {
      id: 'w1',
      name: 'Week 1',
      days: [
        {
          id: 'd1',
          name: 'Push',
          exercises: [
            plannedFromShorthand('bench-press', { sets: 3, reps: 5, restSec: 120 }, 'pb'),
            plannedFromShorthand('overhead-press', { sets: 2, reps: 8, weightKg: 40, restSec: 90 }, 'po'),
            plannedFromShorthand('plank', { sets: 2, durationSec: 45, restSec: 60 }, 'pp'),
          ],
        },
      ],
    },
  ],
};
const day = allDays(program)[0];

const lastBench: Workout = {
  id: 'old',
  startedAt: '2026-11-10T10:00:00Z',
  finishedAt: '2026-11-10T11:00:00Z',
  exercises: [{ exerciseId: 'bench-press', restSec: 120, sets: [5, 5, 5].map((reps) => ({ reps, weightKg: 80, completed: true })) }],
};

describe('startWorkoutFromDay', () => {
  it('prefills targets, and uses the recommendation when there is history', () => {
    const w = startWorkoutFromDay(program, day, BUILT_IN_EXERCISES, [lastBench], t(0));
    expect(w.name).toBe('Push');
    expect(w.dayId).toBe('d1');
    const [bench, ohp, plank] = w.exercises;
    expect(bench.suggestion).toEqual({ weightKg: 82.5, increase: true });
    expect(bench.sets.map((s) => s.weightKg)).toEqual([82.5, 82.5, 82.5]);
    expect(bench.sets.map((s) => s.reps)).toEqual([5, 5, 5]);
    expect(ohp.sets.map((s) => s.weightKg)).toEqual([40, 40]); // planned weight, no history
    expect(plank.sets[0].durationSec).toBe(45);
    expect(w.exercises.every((e) => e.sets.every((s) => !s.completed))).toBe(true);
  });

  it('leaves weight empty with no plan and no history, so Liftr asks for a starting weight', () => {
    const w = startWorkoutFromDay(program, day, BUILT_IN_EXERCISES, [], t(0));
    const bench = BUILT_IN_EXERCISES.find((e) => e.id === 'bench-press');
    const plank = BUILT_IN_EXERCISES.find((e) => e.id === 'plank');
    expect(needsStartingWeight(w.exercises[0], bench)).toBe(true);
    expect(needsStartingWeight(w.exercises[2], plank)).toBe(false);
  });
});

describe('completing sets and rest', () => {
  const start = () => startWorkoutFromDay(program, day, BUILT_IN_EXERCISES, [lastBench], t(0));

  it('starts the rest countdown for the exercise', () => {
    const w = completeSet(start(), 0, 0, t(10));
    expect(w.exercises[0].sets[0].completed).toBe(true);
    expect(w.rest).toEqual({ endsAt: t(130).toISOString(), totalSec: 120 });
  });

  it('records actual rest on the previous set when the next set is completed', () => {
    let w = completeSet(start(), 0, 0, t(10));
    w = completeSet(w, 0, 1, t(150)); // rested 140s
    expect(w.exercises[0].sets[0].restSec).toBe(140);
    expect(w.exercises[0].sets[1].restSec).toBeUndefined();
    w = completeSet(w, 1, 0, t(250)); // rest across exercises still counts
    expect(w.exercises[0].sets[1].restSec).toBe(100);
  });

  it('un-ticking clears the countdown and does not record rest from that set', () => {
    let w = completeSet(start(), 0, 0, t(10));
    w = uncompleteSet(w, 0, 0);
    expect(w.rest).toBeUndefined();
    w = completeSet(w, 0, 1, t(200));
    expect(w.exercises[0].sets[0].restSec).toBeUndefined();
  });

  it('adjusts the countdown, never into the past', () => {
    let w = completeSet(start(), 0, 0, t(0)); // ends at t(120)
    w = adjustRest(w, 15, t(5));
    expect(w.rest?.endsAt).toBe(t(135).toISOString());
    w = adjustRest(w, -600, t(5));
    expect(w.rest?.endsAt).toBe(t(5).toISOString());
  });
});

describe('changing the workout', () => {
  it('adds an exercise prefilled from last time', () => {
    const bench = BUILT_IN_EXERCISES.find((e) => e.id === 'bench-press')!;
    const w = addExercise({ id: 'x', startedAt: '', exercises: [] }, bench, [lastBench]);
    expect(w.exercises[0].sets.map((s) => [s.weightKg, s.reps, s.completed])).toEqual([
      [80, 5, false],
      [80, 5, false],
      [80, 5, false],
    ]);
  });

  it('adds and removes sets', () => {
    let w = startWorkoutFromDay(program, day, BUILT_IN_EXERCISES, [], t(0));
    w = addSet(w, 1);
    expect(w.exercises[1].sets).toHaveLength(3);
    expect(w.exercises[1].sets[2].weightKg).toBe(40);
    w = removeLastSet(w, 1);
    expect(w.exercises[1].sets).toHaveLength(2);
  });

  it('keeps the last-completed pointer correct when removing an earlier exercise', () => {
    let w = startWorkoutFromDay(program, day, BUILT_IN_EXERCISES, [], t(0));
    w = completeSet(w, 1, 0, t(10));
    w = removeExercise(w, 0);
    expect(w.lastCompleted?.exerciseIndex).toBe(0);
    w = completeSet(w, 0, 1, t(100));
    expect(w.exercises[0].sets[0].restSec).toBe(90);
  });
});
