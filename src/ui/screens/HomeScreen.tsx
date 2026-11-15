import { useEffect, useState } from 'react';
import { isBlockComplete, nextDay, type DayRef } from '../../core/program';
import type { Exercise, Program, Workout } from '../../core/types';
import { startEmptyWorkout, startWorkoutFromDay } from '../../core/workout';
import { PlayIcon } from '../icons';
import { storage } from '../storage';

interface Props {
  onCreateProgram: () => void;
  onStartWorkout: (workout: Workout) => void;
  /** Short message to show once (e.g. "Workout saved"). */
  toast?: string;
}

interface HomeData {
  program?: Program;
  next?: DayRef;
  blockDone: boolean;
  unfinished?: Workout;
  exercises: Exercise[];
  workouts: Workout[];
}

export function HomeScreen({ onCreateProgram, onStartWorkout, toast }: Props) {
  const [data, setData] = useState<HomeData>();

  useEffect(() => {
    (async () => {
      const [settings, programs, workouts, exercises] = await Promise.all([
        storage.getSettings(),
        storage.getPrograms(),
        storage.getWorkouts(),
        storage.getExercises(),
      ]);
      const program = programs.find((p) => p.id === settings.activeProgramId);
      setData({
        program,
        next: program ? nextDay(program, workouts) : undefined,
        blockDone: program ? isBlockComplete(program, workouts) : false,
        unfinished: workouts.find((w) => !w.finishedAt),
        exercises,
        workouts,
      });
    })();
  }, []);

  const start = async () => {
    if (!data) return;
    if (data.unfinished) return onStartWorkout(data.unfinished);
    const workout =
      data.program && data.next
        ? startWorkoutFromDay(data.program, data.next, data.exercises, data.workouts)
        : startEmptyWorkout();
    await storage.saveWorkout(workout);
    onStartWorkout(workout);
  };

  const startEmpty = async () => {
    const workout = startEmptyWorkout();
    await storage.saveWorkout(workout);
    onStartWorkout(workout);
  };

  const label = data?.unfinished ? 'Resume Workout' : 'Start Workout';
  const subtitle = !data
    ? '\u00a0' // blank until loaded, so it never flashes the wrong text
    : data.unfinished
    ? `${data.unfinished.name ?? 'Workout'} · in progress`
    : data.next
      ? `Week ${data.next.weekIndex + 1} · Day ${data.next.dayIndex + 1}: ${data.next.day.name}`
      : 'Empty workout';

  return (
    <main className="screen">
      {toast && (
        <div className="toast" role="status">
          ✓ {toast}
        </div>
      )}
      <p className="eyebrow">{formatToday()}</p>
      <h1 className="title">Liftr</h1>

      <button className="start-btn" type="button" disabled={!data} onClick={start}>
        <span className="start-icon">
          <PlayIcon />
        </span>
        <span className="start-label">{label}</span>
        <span className="start-sub">{subtitle}</span>
      </button>
      {data && !data.unfinished && data.next && (
        <button type="button" className="btn-plain" onClick={startEmpty}>
          or start an empty workout
        </button>
      )}

      <h2 className="section-title">Program</h2>
      {data?.program ? (
        <div className="card">
          <strong>{data.program.name}</strong>
          <div className="muted">
            {data.blockDone ? 'Block complete 🎉' : `${data.program.weeks.length} ${data.program.weeks.length === 1 ? 'week' : 'weeks'}`}
          </div>
        </div>
      ) : (
        data && (
          <div className="card empty">
            <p>
              No program yet. Build your training block (weeks, days, and exercises) and Liftr will line up each
              session for you.
            </p>
            <button className="btn btn-primary" type="button" onClick={onCreateProgram}>
              Create Program
            </button>
          </div>
        )
      )}
    </main>
  );
}

function formatToday() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}
