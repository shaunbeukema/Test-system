import { useState } from 'react';
import type { Exercise, SetLog, WeightUnit, WorkoutExercise } from '../../core/types';
import { displayWeight, formatWeight, unitToKg } from '../../core/units';
import { describeSet, summarizeSets } from '../format';
import { NumberCell } from '../components/NumberCell';
import { Stepper } from '../components/Stepper';

interface Props {
  entry: WorkoutExercise;
  exercise: Exercise | undefined;
  /** Sets from last time this exercise was done (for the "Last" column). */
  lastSets?: SetLog[];
  needsWeight: boolean;
  unit: WeightUnit;
  /** Hide the "Last" column and line (e.g. when editing a past workout). */
  hideLast?: boolean;
  onUpdateSet: (setIndex: number, patch: Partial<SetLog>) => void;
  onToggleSet: (setIndex: number) => void;
  onSetStartingWeight: (weightKg: number) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onRemoveExercise: () => void;
}

export function ExerciseCard(props: Props) {
  const { entry, exercise, needsWeight, unit } = props;
  const lastSets = props.hideLast ? undefined : props.lastSets;
  const type = exercise?.type ?? 'weight';
  const [menuOpen, setMenuOpen] = useState(false);
  const allDone = entry.sets.length > 0 && entry.sets.every((s) => s.completed);

  const toUnit = (kg: number | undefined) => (kg === undefined ? undefined : displayWeight(kg, unit));
  const fromUnit = (v: number | undefined) => (v === undefined ? undefined : unitToKg(v, unit));

  const lastSummary = summarizeSets(lastSets, type, unit);

  return (
    <section className={`ex-card${allDone ? ' ex-card-done' : ''}`}>
      <header className="ex-card-header">
        <div>
          <h2 className="ex-card-title">{exercise?.name ?? 'Unknown exercise'}</h2>
          {lastSummary && <div className="ex-last num">Last time: {lastSummary}</div>}
        </div>
        <button type="button" className="link-btn" aria-label={`${exercise?.name} options`} onClick={() => setMenuOpen(!menuOpen)}>
          •••
        </button>
      </header>

      {!props.hideLast && entry.suggestion?.increase && (
        <div className="badge-up num">↑ Try {formatWeight(entry.suggestion.weightKg, unit)}: you hit every target last time</div>
      )}

      {menuOpen && (
        <div className="week-menu">
          <button type="button" className="btn btn-danger-text" onClick={props.onRemoveExercise}>
            Remove Exercise
          </button>
        </div>
      )}

      {needsWeight ? (
        <StartingWeight unit={unit} onSet={props.onSetStartingWeight} />
      ) : (
        <table className="sets">
          <thead>
            <tr>
              <th>Set</th>
              {!props.hideLast && <th>Last</th>}
              {type === 'weight' && <th>{unit}</th>}
              {type === 'bodyweight' && <th>+{unit}</th>}
              {(type === 'weight' || type === 'bodyweight') && <th>Reps</th>}
              {type === 'timed' && <th>Sec</th>}
              {type === 'cardio' && <th>Min</th>}
              {type === 'cardio' && <th>km</th>}
              <th aria-label="Done" />
            </tr>
          </thead>
          <tbody>
            {entry.sets.map((set, i) => (
              <tr key={i} className={set.completed ? 'set-done' : undefined}>
                <td className="set-num num">{i + 1}</td>
                {!props.hideLast && <td className="set-last num">{lastSets?.[i] ? describeSet(lastSets[i], type, unit, true) : '—'}</td>}
                {(type === 'weight' || type === 'bodyweight') && (
                  <td>
                    <NumberCell label={`Set ${i + 1} weight`} decimals value={toUnit(set.weightKg)} onChange={(v) => props.onUpdateSet(i, { weightKg: fromUnit(v) })} />
                  </td>
                )}
                {(type === 'weight' || type === 'bodyweight') && (
                  <td>
                    <NumberCell label={`Set ${i + 1} reps`} value={set.reps} onChange={(v) => props.onUpdateSet(i, { reps: v })} />
                  </td>
                )}
                {type === 'timed' && (
                  <td>
                    <NumberCell label={`Set ${i + 1} seconds`} value={set.durationSec} onChange={(v) => props.onUpdateSet(i, { durationSec: v })} />
                  </td>
                )}
                {type === 'cardio' && (
                  <>
                    <td>
                      <NumberCell
                        label={`Set ${i + 1} minutes`}
                        decimals
                        value={set.durationSec === undefined ? undefined : Math.round((set.durationSec / 60) * 10) / 10}
                        onChange={(v) => props.onUpdateSet(i, { durationSec: v === undefined ? undefined : Math.round(v * 60) })}
                      />
                    </td>
                    <td>
                      <NumberCell
                        label={`Set ${i + 1} distance`}
                        decimals
                        value={set.distanceM === undefined ? undefined : set.distanceM / 1000}
                        onChange={(v) => props.onUpdateSet(i, { distanceM: v === undefined ? undefined : Math.round(v * 1000) })}
                      />
                    </td>
                  </>
                )}
                <td className="set-check-cell">
                  <button
                    type="button"
                    className="set-check"
                    aria-label={`${set.completed ? 'Undo' : 'Complete'} set ${i + 1}`}
                    aria-pressed={set.completed}
                    onClick={() => props.onToggleSet(i)}
                  >
                    ✓
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!needsWeight && (
        <div className="ex-card-actions">
          <button type="button" className="link-btn strong" onClick={props.onAddSet}>
            + Add Set
          </button>
          {entry.sets.length > 1 && (
            <button type="button" className="link-btn" onClick={props.onRemoveSet}>
              − Remove Set
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function StartingWeight({ unit, onSet }: { unit: WeightUnit; onSet: (kg: number) => void }) {
  const [value, setValue] = useState<number | undefined>(unit === 'kg' ? 20 : 45);
  return (
    <div className="starting-weight">
      <p className="starting-weight-q">Starting weight?</p>
      <Stepper label="Weight" value={value} step={unit === 'kg' ? 2.5 : 5} decimals suffix={unit} onChange={setValue} />
      <button type="button" className="btn btn-primary btn-block" disabled={value === undefined} onClick={() => value !== undefined && onSet(unitToKg(value, unit))}>
        Use This Weight
      </button>
    </div>
  );
}
