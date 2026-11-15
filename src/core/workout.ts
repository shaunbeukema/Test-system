// Pure functions for running a workout. Each returns a new Workout (never mutates the input).
import { newId } from './id';
import type { DayRef } from './program';
import { findLastPerformance, recommendWeight, topSetWeightKg } from './progression';
import type { Exercise, Program, SetLog, Workout, WorkoutExercise } from './types';

/** Longest rest we record; anything longer is treated as a break, not rest. */
const MAX_RECORDED_REST_SEC = 60 * 60;

/**
 * Start a workout from a program day. Each set is prefilled:
 * targets from the plan; weight from the recommendation (if there is history), otherwise the planned weight.
 */
export function startWorkoutFromDay(
  program: Program,
  ref: DayRef,
  exercises: Exercise[],
  history: Workout[],
  now = new Date(),
): Workout {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  return {
    id: newId(),
    startedAt: now.toISOString(),
    programId: program.id,
    dayId: ref.day.id,
    name: ref.day.name,
    exercises: ref.day.exercises.map((planned) => {
      const exercise = byId.get(planned.exerciseId);
      const last = findLastPerformance(planned.exerciseId, history)?.entry;
      const suggestion = exercise ? recommendWeight(exercise, planned, last) : undefined;
      const fallbackWeight = exercise?.type === 'weight' && last ? topSetWeightKg(last) : undefined;
      return {
        exerciseId: planned.exerciseId,
        plannedExerciseId: planned.id,
        restSec: planned.restSec,
        suggestion,
        sets: planned.sets.map((target) => ({
          reps: target.reps,
          durationSec: target.durationSec,
          distanceM: target.distanceM,
          weightKg: suggestion?.weightKg ?? target.weightKg ?? fallbackWeight,
          completed: false,
        })),
      };
    }),
  };
}

export function startEmptyWorkout(now = new Date()): Workout {
  return { id: newId(), startedAt: now.toISOString(), name: 'Workout', exercises: [] };
}

/** Add an exercise mid-workout, prefilled from last time (or sensible defaults). */
export function addExercise(workout: Workout, exercise: Exercise, history: Workout[]): Workout {
  const last = findLastPerformance(exercise.id, history)?.entry;
  const sets: SetLog[] = last
    ? last.sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps, durationSec: s.durationSec, distanceM: s.distanceM, completed: false }))
    : Array.from({ length: exercise.type === 'cardio' ? 1 : 3 }, () => defaultSet(exercise));
  const entry: WorkoutExercise = { exerciseId: exercise.id, restSec: exercise.defaultRestSec, sets };
  return { ...workout, exercises: [...workout.exercises, entry] };
}

function defaultSet(exercise: Exercise): SetLog {
  switch (exercise.type) {
    case 'timed':
      return { durationSec: 30, completed: false };
    case 'cardio':
      return { durationSec: 600, completed: false };
    default:
      return { reps: 8, completed: false };
  }
}

export function removeExercise(workout: Workout, exerciseIndex: number): Workout {
  let lastCompleted = workout.lastCompleted;
  let rest = workout.rest;
  if (lastCompleted?.exerciseIndex === exerciseIndex) {
    lastCompleted = undefined;
    rest = undefined;
  } else if (lastCompleted && lastCompleted.exerciseIndex > exerciseIndex) {
    lastCompleted = { ...lastCompleted, exerciseIndex: lastCompleted.exerciseIndex - 1 };
  }
  return { ...workout, exercises: workout.exercises.filter((_, i) => i !== exerciseIndex), lastCompleted, rest };
}

/** Add a set copying the previous one (uncompleted). */
export function addSet(workout: Workout, exerciseIndex: number): Workout {
  return updateEntry(workout, exerciseIndex, (e) => {
    const prev = e.sets[e.sets.length - 1];
    const set: SetLog = prev ? { weightKg: prev.weightKg, reps: prev.reps, durationSec: prev.durationSec, distanceM: prev.distanceM, completed: false } : { completed: false };
    return { ...e, sets: [...e.sets, set] };
  });
}

/** Remove the last set of an exercise. */
export function removeLastSet(workout: Workout, exerciseIndex: number): Workout {
  const entry = workout.exercises[exerciseIndex];
  if (!entry || entry.sets.length === 0) return workout;
  const setIndex = entry.sets.length - 1;
  const pointsHere = workout.lastCompleted?.exerciseIndex === exerciseIndex && workout.lastCompleted.setIndex === setIndex;
  const next = updateEntry(workout, exerciseIndex, (e) => ({ ...e, sets: e.sets.slice(0, -1) }));
  return pointsHere ? { ...next, lastCompleted: undefined, rest: undefined } : next;
}

export function updateSet(workout: Workout, exerciseIndex: number, setIndex: number, patch: Partial<SetLog>): Workout {
  return updateEntry(workout, exerciseIndex, (e) => ({
    ...e,
    sets: e.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s)),
  }));
}

/** Set the weight on every set of an exercise (used for "Starting weight?"). */
export function setAllWeights(workout: Workout, exerciseIndex: number, weightKg: number): Workout {
  return updateEntry(workout, exerciseIndex, (e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, weightKg })) }));
}

/** True when a weighted exercise has no weight on any set yet. */
export function needsStartingWeight(entry: WorkoutExercise, exercise: Exercise | undefined): boolean {
  return exercise?.type === 'weight' && entry.sets.length > 0 && entry.sets.every((s) => s.weightKg === undefined);
}

/**
 * Tick a set as done:
 * - records the actual rest on the previously completed set (time since it was ticked),
 * - starts the rest countdown for this exercise.
 */
export function completeSet(workout: Workout, exerciseIndex: number, setIndex: number, now = new Date()): Workout {
  const entry = workout.exercises[exerciseIndex];
  if (!entry?.sets[setIndex]) return workout;
  let next = workout;

  const prev = workout.lastCompleted;
  if (prev) {
    const prevSet = workout.exercises[prev.exerciseIndex]?.sets[prev.setIndex];
    if (prevSet?.completed && prevSet.restSec === undefined) {
      const restSec = Math.round((now.getTime() - Date.parse(prev.at)) / 1000);
      if (restSec >= 0 && restSec <= MAX_RECORDED_REST_SEC) {
        next = updateSet(next, prev.exerciseIndex, prev.setIndex, { restSec });
      }
    }
  }

  next = updateSet(next, exerciseIndex, setIndex, { completed: true, restSec: undefined });
  return {
    ...next,
    lastCompleted: { exerciseIndex, setIndex, at: now.toISOString() },
    rest: entry.restSec > 0 ? { endsAt: new Date(now.getTime() + entry.restSec * 1000).toISOString(), totalSec: entry.restSec } : undefined,
  };
}

/** Un-tick a set (e.g. tapped by mistake). */
export function uncompleteSet(workout: Workout, exerciseIndex: number, setIndex: number): Workout {
  const next = updateSet(workout, exerciseIndex, setIndex, { completed: false, restSec: undefined });
  const pointsHere = workout.lastCompleted?.exerciseIndex === exerciseIndex && workout.lastCompleted.setIndex === setIndex;
  return pointsHere ? { ...next, lastCompleted: undefined, rest: undefined } : next;
}

/** Change the running rest countdown by some seconds (e.g. +15 / −15). */
export function adjustRest(workout: Workout, deltaSec: number, now = new Date()): Workout {
  if (!workout.rest) return workout;
  const endsAt = Math.max(now.getTime(), Date.parse(workout.rest.endsAt) + deltaSec * 1000);
  return { ...workout, rest: { endsAt: new Date(endsAt).toISOString(), totalSec: Math.max(1, workout.rest.totalSec + deltaSec) } };
}

export function stopRest(workout: Workout): Workout {
  return { ...workout, rest: undefined };
}

export function finishWorkout(workout: Workout, now = new Date()): Workout {
  return { ...workout, finishedAt: now.toISOString(), rest: undefined };
}

export function completedSetCount(workout: Workout): number {
  return workout.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0);
}

function updateEntry(workout: Workout, exerciseIndex: number, update: (e: WorkoutExercise) => WorkoutExercise): Workout {
  return { ...workout, exercises: workout.exercises.map((e, i) => (i === exerciseIndex ? update(e) : e)) };
}
