// Liftr core data model. Pure types: no UI, no storage details.
// All weights are stored in kilograms; units are converted only for display.

export type ExerciseType = 'weight' | 'bodyweight' | 'timed' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  /** Default target rest after each set, in seconds. */
  defaultRestSec: number;
  /** How much to add when a weight increase is recommended (kg). */
  incrementKg: number;
  /** True for exercises the user created (false for the built-in list). */
  custom: boolean;
}

/** One planned set. Which fields matter depends on the exercise type. */
export interface PlannedSet {
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  distanceM?: number;
}

export interface PlannedExercise {
  id: string;
  exerciseId: string;
  sets: PlannedSet[];
  restSec: number;
}

export interface ProgramDay {
  id: string;
  name: string;
  exercises: PlannedExercise[];
}

export interface ProgramWeek {
  id: string;
  name: string;
  days: ProgramDay[];
}

export interface Program {
  id: string;
  name: string;
  weeks: ProgramWeek[];
  createdAt: string;
  /** When the current run of this block started (reset when repeating the block). */
  runStartedAt: string;
}

export interface SetLog {
  weightKg?: number;
  reps?: number;
  durationSec?: number;
  distanceM?: number;
  /** Actual rest taken after this set, in seconds. */
  restSec?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  plannedExerciseId?: string;
  sets: SetLog[];
}

export interface Workout {
  id: string;
  startedAt: string;
  finishedAt?: string;
  programId?: string;
  dayId?: string;
  exercises: WorkoutExercise[];
}

export type WeightUnit = 'kg' | 'lb';

export interface Settings {
  unit: WeightUnit;
  defaultRestSec: number;
  activeProgramId?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  defaultRestSec: 120,
};
