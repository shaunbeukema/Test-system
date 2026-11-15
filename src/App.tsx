import { useCallback, useState, type ReactNode } from 'react';
import { isBlockComplete } from './core/program';
import type { Workout } from './core/types';
import { HistoryIcon, HomeIcon, ProgramIcon, SettingsIcon } from './ui/icons';
import { BlockSummaryScreen } from './ui/screens/BlockSummaryScreen';
import { HomeScreen } from './ui/screens/HomeScreen';
import { storage } from './ui/storage';
import { HistoryScreen } from './ui/screens/HistoryScreen';
import { ProgramsScreen } from './ui/screens/ProgramsScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { WorkoutScreen } from './ui/workout/WorkoutScreen';

type Tab = 'home' | 'programs' | 'history' | 'settings';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'programs', label: 'Programs', icon: <ProgramIcon /> },
  { id: 'history', label: 'History', icon: <HistoryIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [createFromHome, setCreateFromHome] = useState(false);
  const [workout, setWorkout] = useState<Workout>();
  const [toast, setToast] = useState<string>();
  const [summaryFor, setSummaryFor] = useState<string>();

  // Bumped on every tab tap so tapping the current tab returns to its main screen (like iOS).
  const [tabKey, setTabKey] = useState(0);

  const goTo = (next: Tab) => {
    setTabKey((k) => k + 1);
    setCreateFromHome(false);
    setToast(undefined);
    setTab(next);
  };

  const backHome = useCallback((message?: string) => {
    setSummaryFor(undefined);
    setToast(message);
    setTab('home');
    setTabKey((k) => k + 1);
    window.scrollTo(0, 0);
  }, []);

  /** After a workout: show the block summary if that was the block's last day, otherwise go Home. */
  const afterWorkout = async (finished: Workout | undefined, message?: string) => {
    setWorkout(undefined);
    if (finished?.programId && finished.finishedAt) {
      const [programs, workouts] = await Promise.all([storage.getPrograms(), storage.getWorkouts()]);
      const program = programs.find((p) => p.id === finished.programId);
      if (program && isBlockComplete(program, workouts)) {
        setSummaryFor(program.id);
        window.scrollTo(0, 0);
        return;
      }
    }
    backHome(message);
  };

  // The block summary takes over the screen once (no tab bar).
  if (summaryFor) {
    return (
      <div className="app">
        <BlockSummaryScreen programId={summaryFor} onDone={backHome} />
      </div>
    );
  }

  // During a workout, the workout screen takes over (no tab bar).
  if (workout) {
    return (
      <div className="app">
        <WorkoutScreen
          initial={workout}
          onDone={(message, finished) => void afterWorkout(finished, message)}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {tab === 'home' && (
        <HomeScreen
          key={tabKey}
          toast={toast}
          onStartWorkout={(w) => {
            setToast(undefined);
            setWorkout(w);
            window.scrollTo(0, 0);
          }}
          onBlockComplete={(programId) => {
            setSummaryFor(programId);
            window.scrollTo(0, 0);
          }}
          onCreateProgram={() => {
            setTab('programs');
            setCreateFromHome(true);
          }}
        />
      )}
      {tab === 'programs' && <ProgramsScreen key={tabKey} startCreating={createFromHome} />}
      {tab === 'history' && <HistoryScreen key={tabKey} />}
      {tab === 'settings' && <SettingsScreen key={tabKey} />}

      <nav className="tabbar" aria-label="Main">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="tab"
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => goTo(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
