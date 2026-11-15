import type { Exercise, ExerciseType } from './types';

type Seed = [id: string, name: string, type: ExerciseType, restSec: number, incrementKg: number];

// Built-in exercise list. IDs are stable so saved data keeps working across versions.
const SEEDS: Seed[] = [
  // Barbell compounds
  ['back-squat', 'Back Squat', 'weight', 180, 2.5],
  ['front-squat', 'Front Squat', 'weight', 180, 2.5],
  ['deadlift', 'Deadlift', 'weight', 180, 5],
  ['romanian-deadlift', 'Romanian Deadlift', 'weight', 120, 2.5],
  ['bench-press', 'Bench Press', 'weight', 180, 2.5],
  ['incline-bench-press', 'Incline Bench Press', 'weight', 150, 2.5],
  ['overhead-press', 'Overhead Press', 'weight', 150, 2.5],
  ['barbell-row', 'Barbell Row', 'weight', 120, 2.5],
  ['hip-thrust', 'Hip Thrust', 'weight', 120, 5],
  // Dumbbell
  ['db-bench-press', 'Dumbbell Bench Press', 'weight', 120, 2],
  ['db-shoulder-press', 'Dumbbell Shoulder Press', 'weight', 120, 2],
  ['db-row', 'Dumbbell Row', 'weight', 90, 2],
  ['db-lunge', 'Dumbbell Lunge', 'weight', 90, 2],
  ['lateral-raise', 'Lateral Raise', 'weight', 60, 1],
  ['bicep-curl', 'Bicep Curl', 'weight', 60, 1],
  ['hammer-curl', 'Hammer Curl', 'weight', 60, 1],
  // Machine / cable
  ['lat-pulldown', 'Lat Pulldown', 'weight', 90, 2.5],
  ['seated-cable-row', 'Seated Cable Row', 'weight', 90, 2.5],
  ['leg-press', 'Leg Press', 'weight', 120, 5],
  ['leg-curl', 'Leg Curl', 'weight', 60, 2.5],
  ['leg-extension', 'Leg Extension', 'weight', 60, 2.5],
  ['tricep-pushdown', 'Tricep Pushdown', 'weight', 60, 2.5],
  ['face-pull', 'Face Pull', 'weight', 60, 2.5],
  ['calf-raise', 'Calf Raise', 'weight', 60, 5],
  // Bodyweight
  ['pull-up', 'Pull-up', 'bodyweight', 120, 2.5],
  ['chin-up', 'Chin-up', 'bodyweight', 120, 2.5],
  ['dip', 'Dip', 'bodyweight', 120, 2.5],
  ['push-up', 'Push-up', 'bodyweight', 60, 2.5],
  // Timed
  ['plank', 'Plank', 'timed', 60, 0],
  ['dead-hang', 'Dead Hang', 'timed', 60, 0],
  ['farmers-carry', "Farmer's Carry", 'timed', 90, 2.5],
  // Cardio
  ['rower', 'Rower', 'cardio', 60, 0],
  ['bike', 'Bike', 'cardio', 60, 0],
  ['treadmill', 'Treadmill', 'cardio', 60, 0],
];

export const BUILT_IN_EXERCISES: Exercise[] = SEEDS.map(([id, name, type, defaultRestSec, incrementKg]) => ({
  id,
  name,
  type,
  defaultRestSec,
  incrementKg,
  custom: false,
}));
