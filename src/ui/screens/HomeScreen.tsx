import { useEffect, useState } from 'react';
import { blockSummary, isBlockComplete, nextDay, repeatBlock, skipDay, type BlockSummary, type DayRef } from '../../core/program';
import type { Exercise, Program, Workout } from '../../core/types';
import { startEmptyWorkout, startWorkoutFromDay } from '../../core/workout';
import { PlayIcon } from '../icons';
import { storage } from '../storage';

interface Props {
  onCreateProgram: () => void;
  onStartWorkout: (workout: Workout) => void;
  /** Called when skipping the last day finishes the block. */
  onBlockComplete: (programId: string) => void;
  /** Short message to show once (e.g. "Workout saved"). */
  toast?: string;
}

interface HomeData {
  program?: Program;
  next?: DayRef;
  blockDone: boolean;
  summary?: BlockSummary;
  unfinished?: Workout;
  exercises: Exercise[];
  workouts: Workout[];
}

export function HomeScreen({ onCreateProgram, onStartWorkout, onBlockComplete, toast }: Props) {
  const [data, setData] = useState<HomeData>();
  const [message, setMessage] = useState(toast);

  const load = async (): Promise<HomeData> => {
      const [settings, programs, workouts, exercises] = await Promise.all([
        storage.getSettings(),
        storage.getPrograms(),
        storage.getWorkouts(),
        storage.getExercises(),
      ]);
      const program = programs.find((p) => p.id === settings.activeProgramId);
      return {
        program,
        next: program ? nextDay(program, workouts) : undefined,
        blockDone: program ? isBlockComplete(program, workouts) : false,
        summary: program ? blockSummary(program, workouts) : undefined,
        unfinished: workouts.find((w) => !w.finishedAt),
        exercises,
        workouts,
      };
  };

  useEffect(() => {
    load().then(setData);
  }, []);

  const skip = async () => {
    if (!data?.program || !data.next) return;
    const { program, next } = data;
    if (!confirm(`Skip Week ${next.weekIndex + 1} · Day ${next.dayIndex + 1}: ${next.day.name}? It counts as missed.`)) return;
    await storage.saveWorkout(skipDay(program, next));
    const fresh = await load();
    if (fresh.blockDone) return onBlockComplete(program.id);
    setData(fresh);
    setMessage(`Skipped ${next.day.name}`);
  };

  const repeat = async () => {
    if (!data?.program) return;
    await storage.saveProgram(repeatBlock(data.program));
    setData(await load());
    setMessage('Block restarted at Week 1');
  };

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
      {message && (
        <div className="toast" role="status">
          ✓ {message}
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
        <div className="home-links">
          <button type="button" className="btn-plain" onClick={startEmpty}>
            Empty workout
          </button>
          <button type="button" className="btn-plain" onClick={skip}>
            Skip this day
          </button>
        </div>
      )}

      <h2 className="section-title">Program</h2>
      {data?.program ? (
        <div className="card">
          <strong>{data.program.name}</strong>
          {data.blockDone ? (
            <>
              <div className="muted num">
                Block complete · {data.summary?.completedDays} of {data.summary?.plannedDays} sessions
              </div>
              <button type="button" className="btn btn-primary btn-block spaced-sm" onClick={repeat}>
                Repeat Block
              </button>
            </>
          ) : (
            <div className="muted num">
              {data.next ? `Week ${data.next.weekIndex + 1} of ${data.program.weeks.length}` : `${data.program.weeks.length} weeks`}
              {data.summary && data.summary.plannedDays > 0 && ` · ${data.summary.completedDays + data.summary.skippedDays} of ${data.summary.plannedDays} days`}
            </div>
          )}
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
