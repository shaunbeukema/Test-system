import type { Program, ProgramDay, ProgramWeek, Workout } from './types';
import { newId } from './id';

export interface DayRef {
  weekIndex: number;
  dayIndex: number;
  week: ProgramWeek;
  day: ProgramDay;
}

/** All days in program order (week 1 day 1, week 1 day 2, ...). */
export function allDays(program: Program): DayRef[] {
  return program.weeks.flatMap((week, weekIndex) =>
    week.days.map((day, dayIndex) => ({ weekIndex, dayIndex, week, day })),
  );
}

/** Day IDs finished in the program's current run. */
export function completedDayIds(program: Program, workouts: Workout[]): Set<string> {
  return new Set(
    workouts
      .filter((w) => w.programId === program.id && w.dayId && w.finishedAt && w.startedAt >= program.runStartedAt)
      .map((w) => w.dayId!),
  );
}

/** The first day in order that hasn't been completed this run, or undefined when the block is finished. */
export function nextDay(program: Program, workouts: Workout[]): DayRef | undefined {
  const done = completedDayIds(program, workouts);
  return allDays(program).find((d) => !done.has(d.day.id));
}

export function isBlockComplete(program: Program, workouts: Workout[]): boolean {
  return allDays(program).length > 0 && nextDay(program, workouts) === undefined;
}

/** Mark a program day as skipped so the program moves on. Stored as a finished workout with no exercises. */
export function skipDay(program: Program, ref: DayRef, now = new Date()): Workout {
  const iso = now.toISOString();
  return { id: newId(), startedAt: iso, finishedAt: iso, programId: program.id, dayId: ref.day.id, name: ref.day.name, skipped: true, exercises: [] };
}

export interface BlockSummary {
  plannedDays: number;
  completedDays: number;
  skippedDays: number;
}

/** Sessions done in the current run of the block. */
export function blockSummary(program: Program, workouts: Workout[]): BlockSummary {
  const dayIds = new Set(allDays(program).map((d) => d.day.id));
  const run = workouts.filter((w) => w.programId === program.id && w.dayId && dayIds.has(w.dayId) && w.finishedAt && w.startedAt >= program.runStartedAt);
  const completed = new Set(run.filter((w) => !w.skipped).map((w) => w.dayId));
  const skipped = new Set(run.filter((w) => w.skipped && !completed.has(w.dayId)).map((w) => w.dayId));
  return { plannedDays: dayIds.size, completedDays: completed.size, skippedDays: skipped.size };
}

/**
 * Start the block again from Week 1. Weights keep progressing because recommendations
 * come from your most recent sessions, not from the run.
 */
export function repeatBlock(program: Program, now = new Date()): Program {
  return { ...program, runStartedAt: now.toISOString() };
}

/** Deep-copy a week with fresh IDs (for "copy week, then edit"). */
export function copyWeek(week: ProgramWeek, name: string): ProgramWeek {
  return {
    id: newId(),
    name,
    days: week.days.map((day) => ({
      id: newId(),
      name: day.name,
      exercises: day.exercises.map((ex) => ({
        ...ex,
        id: newId(),
        sets: ex.sets.map((s) => ({ ...s })),
      })),
    })),
  };
}
