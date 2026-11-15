import type { Exercise, Program, Settings, Workout } from './types';

export const BACKUP_VERSION = 1;

/** The export file format. This is also the migration path to a future native app. */
export interface Backup {
  app: 'liftr';
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  programs: Program[];
  workouts: Workout[];
  settings: Settings;
}

export class BackupError extends Error {}

/** Check an untrusted parsed JSON value is a Liftr backup this version can read. */
export function parseBackup(value: unknown): Backup {
  if (typeof value !== 'object' || value === null) throw new BackupError('Not a Liftr backup file.');
  const b = value as Partial<Backup>;
  if (b.app !== 'liftr') throw new BackupError('Not a Liftr backup file.');
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    throw new BackupError('This backup was made by a newer version of Liftr.');
  }
  for (const key of ['exercises', 'programs', 'workouts'] as const) {
    if (!Array.isArray(b[key])) throw new BackupError(`Backup is missing ${key}.`);
  }
  if (typeof b.settings !== 'object' || b.settings === null) throw new BackupError('Backup is missing settings.');
  return b as Backup;
}
