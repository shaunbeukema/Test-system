# Liftr

A personal weightlifting app for iPhone, built as a Progressive Web App (installed from Safari to the Home Screen). It's designed so it can become a native iOS app later through Capacitor. The full design is in **docs/SPEC.md**, which is the source of truth: update the spec first when a decision changes, then update the code.

## Working with the owner

- The owner is new to programming. Explain what you're doing in plain English, avoid jargon (or define it), and keep changes small.
- Guide with questions: when a design choice is open, ask (with options and a recommendation) rather than guessing.
- Before larger features, propose a short plan and get approval.
- After each feature: run the tests and build, screenshot the app at iPhone size, and commit.

## Commands

- `npm install`: install dependencies
- `npm run dev`: run locally with live reload
- `npm test`: run unit tests (Vitest)
- `npm run build`: type-check + production build (outputs `dist/`, including the service worker)
- `npm run lint`: lint (oxlint)
- `npm run preview`: serve the production build

## Architecture (keep these boundaries)

- `src/core/`: **pure logic and types**. No React, no browser APIs except `crypto.randomUUID`. Every rule lives here with tests next to it (`*.test.ts`). This layer must stay portable (Capacitor now, possibly Swift later).
  - `types.ts` data model · `progression.ts` last-time + weight recommendation · `program.ts` next day / copy week · `units.ts` kg/lb + formatting · `exercises.ts` built-in list · `backup.ts` export format · `storage.ts` the `Storage` interface
- `src/storage/`: `Storage` implementations (`DexieStorage` = IndexedDB). The UI never touches IndexedDB directly.
- `src/ui/`: React screens and components. `ui/storage.ts` holds the single storage instance.
- `src/index.css`: theme tokens and styles.

## Rules

- Store all weights in **kg**; convert only for display (`units.ts`).
- Built-in exercise IDs are stable slugs. Never rename them (saved data references them).
- Weight recommendation: every planned set completed at or above its target reps → last top-set weight + increment; otherwise the same weight. Never lower it automatically.
- Changes to the backup format must bump `BACKUP_VERSION` and stay able to read older versions.

## Design

Apple-like layout with a rugged feel: off-white `--bg`, charcoal/graphite surfaces, **steel blue** accent `--accent`, heavy bold type for headings and numbers (tabular figures), squarer corners (8–12px), tap targets of at least 48px. Use the CSS variables in `src/index.css`. Don't hard-code colors.

## Build phases

See docs/SPEC.md section 6. Phases 1 (foundation) and 2 (program editor) are done; Phase 3 is running a workout.
