import { useEffect, useRef, useState } from 'react';
import { isExerciseUsed } from '../../core/history';
import type { Exercise, Program, Settings, WeightUnit, Workout } from '../../core/types';
import { formatDuration } from '../../core/units';
import { readBackupFile, saveBackupFile } from '../backupFile';
import { NavBar } from '../components/NavBar';
import { Stepper } from '../components/Stepper';
import { storage } from '../storage';

type Loaded = [Settings, Exercise[], Workout[], Program[]];

function loadAll(): Promise<Loaded> {
  return Promise.all([storage.getSettings(), storage.getExercises(), storage.getWorkouts(), storage.getPrograms()]);
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [view, setView] = useState<'main' | 'exercises'>('main');
  const [message, setMessage] = useState<{ text: string; error?: boolean }>();
  const fileInput = useRef<HTMLInputElement>(null);

  const show = ([s, e, w, p]: Loaded) => {
    setSettings(s);
    setExercises(e);
    setWorkouts(w);
    setPrograms(p);
  };

  useEffect(() => {
    loadAll().then(show);
  }, []);

  if (!settings) return <main className="screen" />;

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    void storage.saveSettings(next);
  };

  const exportBackup = async () => {
    setMessage(undefined);
    try {
      const result = await saveBackupFile(await storage.exportAll());
      setMessage({ text: result === 'shared' ? 'Backup ready. Choose “Save to Files” to keep it in iCloud Drive.' : 'Backup downloaded.' });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setMessage({ text: 'Couldn’t create the backup.', error: true });
    }
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    setMessage(undefined);
    try {
      const backup = await readBackupFile(file);
      const when = new Date(backup.exportedAt).toLocaleDateString();
      if (!confirm(`Restore the backup from ${when}? This replaces all data on this phone (${backup.workouts.length} workouts, ${backup.programs.length} programs).`)) return;
      await storage.importAll(backup);
      show(await loadAll());
      setMessage({ text: `Restored ${backup.workouts.length} workouts and ${backup.programs.length} programs.` });
    } catch (err) {
      setMessage({ text: (err as Error).message, error: true });
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  if (view === 'exercises') {
    return (
      <MyExercises
        exercises={exercises.filter((e) => e.custom)}
        isUsed={(id) => isExerciseUsed(id, workouts, programs)}
        onRename={async (e, name) => {
          const next = { ...e, name };
          await storage.saveExercise(next);
          setExercises((list) => list.map((x) => (x.id === e.id ? next : x)));
        }}
        onDelete={async (e) => {
          await storage.deleteExercise(e.id);
          setExercises((list) => list.filter((x) => x.id !== e.id));
        }}
        onBack={() => setView('main')}
      />
    );
  }

  const customCount = exercises.filter((e) => e.custom).length;

  return (
    <main className="screen">
      <h1 className="title">Settings</h1>

      <h2 className="section-title">Units</h2>
      <div className="segmented segmented-2" role="radiogroup" aria-label="Weight unit">
        {(['kg', 'lb'] as WeightUnit[]).map((u) => (
          <button key={u} type="button" role="radio" aria-checked={settings.unit === u} className="segment segment-lg" onClick={() => update({ unit: u })}>
            {u === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'}
          </button>
        ))}
      </div>

      <h2 className="section-title">Workouts</h2>
      <div className="card form-card">
        <Stepper label="Default rest" value={settings.defaultRestSec} step={15} min={15} format={formatDuration} onChange={(n) => update({ defaultRestSec: n ?? 120 })} />
      </div>
      <p className="hint">Used for new custom exercises. Each exercise in a program has its own rest time.</p>

      <h2 className="section-title">Exercises</h2>
      <div className="list">
        <button type="button" className="list-row list-btn" onClick={() => setView('exercises')}>
          <span>My Exercises</span>
          <span className="muted num">{customCount} ›</span>
        </button>
      </div>

      <h2 className="section-title">Backup</h2>
      <div className="card backup-card">
        <p className="backup-text">
          Your data lives only on this phone. Export a backup regularly and keep it in iCloud Drive. If Safari’s data is ever cleared, you can restore it.
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={exportBackup}>
          Export Backup
        </button>
        <button type="button" className="btn btn-secondary btn-block import-btn" onClick={() => fileInput.current?.click()}>
          Restore from Backup…
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label="Backup file"
          hidden
          onChange={(e) => importBackup(e.target.files?.[0])}
        />
        {message && (
          <p className={`backup-msg${message.error ? ' backup-msg-error' : ''}`} role="status">
            {message.text}
          </p>
        )}
      </div>

      <p className="hint about">Liftr · your data stays on your phone.</p>
    </main>
  );
}

interface MyExercisesProps {
  exercises: Exercise[];
  isUsed: (id: string) => boolean;
  onRename: (e: Exercise, name: string) => Promise<void>;
  onDelete: (e: Exercise) => Promise<void>;
  onBack: () => void;
}

function MyExercises({ exercises, isUsed, onRename, onDelete, onBack }: MyExercisesProps) {
  return (
    <main className="screen">
      <NavBar backLabel="Settings" onBack={onBack} />
      <h1 className="title">My Exercises</h1>
      {exercises.length === 0 ? (
        <div className="card empty">
          <p>Exercises you create while building a program or during a workout appear here.</p>
        </div>
      ) : (
        <div className="list">
          {exercises
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((e) => (
              <div key={e.id} className="list-row">
                <span>{e.name}</span>
                <span className="row-actions-inline">
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      const name = prompt('Rename exercise', e.name)?.trim();
                      if (name && name !== e.name) void onRename(e, name);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="link-btn danger"
                    onClick={() => {
                      if (isUsed(e.id)) {
                        alert(`“${e.name}” is used in a program or workout, so it can’t be deleted (your history would break). You can rename it instead.`);
                      } else if (confirm(`Delete “${e.name}”?`)) {
                        void onDelete(e);
                      }
                    }}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}
