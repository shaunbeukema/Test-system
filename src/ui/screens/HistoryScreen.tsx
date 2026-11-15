import { useEffect, useState } from 'react';
import { exerciseSessions, exercisesWithHistory } from '../../core/history';
import type { Exercise, Settings, Workout } from '../../core/types';
import { addSet, removeExercise, removeLastSet, updateSet } from '../../core/workout';
import { NavBar } from '../components/NavBar';
import { describeSet, summarizeSets } from '../format';
import { storage } from '../storage';
import { ExerciseCard } from '../workout/ExerciseCard';

type View = { kind: 'list' } | { kind: 'exercise'; exerciseId: string } | { kind: 'workout'; workoutId: string; fromExerciseId: string };

export function HistoryScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>();
  const [settings, setSettings] = useState<Settings>();
  const [view, setView] = useState<View>({ kind: 'list' });

  useEffect(() => {
    (async () => {
      const [e, w, s] = await Promise.all([storage.getExercises(), storage.getWorkouts(), storage.getSettings()]);
      setExercises(e);
      setWorkouts(w);
      setSettings(s);
    })();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  if (!workouts || !settings) return <main className="screen" />;
  const unit = settings.unit;
  const byId = new Map(exercises.map((e) => [e.id, e]));

  const saveWorkout = (workout: Workout) => {
    setWorkouts((list) => list!.map((w) => (w.id === workout.id ? workout : w)));
    void storage.saveWorkout(workout);
  };

  // ----- Edit a past workout
  if (view.kind === 'workout') {
    const workout = workouts.find((w) => w.id === view.workoutId);
    const back = () => setView({ kind: 'exercise', exerciseId: view.fromExerciseId });
    if (!workout) {
      return (
        <main className="screen">
          <NavBar backLabel="Back" onBack={back} />
          <div className="card empty">
            <p>This workout no longer exists.</p>
          </div>
        </main>
      );
    }
    const deleteWorkout = async () => {
      if (!confirm('Delete this workout? This can’t be undone.')) return;
      await storage.deleteWorkout(workout.id);
      setWorkouts(workouts.filter((w) => w.id !== workout.id));
      back();
    };
    return (
      <main className="screen">
        <NavBar backLabel={byId.get(view.fromExerciseId)?.name ?? 'History'} onBack={back} />
        <p className="eyebrow">{formatDate(workout.startedAt, true)}</p>
        <h1 className="title">{workout.name ?? 'Workout'}</h1>
        <p className="hint edit-hint">Changes save automatically. Tap ✓ to mark a set done or not done.</p>
        {workout.exercises.map((entry, ei) => (
          <ExerciseCard
            key={`${entry.exerciseId}-${ei}`}
            entry={entry}
            exercise={byId.get(entry.exerciseId)}
            needsWeight={false}
            hideLast
            unit={unit}
            onUpdateSet={(si, patch) => saveWorkout(updateSet(workout, ei, si, patch))}
            onToggleSet={(si) => saveWorkout(updateSet(workout, ei, si, { completed: !entry.sets[si].completed }))}
            onSetStartingWeight={() => {}}
            onAddSet={() => saveWorkout(addSet(workout, ei))}
            onRemoveSet={() => saveWorkout(removeLastSet(workout, ei))}
            onRemoveExercise={() => saveWorkout(removeExercise(workout, ei))}
          />
        ))}
        <button type="button" className="btn btn-danger-text btn-block" onClick={deleteWorkout}>
          Delete Workout
        </button>
      </main>
    );
  }

  // ----- One exercise: every session
  if (view.kind === 'exercise') {
    const exercise = byId.get(view.exerciseId);
    const sessions = exerciseSessions(view.exerciseId, workouts);
    const type = exercise?.type ?? 'weight';
    return (
      <main className="screen">
        <NavBar backLabel="History" onBack={() => setView({ kind: 'list' })} />
        <h1 className="title">{exercise?.name ?? 'Exercise'}</h1>
        {sessions.length === 0 ? (
          <div className="card empty">
            <p>No completed sets for this exercise.</p>
          </div>
        ) : (
          <div className="list">
            {sessions.map((s) => (
              <button
                key={s.workout.id + s.entry.exerciseId}
                type="button"
                className="list-row list-btn tall"
                onClick={() => setView({ kind: 'workout', workoutId: s.workout.id, fromExerciseId: view.exerciseId })}
              >
                <span>
                  <span className="row-title">{formatDate(s.workout.startedAt)}</span>
                  <span className="row-sub session-sets num">{summarizeSets(s.sets, type, unit)}</span>
                </span>
                <span className="muted">›</span>
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  // ----- Exercise list
  const summaries = exercisesWithHistory(exercises, workouts);
  return (
    <main className="screen">
      <h1 className="title">History</h1>
      {summaries.length === 0 ? (
        <div className="card empty">
          <p>Finish a workout and your exercises will show up here, with every session you’ve done.</p>
        </div>
      ) : (
        <div className="list">
          {summaries.map((s) => (
            <button key={s.exercise.id} type="button" className="list-row list-btn tall" onClick={() => setView({ kind: 'exercise', exerciseId: s.exercise.id })}>
              <span>
                <span className="row-title">{s.exercise.name}</span>
                <span className="row-sub muted num">
                  {formatDate(s.lastDate)} · Best {describeSet(s.best, s.exercise.type, unit)}
                </span>
              </span>
              <span className="muted num">
                {s.sessionCount} ›
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

function formatDate(iso: string, long = false) {
  return new Date(iso).toLocaleDateString(undefined, long ? { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' });
}
