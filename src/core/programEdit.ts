// Pure functions for editing programs. Each returns a new Program (never mutates the input).
import { newId } from './id';
import { copyWeek } from './program';
import { formatDuration, formatWeight } from './units';
import type { Exercise, PlannedExercise, PlannedSet, Program, ProgramDay, WeightUnit } from './types';

export function createProgram(name: string, now = new Date()): Program {
  const iso = now.toISOString();
  return {
    id: newId(),
    name: name.trim() || 'My Program',
    createdAt: iso,
    runStartedAt: iso,
    weeks: [{ id: newId(), name: 'Week 1', days: [] }],
  };
}

export function renameProgram(p: Program, name: string): Program {
  return { ...p, name };
}

export function addWeek(p: Program): Program {
  return { ...p, weeks: [...p.weeks, { id: newId(), name: `Week ${p.weeks.length + 1}`, days: [] }] };
}

/** Insert a copy of the week straight after it. */
export function duplicateWeek(p: Program, weekId: string): Program {
  const i = p.weeks.findIndex((w) => w.id === weekId);
  if (i < 0) return p;
  const weeks = [...p.weeks];
  weeks.splice(i + 1, 0, copyWeek(p.weeks[i], `Week ${i + 2}`));
  return { ...p, weeks: renumber(weeks) };
}

export function removeWeek(p: Program, weekId: string): Program {
  return { ...p, weeks: renumber(p.weeks.filter((w) => w.id !== weekId)) };
}

export function addDay(p: Program, weekId: string, name: string): ProgramWithNewDay {
  const day: ProgramDay = { id: newId(), name: name.trim() || 'Workout', exercises: [] };
  return {
    program: { ...p, weeks: p.weeks.map((w) => (w.id === weekId ? { ...w, days: [...w.days, day] } : w)) },
    day,
  };
}

export interface ProgramWithNewDay {
  program: Program;
  day: ProgramDay;
}

export function updateDay(p: Program, dayId: string, update: (d: ProgramDay) => ProgramDay): Program {
  return {
    ...p,
    weeks: p.weeks.map((w) => ({ ...w, days: w.days.map((d) => (d.id === dayId ? update(d) : d)) })),
  };
}

export function removeDay(p: Program, dayId: string): Program {
  return { ...p, weeks: p.weeks.map((w) => ({ ...w, days: w.days.filter((d) => d.id !== dayId) })) };
}

export function findDay(p: Program, dayId: string) {
  for (const [weekIndex, week] of p.weeks.entries()) {
    const dayIndex = week.days.findIndex((d) => d.id === dayId);
    if (dayIndex >= 0) return { week, weekIndex, day: week.days[dayIndex], dayIndex };
  }
  return undefined;
}

/** Move an item within an array (returns a new array). */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** The "sets × reps @ weight" shorthand used in the editor. */
export interface Shorthand {
  sets: number;
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  distanceM?: number;
  restSec: number;
}

export function plannedFromShorthand(exerciseId: string, s: Shorthand, id = newId()): PlannedExercise {
  const set: PlannedSet = {};
  if (s.reps !== undefined) set.reps = s.reps;
  if (s.weightKg !== undefined) set.weightKg = s.weightKg;
  if (s.durationSec !== undefined) set.durationSec = s.durationSec;
  if (s.distanceM !== undefined) set.distanceM = s.distanceM;
  return {
    id,
    exerciseId,
    restSec: s.restSec,
    sets: Array.from({ length: Math.max(1, Math.round(s.sets)) }, () => ({ ...set })),
  };
}

export function shorthandOf(planned: PlannedExercise): Shorthand {
  const first = planned.sets[0] ?? {};
  return { sets: planned.sets.length, restSec: planned.restSec, ...first };
}

/** Sensible defaults when adding an exercise to a day. */
export function defaultShorthand(exercise: Exercise): Shorthand {
  const restSec = exercise.defaultRestSec;
  switch (exercise.type) {
    case 'weight':
      return { sets: 3, reps: 8, restSec };
    case 'bodyweight':
      return { sets: 3, reps: 8, restSec };
    case 'timed':
      return { sets: 3, durationSec: 30, restSec };
    case 'cardio':
      return { sets: 1, durationSec: 600, restSec };
  }
}

/** Human-readable summary, e.g. "5 × 5 @ 80 kg" or "3 × 0:45". */
export function describePlanned(planned: PlannedExercise, exercise: Exercise | undefined, unit: WeightUnit): string {
  const s = shorthandOf(planned);
  const type = exercise?.type ?? 'weight';
  const n = s.sets;
  switch (type) {
    case 'weight':
      return `${n} × ${s.reps ?? '?'}${s.weightKg !== undefined ? ` @ ${formatWeight(s.weightKg, unit)}` : ''}`;
    case 'bodyweight':
      return `${n} × ${s.reps ?? '?'}${s.weightKg ? ` + ${formatWeight(s.weightKg, unit)}` : ''}`;
    case 'timed':
      return `${n} × ${formatDuration(s.durationSec ?? 0)}${s.weightKg ? ` @ ${formatWeight(s.weightKg, unit)}` : ''}`;
    case 'cardio': {
      const parts = [formatDuration(s.durationSec ?? 0)];
      if (s.distanceM) parts.push(`${roundKm(s.distanceM)} km`);
      return (n > 1 ? `${n} × ` : '') + parts.join(' · ');
    }
  }
}

function roundKm(m: number) {
  return Math.round(m / 10) / 100;
}

function renumber<T extends { name: string }>(weeks: T[]): T[] {
  return weeks.map((w, i) => ({ ...w, name: `Week ${i + 1}` }));
}
