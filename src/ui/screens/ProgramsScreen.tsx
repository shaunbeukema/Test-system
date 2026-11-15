import { useEffect, useState } from 'react';
import { createProgram } from '../../core/programEdit';
import type { Exercise, Program, Settings } from '../../core/types';
import { DayEditor } from '../program/DayEditor';
import { ProgramEditor } from '../program/ProgramEditor';
import { storage } from '../storage';

type View = { kind: 'list' } | { kind: 'program'; programId: string } | { kind: 'day'; programId: string; dayId: string };

interface Props {
  /** Open straight into creating a program (from the Home screen button). */
  startCreating?: boolean;
}

export function ProgramsScreen({ startCreating }: Props) {
  const [programs, setPrograms] = useState<Program[]>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [view, setView] = useState<View>({ kind: 'list' });
  const [creating, setCreating] = useState(!!startCreating);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    (async () => {
      const [p, e, s] = await Promise.all([storage.getPrograms(), storage.getExercises(), storage.getSettings()]);
      setPrograms(p.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      setExercises(e);
      setSettings(s);
    })();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  if (!programs || !settings) return <main className="screen" />;

  /** Save a program edit: update the screen immediately and persist in the background. */
  const saveProgram = (program: Program) => {
    setPrograms((list) => list!.map((p) => (p.id === program.id ? program : p)));
    void storage.saveProgram(program);
  };

  const setActive = async (programId: string) => {
    const next = { ...settings, activeProgramId: programId };
    setSettings(next);
    await storage.saveSettings(next);
  };

  const create = async () => {
    const program = createProgram(newName);
    await storage.saveProgram(program);
    setPrograms([...programs, program]);
    if (!settings.activeProgramId) await setActive(program.id);
    setCreating(false);
    setNewName('');
    setView({ kind: 'program', programId: program.id });
  };

  const deleteProgram = async (programId: string) => {
    await storage.deleteProgram(programId);
    setPrograms(programs.filter((p) => p.id !== programId));
    if (settings.activeProgramId === programId) {
      const next = { ...settings, activeProgramId: undefined };
      setSettings(next);
      await storage.saveSettings(next);
    }
    setView({ kind: 'list' });
  };

  const createExercise = async (exercise: Exercise) => {
    await storage.saveExercise(exercise);
    setExercises((list) => [...list, exercise]);
  };

  if (view.kind === 'day') {
    const program = programs.find((p) => p.id === view.programId);
    if (program) {
      return (
        <DayEditor
          program={program}
          dayId={view.dayId}
          exercises={exercises}
          unit={settings.unit}
          defaultRestSec={settings.defaultRestSec}
          onChange={saveProgram}
          onCreateExercise={createExercise}
          onBack={() => setView({ kind: 'program', programId: program.id })}
        />
      );
    }
  }

  if (view.kind === 'program' || view.kind === 'day') {
    const program = programs.find((p) => p.id === view.programId);
    if (program) {
      return (
        <ProgramEditor
          program={program}
          isActive={settings.activeProgramId === program.id}
          onChange={saveProgram}
          onOpenDay={(dayId) => setView({ kind: 'day', programId: program.id, dayId })}
          onSetActive={() => setActive(program.id)}
          onDelete={() => deleteProgram(program.id)}
          onBack={() => setView({ kind: 'list' })}
        />
      );
    }
  }

  return (
    <main className="screen">
      <h1 className="title">Programs</h1>

      {programs.length > 0 && (
        <div className="list">
          {programs.map((p) => {
            const days = p.weeks.reduce((n, w) => n + w.days.length, 0);
            return (
              <button key={p.id} type="button" className="list-row list-btn tall" onClick={() => setView({ kind: 'program', programId: p.id })}>
                <span>
                  <span className="row-title">{p.name}</span>
                  <span className="row-sub muted">
                    {p.weeks.length} {p.weeks.length === 1 ? 'week' : 'weeks'} · {days} {days === 1 ? 'day' : 'days'}
                  </span>
                </span>
                {settings.activeProgramId === p.id ? <span className="tag tag-accent">Active</span> : <span className="muted">›</span>}
              </button>
            );
          })}
        </div>
      )}

      {creating ? (
        <div className="card form-card spaced">
          <label className="field-label" htmlFor="program-name">
            Program name
          </label>
          <input
            id="program-name"
            className="text-input"
            placeholder="e.g. Strength Block"
            value={newName}
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <div className="row-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={create}>
              Create
            </button>
          </div>
        </div>
      ) : (
        <>
          {programs.length === 0 && (
            <div className="card empty">
              <p>Build your training block: add weeks, days, and the exercises for each day.</p>
            </div>
          )}
          <button type="button" className="btn btn-primary btn-block spaced" onClick={() => setCreating(true)}>
            + New Program
          </button>
        </>
      )}
    </main>
  );
}
