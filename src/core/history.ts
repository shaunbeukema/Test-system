// Pure functions for looking back at past training.
import type { Exercise, Program, SetLog, Workout, WorkoutExercise } from './types';

export interface Session {
  workout: Workout;
  entry: WorkoutExercise;
  /** Completed sets only. */
  sets: SetLog[];
}

/** Every finished session of an exercise (with at least one completed set), newest first. */
export function exerciseSessions(exerciseId: string, workouts: Workout[]): Session[] {
  return workouts
    .filter((w) => w.finishedAt)
    .flatMap((workout) =>
      workout.exercises
        .filter((e) => e.exerciseId === exerciseId)
        .map((entry) => ({ workout, entry, sets: entry.sets.filter((s) => s.completed) })),
    )
    .filter((s) => s.sets.length > 0)
    .sort((a, b) => b.workout.startedAt.localeCompare(a.workout.startedAt));
}

/** The best set: heaviest weight, then most reps (or longest time / distance for timed and cardio). */
export function bestSet(sets: SetLog[]): SetLog | undefined {
  let best: SetLog | undefined;
  for (const s of sets) {
    if (!best || compareSets(s, best) > 0) best = s;
  }
  return best;
}

function compareSets(a: SetLog, b: SetLog): number {
  return (
    (a.weightKg ?? 0) - (b.weightKg ?? 0) ||
    (a.reps ?? 0) - (b.reps ?? 0) ||
    (a.distanceM ?? 0) - (b.distanceM ?? 0) ||
    (a.durationSec ?? 0) - (b.durationSec ?? 0)
  );
}

export interface ExerciseSummary {
  exercise: Exercise;
  lastDate: string;
  sessionCount: number;
  best: SetLog;
}

/** Exercises that have history, most recently done first. */
export function exercisesWithHistory(exercises: Exercise[], workouts: Workout[]): ExerciseSummary[] {
  return exercises
    .map((exercise) => {
      const sessions = exerciseSessions(exercise.id, workouts);
      if (!sessions.length) return undefined;
      return {
        exercise,
        lastDate: sessions[0].workout.startedAt,
        sessionCount: sessions.length,
        best: bestSet(sessions.flatMap((s) => s.sets))!,
      };
    })
    .filter((s): s is ExerciseSummary => s !== undefined)
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

/** True if an exercise appears in any workout or program (so deleting it would break history). */
export function isExerciseUsed(exerciseId: string, workouts: Workout[], programs: Program[]): boolean {
  return (
    workouts.some((w) => w.exercises.some((e) => e.exerciseId === exerciseId)) ||
    programs.some((p) => p.weeks.some((wk) => wk.days.some((d) => d.exercises.some((e) => e.exerciseId === exerciseId))))
  );
}
