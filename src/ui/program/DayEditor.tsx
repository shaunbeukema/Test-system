import { useState } from 'react';
import {
  defaultShorthand,
  describePlanned,
  findDay,
  moveItem,
  plannedFromShorthand,
  removeDay,
  shorthandOf,
  updateDay,
  type Shorthand,
} from '../../core/programEdit';
import type { Exercise, PlannedExercise, Program, WeightUnit } from '../../core/types';
import { formatDuration } from '../../core/units';
import { NavBar } from '../components/NavBar';
import { ExercisePicker } from './ExercisePicker';
import { PlannedExerciseSheet } from './PlannedExerciseSheet';

interface Props {
  program: Program;
  dayId: string;
  exercises: Exercise[];
  unit: WeightUnit;
  defaultRestSec: number;
  onChange: (program: Program) => void;
  onCreateExercise: (exercise: Exercise) => Promise<void>;
  onBack: () => void;
}

type Editing = { exercise: Exercise; planned?: PlannedExercise; initial: Shorthand };

export function DayEditor({ program, dayId, exercises, unit, defaultRestSec, onChange, onCreateExercise, onBack }: Props) {
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<Editing>();
  const found = findDay(program, dayId);
  if (!found) return null;
  const { day, weekIndex, dayIndex } = found;
  const byId = new Map(exercises.map((e) => [e.id, e]));

  const setExercises = (list: PlannedExercise[]) => onChange(updateDay(program, dayId, (d) => ({ ...d, exercises: list })));

  const save = (value: Shorthand) => {
    if (!editing) return;
    const planned = plannedFromShorthand(editing.exercise.id, value, editing.planned?.id);
    setExercises(
      editing.planned
        ? day.exercises.map((p) => (p.id === planned.id ? planned : p))
        : [...day.exercises, planned],
    );
    setEditing(undefined);
  };

  const deleteDay = () => {
    if (!confirm(`Delete “${day.name}”?`)) return;
    onChange(removeDay(program, dayId));
    onBack();
  };

  return (
    <main className="screen">
      <NavBar backLabel={program.name} onBack={onBack} />
      <p className="eyebrow">
        Week {weekIndex + 1} · Day {dayIndex + 1}
      </p>
      <input
        className="title-input"
        aria-label="Day name"
        value={day.name}
        onChange={(e) => onChange(updateDay(program, dayId, (d) => ({ ...d, name: e.target.value })))}
      />

      {day.exercises.length === 0 ? (
        <div className="card empty">
          <p>No exercises yet. Add the lifts for this day.</p>
        </div>
      ) : (
        <ol className="list plain">
          {day.exercises.map((p, i) => {
            const ex = byId.get(p.exerciseId);
            return (
              <li key={p.id} className="exercise-row">
                <button
                  type="button"
                  className="exercise-main"
                  onClick={() => ex && setEditing({ exercise: ex, planned: p, initial: shorthandOf(p) })}
                >
                  <span className="exercise-name">{ex?.name ?? 'Unknown exercise'}</span>
                  <span className="exercise-detail num">
                    {describePlanned(p, ex, unit)} <span className="muted">· rest {formatDuration(p.restSec)}</span>
                  </span>
                </button>
                <div className="reorder">
                  <button type="button" aria-label={`Move ${ex?.name} up`} disabled={i === 0} onClick={() => setExercises(moveItem(day.exercises, i, i - 1))}>
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${ex?.name} down`}
                    disabled={i === day.exercises.length - 1}
                    onClick={() => setExercises(moveItem(day.exercises, i, i + 1))}
                  >
                    ▼
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <button type="button" className="btn btn-primary btn-block spaced" onClick={() => setPicking(true)}>
        + Add Exercise
      </button>
      <button type="button" className="btn btn-danger-text btn-block" onClick={deleteDay}>
        Delete Day
      </button>

      {picking && (
        <ExercisePicker
          exercises={exercises}
          defaultRestSec={defaultRestSec}
          onCreate={onCreateExercise}
          onClose={() => setPicking(false)}
          onPick={(exercise) => {
            setPicking(false);
            setEditing({ exercise, initial: defaultShorthand(exercise) });
          }}
        />
      )}

      {editing && (
        <PlannedExerciseSheet
          exercise={editing.exercise}
          initial={editing.initial}
          unit={unit}
          isNew={!editing.planned}
          onSave={save}
          onClose={() => setEditing(undefined)}
          onDelete={
            editing.planned
              ? () => {
                  setExercises(day.exercises.filter((p) => p.id !== editing.planned!.id));
                  setEditing(undefined);
                }
              : undefined
          }
        />
      )}
    </main>
  );
}
