import Dexie, { type EntityTable } from 'dexie';
import { BACKUP_VERSION, type Backup } from '../core/backup';
import { BUILT_IN_EXERCISES } from '../core/exercises';
import type { Storage } from '../core/storage';
import { DEFAULT_SETTINGS, type Exercise, type Program, type Settings, type Workout } from '../core/types';

interface SettingsRow extends Settings {
  key: 'settings';
}

class LiftrDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  programs!: EntityTable<Program, 'id'>;
  workouts!: EntityTable<Workout, 'id'>;
  settings!: EntityTable<SettingsRow, 'key'>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      exercises: 'id, name',
      programs: 'id',
      workouts: 'id, startedAt, programId',
      settings: 'key',
    });
    this.on('populate', (tx) => {
      tx.table('exercises').bulkAdd(BUILT_IN_EXERCISES);
    });
  }
}

/** On-device storage using the browser's IndexedDB. */
export class DexieStorage implements Storage {
  private db: LiftrDB;

  constructor(dbName = 'liftr') {
    this.db = new LiftrDB(dbName);
  }

  getExercises() {
    return this.db.exercises.orderBy('name').toArray();
  }
  async saveExercise(exercise: Exercise) {
    await this.db.exercises.put(exercise);
  }
  async deleteExercise(id: string) {
    await this.db.exercises.delete(id);
  }

  getPrograms() {
    return this.db.programs.toArray();
  }
  async saveProgram(program: Program) {
    await this.db.programs.put(program);
  }
  async deleteProgram(id: string) {
    await this.db.programs.delete(id);
  }

  getWorkouts() {
    return this.db.workouts.orderBy('startedAt').reverse().toArray();
  }
  async saveWorkout(workout: Workout) {
    await this.db.workouts.put(workout);
  }
  async deleteWorkout(id: string) {
    await this.db.workouts.delete(id);
  }

  async getSettings(): Promise<Settings> {
    const row = await this.db.settings.get('settings');
    if (!row) return { ...DEFAULT_SETTINGS };
    const { key: _key, ...settings } = row;
    return { ...DEFAULT_SETTINGS, ...settings };
  }
  async saveSettings(settings: Settings) {
    await this.db.settings.put({ ...settings, key: 'settings' });
  }

  async exportAll(): Promise<Backup> {
    const [exercises, programs, workouts, settings] = await Promise.all([
      this.db.exercises.toArray(),
      this.getPrograms(),
      this.getWorkouts(),
      this.getSettings(),
    ]);
    return { app: 'liftr', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), exercises, programs, workouts, settings };
  }

  async importAll(backup: Backup) {
    await this.db.transaction('rw', [this.db.exercises, this.db.programs, this.db.workouts, this.db.settings], async () => {
      await Promise.all([this.db.exercises.clear(), this.db.programs.clear(), this.db.workouts.clear(), this.db.settings.clear()]);
      await this.db.exercises.bulkPut(backup.exercises);
      await this.db.programs.bulkPut(backup.programs);
      await this.db.workouts.bulkPut(backup.workouts);
      await this.db.settings.put({ ...backup.settings, key: 'settings' });
    });
  }

  /** For tests: remove the database entirely. */
  async destroy() {
    await this.db.delete();
  }
}
