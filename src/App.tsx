import { useState, type ReactNode } from 'react';
import { HistoryIcon, HomeIcon, ProgramIcon, SettingsIcon } from './ui/icons';
import { HomeScreen } from './ui/screens/HomeScreen';
import { Placeholder } from './ui/screens/Placeholder';
import { ProgramsScreen } from './ui/screens/ProgramsScreen';

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

  const goTo = (next: Tab) => {
    setCreateFromHome(false);
    setTab(next);
  };

  return (
    <div className="app">
      {tab === 'home' && <HomeScreen onCreateProgram={() => { setTab('programs'); setCreateFromHome(true); }} />}
      {tab === 'programs' && <ProgramsScreen startCreating={createFromHome} />}
      {tab === 'history' && <Placeholder title="History" note="Per-exercise history arrives in Phase 4." />}
      {tab === 'settings' && <Placeholder title="Settings" note="Units, rest time and backups arrive in Phase 4." />}

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
