// Walkthrough test: run `npm run build`, then `npm run e2e` (needs Playwright + Chromium).
const { chromium, devices } = require('playwright');
const path = require('path');
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.LIFTR_URL || 'http://localhost:4173/';

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 15'] })).newPage();
  await p.clock.install({ time: new Date('2026-11-16T18:00:00') });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p.on('dialog', (d) => { errors.push('Unexpected browser pop-up: ' + d.message()); d.dismiss(); });
  const accept = async () => { await p.locator('.dialog .dialog-btn.strong').click(); await p.locator('.dialog').waitFor({ state: 'detached' }); };
  const tab = (name) => p.getByRole('navigation', { name: 'Main' }).getByRole('button', { name });
  const log = (...a) => console.log('✓', ...a);
  const fill = async (loc, v) => { await loc.fill(String(v)); await loc.blur(); };
  const expect = (cond, msg) => { if (!cond) throw new Error('Expectation failed: ' + msg); };
  const startSub = async () => { await p.locator('.start-btn:not([disabled])').waitFor(); return p.locator('.start-sub').textContent(); };

  // --- One-week block: A, B, C — each Bench 1 x 5
  await p.goto(URL);
  await p.getByRole('button', { name: 'Create Program' }).click();
  await p.getByLabel('Program name').fill('Mini Block');
  await p.getByRole('button', { name: 'Create', exact: true }).click();
  for (const day of ['A', 'B', 'C']) {
    await p.getByRole('button', { name: '+ Add Day' }).click();
    await p.getByLabel('Day name').fill(day);
    await p.getByRole('button', { name: '+ Add Exercise' }).click();
    await p.getByLabel('Search exercises').fill('bench press');
    await p.getByRole('button', { name: 'Bench Press', exact: true }).click();
    await fill(p.getByRole('textbox', { name: 'Sets' }), 1);
    await fill(p.getByRole('textbox', { name: 'Reps' }), 5);
    await p.getByRole('button', { name: 'Add', exact: true }).click();
    await p.getByRole('button', { name: 'Mini Block' }).click();
  }
  log('built 3-day block');

  async function doWorkout() {
    await p.getByRole('button', { name: /Start Workout/ }).click();
    const bench = p.locator('.ex-card', { hasText: 'Bench Press' });
    await bench.waitFor();
    if (await bench.getByText('Starting weight?').count()) {
      await fill(bench.getByRole('textbox', { name: 'Weight', exact: true }), 60);
      await bench.getByRole('button', { name: 'Use This Weight' }).click();
    }
    const weight = await bench.getByRole('textbox', { name: 'Set 1 weight' }).inputValue();
    await bench.getByRole('button', { name: 'Complete set 1' }).click();
    await p.getByRole('button', { name: 'Finish' }).click(); await accept();
    return weight;
  }

  // Day A
  await tab('Home').click();
  expect((await startSub()).includes('Day 1: A'), 'next is A');
  const wA = await doWorkout();
  await p.clock.runFor(86400_000);
  // Skip Day B
  expect((await startSub()).includes('Day 2: B'), 'next is B');
  await p.getByRole('button', { name: 'Skip this day' }).click(); await accept();
  await p.getByText('Skipped B').waitFor();
  console.log('  program card:', await p.locator('.card').first().innerText());
  log('skipped B →', await startSub());
  await p.screenshot({ path: path.join(out, 'p5-home-skip.png') });
  await p.clock.runFor(86400_000);
  // Day C (last) → summary
  const wC = await doWorkout();
  await p.getByText('Block complete').first().waitFor();
  const big = (await p.locator('.summary-big').innerText()).replace(/\s+/g, ' ');
  const skipped = await p.locator('.summary-skipped').textContent();
  console.log('  summary:', big, '|', skipped);
  expect(big === '2 / 3' && skipped === '1 day skipped', 'summary 2/3 with 1 skipped');
  await p.screenshot({ path: path.join(out, 'p5-summary.png') });
  log('block summary shown after last day');

  // Repeat → back to A, weight progresses
  await p.getByRole('button', { name: 'Repeat Block' }).click();
  await p.getByText('Block restarted at Week 1').waitFor();
  expect((await startSub()).includes('Day 1: A'), 'repeat starts at A');
  await p.clock.runFor(86400_000);
  await p.getByRole('button', { name: /Start Workout/ }).click();
  const badge = await p.locator('.badge-up').textContent();
  const wA2 = await p.getByRole('textbox', { name: 'Set 1 weight' }).inputValue();
  console.log(`  weights: A=${wA} C=${wC} → repeated A=${wA2} | ${badge}`);
  expect(wA2 === '65', 'keeps progressing (60 → 62.5 → 65)');
  log('repeat keeps progressing');
  await p.getByRole('button', { name: 'Discard Workout' }).click(); await accept();

  // Skip all three → summary 0/3, Done → Home card offers Repeat
  for (let i = 0; i < 3; i++) {
    await p.locator('.start-btn:not([disabled])').waitFor();
    await p.getByRole('button', { name: 'Skip this day' }).click(); await accept();
    if (i < 2) await p.getByText(/^✓ Skipped/).waitFor();
  }
  await p.getByText('Block complete').first().waitFor();
  console.log('  summary 2:', (await p.locator('.summary-big').innerText()).replace(/\s+/g, ' '), '|', await p.locator('.summary-skipped').textContent());
  await p.getByRole('button', { name: 'Done' }).click();
  await p.locator('.start-btn:not([disabled])').waitFor();
  const card = await p.locator('.card').first().innerText();
  console.log('  home card:', card.replace(/\n/g, ' | '));
  expect(card.includes('Block complete') && card.includes('Repeat Block'), 'home offers repeat');
  await p.screenshot({ path: path.join(out, 'p5-home-complete.png') });
  await p.locator('.card').getByRole('button', { name: 'Repeat Block' }).click();
  await p.getByText('Block restarted at Week 1').waitFor();
  log('Done → Home card → Repeat works');

  // Skipped days don't pollute History
  await tab('History').click();
  await p.locator('.list-row').first().waitFor();
  await p.getByRole('button', { name: /Bench Press/ }).click();
  await p.locator('.session-sets').first().waitFor();
  const sessions = await p.locator('.session-sets').count();
  expect(sessions === 2, 'history has only the 2 real sessions, got ' + sessions);
  log('history ignores skipped days');

  console.log('errors:', errors);
  if (errors.length) process.exitCode = 1;
  await b.close();
})().catch((e) => { console.error('FAILED', e.message.split('\n').slice(0, 3).join(' / ')); console.error(e.stack.split('\n').find((l) => l.includes('block.cjs'))); process.exit(1); });
