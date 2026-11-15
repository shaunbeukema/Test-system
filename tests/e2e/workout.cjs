const { chromium, devices } = require('playwright');
// Walkthrough test: run `npm run build`, then `npm run e2e` (needs Playwright + Chromium).
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.LIFTR_URL || 'http://localhost:4173/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 15'] });
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date('2026-11-16T18:00:00') });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  p.on('dialog', d => d.accept());
  const log = (...a) => console.log('✓', ...a);
  const blurFill = async (name, v) => { const l = p.getByRole('textbox', { name, exact: true }); await l.fill(String(v)); await l.blur(); };

  // --- Build a 2-week program: Push = Bench 3x5 (no weight), Plank 2x30s
  await p.goto(URL);
  await p.getByRole('button', { name: 'Create Program' }).click();
  await p.getByLabel('Program name').fill('Strength Block');
  await p.getByRole('button', { name: 'Create', exact: true }).click();
  await p.getByRole('button', { name: '+ Add Day' }).click();
  await p.getByLabel('Day name').fill('Push');
  await p.getByRole('button', { name: '+ Add Exercise' }).click();
  await p.getByLabel('Search exercises').fill('bench press');
  await p.getByRole('button', { name: 'Bench Press', exact: true }).click();
  await blurFill('Reps', 5);
  await p.getByRole('button', { name: 'Add', exact: true }).click();
  await p.getByRole('button', { name: '+ Add Exercise' }).click();
  await p.getByLabel('Search exercises').fill('plank');
  await p.getByRole('button', { name: 'Plank', exact: true }).click();
  await blurFill('Sets', 2);
  await p.getByRole('button', { name: 'Add', exact: true }).click();
  await p.getByRole('button', { name: 'Strength Block' }).click();
  await p.getByRole('button', { name: 'Week 1 options' }).click();
  await p.getByRole('button', { name: 'Copy Week' }).click();
  log('program built');

  // --- Workout 1
  await p.getByRole('button', { name: 'Home' }).click();
  console.log('  home:', await p.locator('.start-sub').textContent());
  await p.getByRole('button', { name: /Start Workout/ }).click();
  await p.getByText('Starting weight?').waitFor();
  log('asked for starting weight (no history, no plan)');
  await p.screenshot({ path: out + '/p3-starting-weight.png' });
  await blurFill('Weight', 80);
  await p.getByRole('button', { name: 'Use This Weight' }).click();
  await p.getByRole('button', { name: 'Complete set 1' }).first().click();
  await p.clock.runFor(30_000);
  console.log('  rest bar after 30s:', (await p.locator('.restbar-time').innerText()).replace('\n', ' '));
  await p.screenshot({ path: out + '/p3-workout-resting.png' });
  await p.getByRole('button', { name: 'Rest 15 seconds more' }).click();
  await p.clock.runFor(170_000);
  console.log('  rest bar at end:', await p.locator('.restbar').innerText());
  await p.screenshot({ path: out + '/p3-rest-over.png' });
  await p.getByRole('button', { name: 'Complete set 2' }).first().click(); // ~170s after set 1
  await p.getByRole('button', { name: 'Skip' }).click();
  await p.clock.runFor(60_000);

  // --- Resume after reload (iOS killed the app)
  await p.reload();
  await p.locator('.start-btn:not([disabled])').waitFor();
  console.log('  home after reload:', await p.locator('.start-label').textContent(), '|', await p.locator('.start-sub').textContent());
  await p.getByRole('button', { name: /Resume Workout/ }).click();
  await p.locator('.ex-card').first().waitFor();
  const done = await p.locator('.set-check[aria-pressed="true"]').count();
  console.log('  completed sets restored:', done);
  await p.getByRole('button', { name: 'Complete set 3' }).first().click({ timeout: 5000 });
  const plank = p.locator('.ex-card', { hasText: 'Plank' });
  await plank.getByRole('button', { name: 'Complete set 1' }).click();
  await plank.getByRole('button', { name: 'Complete set 2' }).click();
  await p.getByRole('button', { name: 'Finish' }).click();
  console.log('  toast:', await p.locator('.toast').textContent());
  console.log('  next:', await p.locator('.start-sub').textContent());

  const saved = await p.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('liftr'); r.onsuccess = () => { const t = r.result.transaction('workouts').objectStore('workouts').getAll(); t.onsuccess = () => res(t.result); };
  }));
  console.log('  saved bench sets:', JSON.stringify(saved[0].exercises[0].sets.map(s => [s.weightKg, s.reps, s.completed, s.restSec])));

  // --- Workout 2: recommendation
  await p.clock.runFor(2 * 86400_000);
  await p.getByRole('button', { name: /Start Workout/ }).click();
  console.log('  badge:', await p.locator('.badge-up').textContent());
  console.log('  last time:', await p.locator('.ex-last').first().textContent());
  console.log('  prefilled weight:', await p.getByRole('textbox', { name: 'Set 1 weight' }).inputValue());
  await p.screenshot({ path: out + '/p3-workout-2.png' });
  console.log('errors:', errors);
  if (errors.length) process.exitCode = 1;
  await b.close();
})().catch(e => { console.error('FAILED', e.message.split('\n')[0]); console.error(e.message.slice(0, 1500)); process.exit(1); });
