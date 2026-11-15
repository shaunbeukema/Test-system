import { useEffect, useState } from 'react';
import { nextDay, type DayRef } from '../../core/program';
import type { Program } from '../../core/types';
import { PlayIcon } from '../icons';
import { storage } from '../storage';

interface Props {
  onCreateProgram: () => void;
}

export function HomeScreen({ onCreateProgram }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [program, setProgram] = useState<Program>();
  const [next, setNext] = useState<DayRef>();

  useEffect(() => {
    (async () => {
      const [settings, programs, workouts] = await Promise.all([
        storage.getSettings(),
        storage.getPrograms(),
        storage.getWorkouts(),
      ]);
      const active = programs.find((p) => p.id === settings.activeProgramId);
      setProgram(active);
      setNext(active ? nextDay(active, workouts) : undefined);
      setLoaded(true);
    })();
  }, []);

  const subtitle = next
    ? `Week ${next.weekIndex + 1} · Day ${next.dayIndex + 1} — ${next.day.name}`
    : 'Empty workout';

  return (
    <main className="screen">
      <p className="eyebrow">{formatToday()}</p>
      <h1 className="title">Liftr</h1>

      <button className="start-btn" type="button" disabled={!loaded}>
        <span className="start-icon">
          <PlayIcon />
        </span>
        <span className="start-label">Start Workout</span>
        <span className="start-sub">{subtitle}</span>
      </button>

      <h2 className="section-title">Program</h2>
      {program ? (
        <div className="card">
          <strong>{program.name}</strong>
          <div className="muted">{program.weeks.length} weeks</div>
        </div>
      ) : (
        loaded && (
          <div className="card empty">
            <p>
              No program yet. Build your training block — weeks, days and exercises — and Liftr will
              line up each session for you.
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
