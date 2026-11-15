import { useEffect, useState } from 'react';
import { findLastPerformance } from '../../core/progression';
import type { Exercise, Settings, Workout } from '../../core/types';
import { formatDuration } from '../../core/units';
import {
  addExercise,
  addSet,
  adjustRest,
  completedSetCount,
  completeSet,
  finishWorkout,
  needsStartingWeight,
  removeExercise,
  removeLastSet,
  setAllWeights,
  stopRest,
  uncompleteSet,
  updateSet,
} from '../../core/workout';
import { ExercisePicker } from '../program/ExercisePicker';
import { storage } from '../storage';
import { ExerciseCard } from './ExerciseCard';
import { RestBar } from './RestBar';
import { useNow } from './useNow';

interface Props {
  initial: Workout;
  /** Called when the workout is finished (with the saved workout) or discarded. */
  onDone: (message?: string, finished?: Workout) => void;
}

export function WorkoutScreen({ initial, onDone }: Props) {
  const [workout, setWorkout] = useState(initial);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [picking, setPicking] = useState(false);
  const now = useNow(500);

  useEffect(() => {
    (async () => {
      const [e, w, s] = await Promise.all([storage.getExercises(), storage.getWorkouts(), storage.getSettings()]);
      setExercises(e);
      setHistory(w.filter((x) => x.id !== initial.id && x.finishedAt));
      setSettings(s);
    })();
  }, [initial.id]);

  if (!settings) return <main className="screen" />;
  const byId = new Map(exercises.map((e) => [e.id, e]));

  /** Apply a change: update the screen and save immediately (so nothing is lost if iOS closes the app). */
  const apply = (next: Workout) => {
    setWorkout(next);
    void storage.saveWorkout(next);
  };

  const toggleSet = (ei: number, si: number) => {
    const set = workout.exercises[ei].sets[si];
    apply(set.completed ? uncompleteSet(workout, ei, si) : completeSet(workout, ei, si));
  };

  const finish = async () => {
    if (completedSetCount(workout) === 0) {
      if (confirm('No sets completed. Discard this workout?')) await discard();
      return;
    }
    if (!confirm('Finish workout?')) return;
    const finished = finishWorkout(workout);
    await storage.saveWorkout(finished);
    onDone('Workout saved', finished);
  };

  const discard = async () => {
    await storage.deleteWorkout(workout.id);
    onDone('Workout discarded');
  };

  const elapsed = (now - Date.parse(workout.startedAt)) / 1000;

  return (
    <main className={`screen workout-screen${workout.rest ? ' has-rest' : ''}`}>
      <div className="workout-top">
        <div>
          <p className="eyebrow num">{formatDuration(elapsed)}</p>
          <h1 className="title workout-title">{workout.name ?? 'Workout'}</h1>
        </div>
        <button type="button" className="btn btn-primary finish-btn" onClick={finish}>
          Finish
        </button>
      </div>

      {workout.exercises.length === 0 && (
        <div className="card empty">
          <p>Add your first exercise to get going.</p>
        </div>
      )}

      {workout.exercises.map((entry, ei) => {
        const exercise = byId.get(entry.exerciseId);
        return (
          <ExerciseCard
            key={`${entry.exerciseId}-${ei}`}
            entry={entry}
            exercise={exercise}
            lastSets={findLastPerformance(entry.exerciseId, history)?.entry.sets}
            needsWeight={needsStartingWeight(entry, exercise)}
            unit={settings.unit}
            onUpdateSet={(si, patch) => apply(updateSet(workout, ei, si, patch))}
            onToggleSet={(si) => toggleSet(ei, si)}
            onSetStartingWeight={(kg) => apply(setAllWeights(workout, ei, kg))}
            onAddSet={() => apply(addSet(workout, ei))}
            onRemoveSet={() => apply(removeLastSet(workout, ei))}
            onRemoveExercise={() => apply(removeExercise(workout, ei))}
          />
        );
      })}

      <button type="button" className="btn btn-secondary btn-block spaced" onClick={() => setPicking(true)}>
        + Add Exercise
      </button>
      <button type="button" className="btn btn-danger-text btn-block" onClick={() => confirm('Discard this workout? Nothing will be saved.') && discard()}>
        Discard Workout
      </button>

      {workout.rest && (
        <RestBar
          endsAt={workout.rest.endsAt}
          totalSec={workout.rest.totalSec}
          now={now}
          onAdjust={(d) => apply(adjustRest(workout, d))}
          onDismiss={() => apply(stopRest(workout))}
        />
      )}

      {picking && (
        <ExercisePicker
          exercises={exercises}
          defaultRestSec={settings.defaultRestSec}
          onClose={() => setPicking(false)}
          onCreate={async (e) => {
            await storage.saveExercise(e);
            setExercises((list) => [...list, e]);
          }}
          onPick={(e) => {
            setPicking(false);
            apply(addExercise(workout, e, history));
          }}
        />
      )}
    </main>
  );
}
