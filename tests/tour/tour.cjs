// Screen tour: plays through Liftr with realistic data and saves a screenshot of every screen.
// Usage: npm run build && npm run tour   → images in docs/screenshots/tour/
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const out = process.argv[2] || path.join(__dirname, '../../docs/screenshots/tour');
const URL = process.env.LIFTR_URL || 'http://localhost:4173/';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 15'] })).newPage();
  await p.clock.install({ time: new Date('2026-11-16T07:00:00') });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p.on('dialog', (d) => { errors.push('Unexpected browser pop-up: ' + d.message()); d.dismiss(); });
  const accept = async () => { await p.locator('.dialog .dialog-btn.strong').click(); await p.locator('.dialog').waitFor({ state: 'detached' }); };
  const tab = (name) => p.getByRole('navigation', { name: 'Main' }).getByRole('button', { name });
  const fill = async (loc, v) => { await loc.fill(String(v)); await loc.blur(); };
  let n = 0;
  const shot = async (name, opts = {}) => {
    await p.waitForTimeout(350); // let animations settle
    const file = `${String(++n).padStart(2, '0')}-${name}.png`;
    await p.screenshot({ path: path.join(out, file), ...opts });
    console.log('📸', file);
  };
  const home = async () => { await tab('Home').click(); await p.locator('.start-btn:not([disabled])').waitFor(); };

  // ---------- Program building
  await p.goto(URL);
  await p.locator('.start-btn:not([disabled])').waitFor();
  await shot('home-first-launch');

  await p.getByRole('button', { name: 'Create Program' }).click();
  await p.getByLabel('Program name').fill('Strength Block');
  await shot('new-program');
  await p.getByRole('button', { name: 'Create', exact: true }).click();

  async function addExercise(search, name, { sets, reps, weight, seconds, minutes, km, create, capture } = {}) {
    await p.getByRole('button', { name: '+ Add Exercise' }).click();
    await p.getByLabel('Search exercises').fill(search);
    if (capture === 'picker') await shot('exercise-picker');
    if (create) {
      await p.getByRole('button', { name: `+ Create “${name}”` }).click();
      await p.getByRole('radio', { name: create }).click();
      if (capture === 'create') await shot('create-custom-exercise');
      await p.getByRole('button', { name: 'Create & Add' }).click();
    } else {
      await p.getByRole('button', { name, exact: true }).click();
    }
    if (sets) await fill(p.getByRole('textbox', { name: 'Sets' }), sets);
    if (reps) await fill(p.getByRole('textbox', { name: 'Reps' }), reps);
    if (weight) await fill(p.getByRole('textbox', { name: /Weight \(optional\)|Added weight/ }), weight);
    if (km) await fill(p.getByRole('textbox', { name: 'Distance (optional)' }), km);
    for (let i = 0; seconds && i < (seconds - 30) / 5; i++) await p.getByRole('button', { name: 'Increase Hold' }).click();
    for (let i = 0; minutes && i < minutes - 10; i++) await p.getByRole('button', { name: 'Increase Time' }).click();
    if (capture === 'sheet') await shot('exercise-settings');
    await p.getByRole('button', { name: 'Add', exact: true }).click();
  }
  async function addDay(name) {
    await p.getByRole('button', { name: '+ Add Day' }).click();
    await p.getByLabel('Day name').fill(name);
  }
  const backToProgram = () => p.locator('.back-btn').click();

  await addDay('Push');
  await addExercise('bench', 'Bench Press', { sets: 4, reps: 6, weight: 80, capture: 'sheet' });
  await addExercise('press', 'Overhead Press', { sets: 3, reps: 8, weight: 45, capture: 'picker' });
  await addExercise('dip', 'Dip', { sets: 3, reps: 10 });
  await addExercise('plank', 'Plank', { sets: 3, seconds: 45 });
  await shot('day-push');
  await backToProgram();

  await addDay('Pull');
  await addExercise('barbell row', 'Barbell Row', { sets: 4, reps: 8, weight: 70 });
  await addExercise('pull-up', 'Pull-up', { sets: 3, reps: 8 });
  await addExercise('Landmine Row', 'Landmine Row', { sets: 3, reps: 10, weight: 40, create: 'Weights', capture: 'create' });
  await backToProgram();

  await addDay('Legs');
  await addExercise('back squat', 'Back Squat', { sets: 4, reps: 5, weight: 100 });
  await addExercise('romanian', 'Romanian Deadlift', { sets: 3, reps: 8 }); // no weight → asks at the gym
  await addExercise('rower', 'Rower', { minutes: 10, km: 2 });
  await backToProgram();

  await p.getByRole('button', { name: 'Week 1 options' }).click();
  await shot('week-options');
  await p.getByRole('button', { name: 'Copy Week' }).click();
  await shot('program-overview');
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('program-overview-scrolled');
  await p.evaluate(() => window.scrollTo(0, 0));
  await tab('Programs').click();
  await shot('programs-list');

  // ---------- Training
  async function train(day, { shots = {}, weightFor = {} } = {}) {
    await home();
    if (shots.home) await shot(shots.home);
    await p.getByRole('button', { name: /Start Workout/ }).click();
    await p.locator('.ex-card').first().waitFor();
    if (shots.start) await shot(shots.start);
    const cards = p.locator('.ex-card');
    const count = await cards.count();
    for (let c = 0; c < count; c++) {
      const card = cards.nth(c);
      if (await card.getByText('Starting weight?').count()) {
        if (shots.starting) { await card.scrollIntoViewIfNeeded(); await shot(shots.starting); }
        const title = await card.locator('.ex-card-title').textContent();
        await fill(card.getByRole('textbox', { name: 'Weight', exact: true }), weightFor[title] ?? 60);
        await card.getByRole('button', { name: 'Use This Weight' }).click();
      }
      const sets = await card.locator('.set-check').count();
      for (let s = 1; s <= sets; s++) {
        await card.getByRole('button', { name: `Complete set ${s}` }).click();
        if (c === 0 && s === 1 && shots.resting) { await p.clock.runFor(35_000); await shot(shots.resting); }
        if (c === 0 && s === 2 && shots.restOver) { await p.clock.runFor(200_000); await shot(shots.restOver); }
        await p.clock.runFor(90_000);
      }
    }
    await p.getByRole('button', { name: 'Finish' }).click();
    if (shots.finish) await shot(shots.finish);
    await accept();
    await p.clock.runFor(2 * 86400_000);
  }

  await train('Push', { shots: { home: 'home-ready', start: 'workout-start', resting: 'workout-resting', restOver: 'workout-rest-over', finish: 'finish-dialog' } });
  await p.locator('.toast').waitFor();
  await shot('workout-saved');
  await train('Pull');
  await train('Legs', { shots: { starting: 'starting-weight' }, weightFor: { 'Romanian Deadlift': 80 } });
  await train('Push week 2', { shots: { start: 'recommendation' } });

  // ---------- History & settings
  await tab('History').click();
  await p.locator('.list-row').first().waitFor();
  await shot('history');
  await p.getByRole('button', { name: /Bench Press/ }).click();
  await p.locator('.session-sets').first().waitFor();
  await shot('history-exercise');
  await p.locator('.list-row').last().click();
  await p.locator('.ex-card').first().waitFor();
  await shot('history-edit-workout');

  await tab('Settings').click();
  await p.getByRole('button', { name: 'Export Backup' }).waitFor();
  await shot('settings');
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('settings-backup');
  await p.getByRole('button', { name: /My Exercises/ }).click();
  await shot('my-exercises');

  // ---------- End of block
  await home();
  for (let i = 0; i < 2; i++) {
    await p.getByRole('button', { name: 'Skip this day' }).click(); await accept();
    if (i === 0) { await p.getByText(/^✓ Skipped/).waitFor(); await shot('home-skipped'); }
  }
  await p.getByText('Block complete').first().waitFor();
  await shot('block-summary');
  await p.getByRole('button', { name: 'Done' }).click();
  await p.locator('.start-btn:not([disabled])').waitFor();
  await shot('home-block-complete');

  console.log('errors:', errors);
  if (errors.length) process.exitCode = 1;
  await b.close();
})().catch((e) => { console.error('FAILED', e.message.split('\n').slice(0, 3).join(' / ')); console.error(e.stack.split('\n').find((l) => l.includes('tour.cjs'))); process.exit(1); });
