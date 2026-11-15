import { useMemo, useState } from 'react';
import { newId } from '../../core/id';
import type { Exercise, ExerciseType } from '../../core/types';
import { Sheet } from '../components/Sheet';

const TYPE_LABELS: Record<ExerciseType, string> = {
  weight: 'Weights',
  bodyweight: 'Bodyweight',
  timed: 'Timed',
  cardio: 'Cardio',
};
const TYPE_ORDER: ExerciseType[] = ['weight', 'bodyweight', 'timed', 'cardio'];

interface Props {
  exercises: Exercise[];
  defaultRestSec: number;
  onPick: (exercise: Exercise) => void;
  onCreate: (exercise: Exercise) => Promise<void>;
  onClose: () => void;
}

export function ExercisePicker({ exercises, defaultRestSec, onPick, onCreate, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<ExerciseType>('weight');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = exercises.filter((e) => e.name.toLowerCase().includes(q));
    return TYPE_ORDER.map((type) => ({
      type,
      items: matches.filter((e) => e.type === type).sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((g) => g.items.length);
  }, [exercises, query]);

  const name = query.trim();
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === name.toLowerCase());

  const createExercise = async () => {
    if (!name || exactMatch) return;
    const exercise: Exercise = {
      id: newId(),
      name,
      type: newType,
      defaultRestSec,
      incrementKg: newType === 'weight' || newType === 'bodyweight' ? 2.5 : 0,
      custom: true,
    };
    await onCreate(exercise);
    onPick(exercise);
  };

  return (
    <Sheet title="Add Exercise" onClose={onClose}>
      <input
        className="search"
        type="search"
        placeholder="Search or type a new exercise"
        aria-label="Search exercises"
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
      />

      {name && !exactMatch && (
        <div className="card create-card">
          {!creating ? (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setCreating(true)}>
              + Create “{name}”
            </button>
          ) : (
            <>
              <div className="field-label">Type</div>
              <div className="segmented" role="radiogroup" aria-label="Exercise type">
                {TYPE_ORDER.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={newType === t}
                    className="segment"
                    onClick={() => setNewType(t)}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-primary btn-block" onClick={createExercise}>
                Create & Add
              </button>
            </>
          )}
        </div>
      )}

      {groups.map((g) => (
        <section key={g.type}>
          <h3 className="section-title">{TYPE_LABELS[g.type]}</h3>
          <div className="list">
            {g.items.map((e) => (
              <button key={e.id} type="button" className="list-row list-btn" onClick={() => onPick(e)}>
                <span>{e.name}</span>
                {e.custom && <span className="tag">Custom</span>}
              </button>
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 && !query.trim() && <p className="muted">No exercises.</p>}
    </Sheet>
  );
}
