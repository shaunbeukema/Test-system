import { useState } from 'react';
import { addDay, addWeek, duplicateWeek, removeWeek, renameProgram } from '../../core/programEdit';
import type { Program } from '../../core/types';
import { NavBar } from '../components/NavBar';

interface Props {
  program: Program;
  isActive: boolean;
  onChange: (program: Program) => void;
  onOpenDay: (dayId: string) => void;
  onSetActive: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function ProgramEditor({ program, isActive, onChange, onOpenDay, onSetActive, onDelete, onBack }: Props) {
  const [menuWeek, setMenuWeek] = useState<string>();

  const newDay = (weekId: string, count: number) => {
    const { program: next, day } = addDay(program, weekId, `Day ${count + 1}`);
    onChange(next);
    onOpenDay(day.id);
  };

  return (
    <main className="screen">
      <NavBar
        backLabel="Programs"
        onBack={onBack}
        right={isActive ? <span className="tag tag-accent">Active</span> : <button type="button" className="link-btn strong" onClick={onSetActive}>Set Active</button>}
      />
      <input
        className="title-input"
        aria-label="Program name"
        value={program.name}
        onChange={(e) => onChange(renameProgram(program, e.target.value))}
      />

      {program.weeks.map((week, wi) => (
        <section key={week.id} className="week">
          <div className="week-header">
            <h2 className="section-title">Week {wi + 1}</h2>
            <button type="button" className="link-btn" aria-label={`Week ${wi + 1} options`} onClick={() => setMenuWeek(menuWeek === week.id ? undefined : week.id)}>
              •••
            </button>
          </div>

          {menuWeek === week.id && (
            <div className="week-menu">
              <button type="button" className="btn btn-secondary" onClick={() => { onChange(duplicateWeek(program, week.id)); setMenuWeek(undefined); }}>
                Copy Week
              </button>
              {program.weeks.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger-text"
                  onClick={() => {
                    if (confirm(`Delete Week ${wi + 1} and its days?`)) onChange(removeWeek(program, week.id));
                    setMenuWeek(undefined);
                  }}
                >
                  Delete Week
                </button>
              )}
            </div>
          )}

          <div className="list">
            {week.days.map((day, di) => (
              <button key={day.id} type="button" className="list-row list-btn" onClick={() => onOpenDay(day.id)}>
                <span>
                  <span className="day-num num">D{di + 1}</span>
                  {day.name}
                </span>
                <span className="muted num">
                  {day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'} ›
                </span>
              </button>
            ))}
            <button type="button" className="list-row list-btn add-row" onClick={() => newDay(week.id, week.days.length)}>
              + Add Day
            </button>
          </div>
        </section>
      ))}

      <button type="button" className="btn btn-secondary btn-block spaced" onClick={() => onChange(addWeek(program))}>
        + Add Empty Week
      </button>
      <button type="button" className="btn btn-danger-text btn-block" onClick={() => confirm(`Delete “${program.name}”? This can’t be undone.`) && onDelete()}>
        Delete Program
      </button>
    </main>
  );
}
