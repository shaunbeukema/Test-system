# Liftr: Design Spec (draft v0.2)

A personal weightlifting app for iPhone, for one user. It runs a multi-week training program, logs every set quickly, and recommends when to add weight.

## 1. Platform and future-proofing

| Decision | Choice | Why |
|---|---|---|
| App type | Progressive Web App (PWA), installed from Safari to the Home Screen | No Mac needed; free; works offline |
| Language | TypeScript + React, built with Vite; tests with Vitest | Type-safe; ready for Capacitor |
| Path to native | Capacitor wraps the same code as a real iOS app | No rewrite needed later |
| Architecture | Logic (`src/core/`) is kept separate from screens (`src/ui/`) | Logic and its tests can be reused or ported to Swift |
| Storage | On-device (IndexedDB) behind one `Storage` interface | Can be swapped for native storage later |
| Hosting | GitHub Pages | Free |

## 2. Core concepts (data model)

- **Exercise**: name, type (`weight` | `bodyweight` | `timed` | `cardio`), default rest (seconds), weight increment (e.g. 2.5 kg). There's a built-in list, plus custom exercises you add.
- **Program**: a named multi-week block, made of **Weeks**, each made of **Days**, each made of **Planned exercises**.
  - Planned exercise: exercise, sets, target reps (or time or distance), target rest.
  - Weeks can be **copied and then edited**, so they can stay the same or vary (for example, a deload week).
- **Workout (session)**: date, the program day it came from (if any), and the exercises performed.
- **Set log**: depends on the exercise type:
  - weight: weight × reps
  - bodyweight: reps (+ optional added weight)
  - timed: duration (+ optional weight)
  - cardio: duration + distance
  - every set: **actual rest taken** after it, and whether it was completed
- **Settings**: units (kg/lb, switchable), default rest.

## 3. Screens

### Home
- A big **Start Workout** button, which starts the *next program day* (for example, "Week 2 · Day 3 – Pull").
- Smaller options: start an empty workout, or choose a different day.
- Shows the current program and progress (Week X of Y).

### Active workout
- A list of the day's exercises. Each set row is **prefilled** from the plan or recommendation; tap ✓ to confirm, or edit if it's different.
- Under each exercise: **"Last time: 80 kg × 5, 5, 5"**.
- **Recommendation badge** when it applies: "↑ Try 82.5 kg". You can accept or ignore it.
- Tapping ✓ starts the **rest countdown** using that exercise's target rest, with an alert at zero. The **actual rest** is recorded when the next set starts.
- Full flexibility: add, swap, skip, or reorder exercises and sets.
- Finish → a short summary → saved to history.

### Programs
- A list of programs; one is active.
- **Program editor**: weeks → days → exercises → sets, reps, rest. Copy week, copy day, reorder.

### Exercise history
- Pick an exercise → every session you did it, newest first, with sets, best set, and the date.

### Settings
- Units (kg/lb), default rest time, manage custom exercises.
- **Export backup** (saves a file to Files/iCloud Drive) and **Import backup**.

## 4. Rules

- **Recommendation:** if every planned working set of an exercise was completed at or above its target reps, recommend *last weight + that exercise's increment* next time. Otherwise, recommend the same weight.
- **Next workout:** the first uncompleted day in the active program, in order.
- **End of block:** show a **block summary** (sessions completed, PRs, total volume, consistency), then offer to **repeat the block with updated weights** (from the recommendations).
- Unit conversion is for display only; data is stored in kg.

## 5. Look and feel

- **Apple-like, with a rugged, masculine feel.** Accent color: **steel blue**. iOS layout and conventions (system font, clean spacing, familiar navigation), but with more weight:
  - Light base (off-white) with **charcoal/graphite** surfaces and text; steel blue accent for actions.
  - **Bold, heavy type** for headings and numbers (weights, reps, timer); tabular figures so numbers line up.
  - Tighter corner radii (squarer, more "steel plate" than "bubbly"); solid fills over soft gradients.
  - Minimal decoration; no pastels or playful illustrations.
- Large tap targets (at least 44 pt) for gym use.
- Bottom tabs: **Home · Programs · History · Settings**.

## 6. Build phases

1. ✅ **Foundation**: project skeleton, CLAUDE.md, data model, storage, tests.
2. ✅ **Program editor**: create a multi-week program.
3. **Run a workout**: start the next day, prefilled sets, ✓, rest timer, last time, recommendations.
4. **Exercise history** + export/import backup.
5. **Block summary** + repeat block.
6. Install on iPhone (Home Screen), polish.
7. *(Later)* Capacitor native app.

## 7. Out of scope for v1

Progress charts, calendar view, supersets, RPE, notes, cloud sync, multiple users.

## 8. Resolved decisions

- **Built-in exercises:** about 30 common lifts preloaded; custom exercises can be added.
- **Missed reps:** keep the same weight next time (never auto-lower).
