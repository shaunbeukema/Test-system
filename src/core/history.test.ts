import { describe, expect, it } from 'vitest';
import { BUILT_IN_EXERCISES } from './exercises';
import { bestSet, exerciseSessions, exercisesWithHistory, isExerciseUsed } from './history';
import type { Program, Workout } from './types';

const w = (id: string, date: string, finished: boolean, sets: [number, number, boolean][], exerciseId = 'bench-press'): Workout => ({
  id,
  startedAt: date,
  finishedAt: finished ? date : undefined,
  exercises: [{ exerciseId, restSec: 120, sets: sets.map(([weightKg, reps, completed]) => ({ weightKg, reps, completed })) }],
});

const workouts = [
  w('a', '2026-11-01T10:00:00Z', true, [[80, 5, true], [80, 5, true], [80, 4, false]]),
  w('b', '2026-11-08T10:00:00Z', true, [[82.5, 5, true], [82.5, 6, true]]),
  w('c', '2026-11-10T10:00:00Z', false, [[100, 5, true]]), // unfinished: ignored
  w('d', '2026-11-09T10:00:00Z', true, [[60, 5, false]]), // nothing completed: ignored
  w('e', '2026-11-05T10:00:00Z', true, [[100, 8, true]], 'back-squat'),
];

describe('exerciseSessions', () => {
  it('lists finished sessions newest first with completed sets only', () => {
    const sessions = exerciseSessions('bench-press', workouts);
    expect(sessions.map((s) => s.workout.id)).toEqual(['b', 'a']);
    expect(sessions[1].sets).toHaveLength(2);
  });
});

describe('bestSet', () => {
  it('prefers heavier weight, then more reps', () => {
    expect(bestSet([{ weightKg: 80, reps: 8, completed: true }, { weightKg: 82.5, reps: 5, completed: true }, { weightKg: 82.5, reps: 6, completed: true }])).toEqual({
      weightKg: 82.5,
      reps: 6,
      completed: true,
    });
  });
});

describe('exercisesWithHistory', () => {
  it('summarises exercises with history, most recent first', () => {
    const list = exercisesWithHistory(BUILT_IN_EXERCISES, workouts);
    expect(list.map((s) => s.exercise.id)).toEqual(['bench-press', 'back-squat']);
    expect(list[0]).toMatchObject({ sessionCount: 2, lastDate: '2026-11-08T10:00:00Z', best: { weightKg: 82.5, reps: 6 } });
  });
});

describe('isExerciseUsed', () => {
  const program: Program = {
    id: 'p',
    name: 'P',
    createdAt: '',
    runStartedAt: '',
    weeks: [{ id: 'w', name: 'Week 1', days: [{ id: 'd', name: 'D', exercises: [{ id: 'x', exerciseId: 'my-lift', restSec: 60, sets: [] }] }] }],
  };
  it('detects use in workouts and programs', () => {
    expect(isExerciseUsed('back-squat', workouts, [])).toBe(true);
    expect(isExerciseUsed('my-lift', [], [program])).toBe(true);
    expect(isExerciseUsed('deadlift', workouts, [program])).toBe(false);
  });
});
