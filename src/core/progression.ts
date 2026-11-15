import type { Exercise, PlannedExercise, WorkoutExercise, Workout } from './types';

export interface LastPerformance {
  workout: Workout;
  entry: WorkoutExercise;
}

/** The most recent finished workout where this exercise had at least one completed set. */
export function findLastPerformance(exerciseId: string, workouts: Workout[]): LastPerformance | undefined {
  const finished = workouts
    .filter((w) => w.finishedAt)
    .sort((a, b) => (b.finishedAt! < a.finishedAt! ? -1 : b.finishedAt! > a.finishedAt! ? 1 : 0));
  for (const workout of finished) {
    const entry = workout.exercises.find(
      (e) => e.exerciseId === exerciseId && e.sets.some((s) => s.completed),
    );
    if (entry) return { workout, entry };
  }
  return undefined;
}

/** Heaviest completed weight in an entry (the "top set"), or undefined if no weights logged. */
export function topSetWeightKg(entry: WorkoutExercise): number | undefined {
  const weights = entry.sets.filter((s) => s.completed && s.weightKg !== undefined).map((s) => s.weightKg!);
  return weights.length ? Math.max(...weights) : undefined;
}

export interface Recommendation {
  weightKg: number;
  /** True when this is an increase over last time. */
  increase: boolean;
}

/**
 * Recommend the weight for next time (spec section 4):
 * - If every planned set was completed at or above its target reps, add the exercise's increment.
 * - Otherwise keep the same weight (never auto-lower).
 * Only applies to weighted exercises with a positive increment and a previous top-set weight.
 */
export function recommendWeight(
  exercise: Exercise,
  planned: PlannedExercise,
  last: WorkoutExercise | undefined,
): Recommendation | undefined {
  if (!last || exercise.type !== 'weight' || exercise.incrementKg <= 0) return undefined;
  const lastWeight = topSetWeightKg(last);
  if (lastWeight === undefined) return undefined;

  const hitAllTargets =
    planned.sets.length > 0 &&
    planned.sets.every((target, i) => {
      const done = last.sets[i];
      return done?.completed === true && (target.reps === undefined || (done.reps ?? 0) >= target.reps);
    });

  return hitAllTargets
    ? { weightKg: round3(lastWeight + exercise.incrementKg), increase: true }
    : { weightKg: lastWeight, increase: false };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
