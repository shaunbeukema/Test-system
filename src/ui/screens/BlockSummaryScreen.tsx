import { useEffect, useState } from 'react';
import { blockSummary, repeatBlock, type BlockSummary } from '../../core/program';
import type { Program } from '../../core/types';
import { storage } from '../storage';

interface Props {
  programId: string;
  onDone: (message?: string) => void;
}

/** Shown once, right after the last day of a block is finished (or skipped). */
export function BlockSummaryScreen({ programId, onDone }: Props) {
  const [program, setProgram] = useState<Program>();
  const [summary, setSummary] = useState<BlockSummary>();

  useEffect(() => {
    Promise.all([storage.getPrograms(), storage.getWorkouts()]).then(([programs, workouts]) => {
      const p = programs.find((x) => x.id === programId);
      if (!p) return onDone();
      setProgram(p);
      setSummary(blockSummary(p, workouts));
    });
  }, [programId, onDone]);

  if (!program || !summary) return <main className="screen" />;

  const repeat = async () => {
    await storage.saveProgram(repeatBlock(program));
    onDone('Block restarted at Week 1');
  };

  return (
    <main className="screen summary-screen">
      <p className="eyebrow">{program.name}</p>
      <h1 className="title summary-title">Block complete</h1>

      <div className="summary-hero">
        <div className="summary-big num">
          {summary.completedDays}
          <span className="summary-of"> / {summary.plannedDays}</span>
        </div>
        <div className="summary-label">sessions done</div>
        {summary.skippedDays > 0 && (
          <div className="summary-skipped num">
            {summary.skippedDays} {summary.skippedDays === 1 ? 'day' : 'days'} skipped
          </div>
        )}
      </div>

      <button type="button" className="btn btn-primary btn-block spaced" onClick={repeat}>
        Repeat Block
      </button>
      <p className="hint summary-hint">Starts again at Week 1. Your weights keep progressing from your latest sessions.</p>
      <button type="button" className="btn btn-secondary btn-block spaced" onClick={() => onDone()}>
        Done
      </button>
    </main>
  );
}
