import { useState, type ReactNode } from 'react';
import type { Workout } from './core/types';
import { HistoryIcon, HomeIcon, ProgramIcon, SettingsIcon } from './ui/icons';
import { HomeScreen } from './ui/screens/HomeScreen';
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

  // Bumped on every tab tap so tapping the current tab returns to its main screen (like iOS).
  const [tabKey, setTabKey] = useState(0);

  const goTo = (next: Tab) => {
    setTabKey((k) => k + 1);
    setCreateFromHome(false);
    setToast(undefined);
    setTab(next);
  };

  // During a workout, the workout screen takes over (no tab bar).
  if (workout) {
    return (
      <div className="app">
        <WorkoutScreen
          initial={workout}
          onDone={(message) => {
            setWorkout(undefined);
            setToast(message);
            setTab('home');
            window.scrollTo(0, 0);
          }}
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
