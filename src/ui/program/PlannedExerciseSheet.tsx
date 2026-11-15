import { useState } from 'react';
import { type Shorthand } from '../../core/programEdit';
import type { Exercise, WeightUnit } from '../../core/types';
import { displayWeight, formatDuration, unitToKg } from '../../core/units';
import { Sheet } from '../components/Sheet';
import { Stepper } from '../components/Stepper';

interface Props {
  exercise: Exercise;
  initial: Shorthand;
  unit: WeightUnit;
  isNew: boolean;
  onSave: (value: Shorthand) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** Edit "sets × reps @ weight, rest" for one exercise in a program day. */
export function PlannedExerciseSheet({ exercise, initial, unit, isNew, onSave, onDelete, onClose }: Props) {
  const [value, setValue] = useState<Shorthand>(initial);
  const set = (patch: Partial<Shorthand>) => setValue((v) => ({ ...v, ...patch }));

  const weightStep = unit === 'kg' ? 2.5 : 5;
  const shownWeight = value.weightKg === undefined ? undefined : displayWeight(value.weightKg, unit);
  const setWeight = (w: number | undefined) => set({ weightKg: w === undefined ? undefined : unitToKg(w, unit) });

  const { type } = exercise;
  const weightLabel = type === 'bodyweight' ? 'Added weight' : 'Weight';

  return (
    <Sheet title={exercise.name} onClose={onClose} action={{ label: isNew ? 'Add' : 'Save', onClick: () => onSave(value) }}>
      <div className="card form-card">
        <Stepper label="Sets" value={value.sets} min={1} step={1} onChange={(n) => set({ sets: n ?? 1 })} />

        {(type === 'weight' || type === 'bodyweight') && (
          <Stepper label="Reps" value={value.reps} min={1} step={1} onChange={(n) => set({ reps: n ?? 1 })} />
        )}

        {(type === 'timed' || type === 'cardio') && (
          <Stepper
            label={type === 'cardio' ? 'Time' : 'Hold'}
            value={value.durationSec}
            min={type === 'cardio' ? 60 : 5}
            step={type === 'cardio' ? 60 : 5}
            format={formatDuration}
            onChange={(n) => set({ durationSec: n })}
          />
        )}

        {type === 'cardio' && (
          <Stepper
            label="Distance (optional)"
            value={value.distanceM === undefined ? undefined : value.distanceM / 1000}
            step={0.5}
            decimals
            optional
            suffix="km"
            onChange={(n) => set({ distanceM: n === undefined ? undefined : Math.round(n * 1000) })}
          />
        )}

        {type !== 'cardio' && (
          <Stepper
            label={`${weightLabel} (optional)`}
            value={shownWeight}
            step={weightStep}
            decimals
            optional
            suffix={unit}
            onChange={setWeight}
          />
        )}

        <Stepper label="Rest between sets" value={value.restSec} step={15} format={formatDuration} onChange={(n) => set({ restSec: n ?? 0 })} />
      </div>

      {type !== 'cardio' && (
        <p className="hint">
          Leave weight empty to use last time’s weight or Liftr’s recommendation at the gym.
        </p>
      )}

      {onDelete && (
        <button type="button" className="btn btn-danger btn-block" onClick={onDelete}>
          Remove from Day
        </button>
      )}
    </Sheet>
  );
}
