import type { Backup } from './backup';
import type { Exercise, Program, Settings, Workout } from './types';

/**
 * The one interface the app uses to save data.
 * Today: IndexedDB in the browser. Later: native storage via Capacitor — only a new implementation needed.
 */
export interface Storage {
  getExercises(): Promise<Exercise[]>;
  saveExercise(exercise: Exercise): Promise<void>;
  deleteExercise(id: string): Promise<void>;

  getPrograms(): Promise<Program[]>;
  saveProgram(program: Program): Promise<void>;
  deleteProgram(id: string): Promise<void>;

  getWorkouts(): Promise<Workout[]>;
  saveWorkout(workout: Workout): Promise<void>;
  deleteWorkout(id: string): Promise<void>;

  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;

  exportAll(): Promise<Backup>;
  /** Replace all data with the backup's contents. */
  importAll(backup: Backup): Promise<void>;
}
