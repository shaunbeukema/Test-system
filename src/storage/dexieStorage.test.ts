import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { BackupError, parseBackup } from '../core/backup';
import { DexieStorage } from './dexieStorage';

let store: DexieStorage;
afterEach(async () => store?.destroy());

describe('DexieStorage', () => {
  it('preloads the built-in exercises on first use', async () => {
    store = new DexieStorage('test-seed');
    const exercises = await store.getExercises();
    expect(exercises.length).toBeGreaterThanOrEqual(30);
    expect(exercises.some((e) => e.id === 'bench-press')).toBe(true);
  });

  it('returns default settings and saves changes', async () => {
    store = new DexieStorage('test-settings');
    expect((await store.getSettings()).unit).toBe('kg');
    await store.saveSettings({ unit: 'lb', defaultRestSec: 90 });
    expect(await store.getSettings()).toMatchObject({ unit: 'lb', defaultRestSec: 90 });
  });

  it('exports and re-imports all data (backup round trip)', async () => {
    store = new DexieStorage('test-backup');
    await store.saveWorkout({ id: 'w1', startedAt: '2026-11-01', finishedAt: '2026-11-01', exercises: [] });
    const backup = parseBackup(JSON.parse(JSON.stringify(await store.exportAll())));

    await store.deleteWorkout('w1');
    expect(await store.getWorkouts()).toHaveLength(0);

    await store.importAll(backup);
    expect((await store.getWorkouts()).map((w) => w.id)).toEqual(['w1']);
  });
});

describe('parseBackup', () => {
  it('rejects files that are not Liftr backups', () => {
    expect(() => parseBackup({ hello: 'world' })).toThrow(BackupError);
    expect(() => parseBackup({ app: 'liftr', version: 999, exercises: [], programs: [], workouts: [], settings: {} })).toThrow(/newer/);
  });
});
