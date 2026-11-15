// Walkthrough test: run `npm run build`, then `npm run e2e` (needs Playwright + Chromium).
const { chromium, devices } = require('playwright');
const path = require('path');
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.LIFTR_URL || 'http://localhost:4173/';

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 15'], acceptDownloads: true });
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date('2026-11-16T18:00:00') });
  const errors = [];
  const dialogs = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p.on('dialog', (d) => {
    dialogs.push(d.message());
    if (d.type() === 'prompt') d.accept('Landmine Press (Barbell)');
    else d.accept();
  });
  const tab = (name) => p.getByRole('navigation', { name: 'Main' }).getByRole('button', { name });
  const log = (...a) => console.log('✓', ...a);
  const fill = async (loc, v) => { await loc.fill(String(v)); await loc.blur(); };
  const expect = (cond, msg) => { if (!cond) throw new Error('Expectation failed: ' + msg); };

  async function emptyWorkout(weight, reps, { extraUnused = false } = {}) {
    await tab('Home').click().catch(() => {});
    await p.getByRole('button', { name: /Start Workout/ }).click();
    await p.getByRole('button', { name: '+ Add Exercise' }).click();
    await p.getByLabel('Search exercises').fill('bench press');
    await p.getByRole('button', { name: 'Bench Press', exact: true }).click();
    const bench = p.locator('.ex-card', { hasText: 'Bench Press' });
    await bench.waitFor();
    if (await bench.getByText('Starting weight?').count()) {
      // First time: Liftr asks once for a starting weight.
      await fill(bench.getByRole('textbox', { name: 'Weight', exact: true }), weight);
      await bench.getByRole('button', { name: 'Use This Weight' }).click();
    } else {
      // Has history: sets are prefilled from last time; change the weight.
      for (let i = 1; i <= 3; i++) await fill(bench.getByRole('textbox', { name: `Set ${i} weight` }), weight);
    }
    for (let i = 1; i <= 3; i++) await fill(bench.getByRole('textbox', { name: `Set ${i} reps` }), reps);
    for (let i = 1; i <= 3; i++) await bench.getByRole('button', { name: `Complete set ${i}` }).click();
    if (extraUnused) {
      for (const name of ['Landmine Press', 'Unused Lift']) {
        await p.getByRole('button', { name: '+ Add Exercise' }).click();
        await p.getByLabel('Search exercises').fill(name);
        await p.getByRole('button', { name: `+ Create “${name}”` }).click();
        await p.getByRole('button', { name: 'Create & Add' }).click();
      }
      const landmine = p.locator('.ex-card', { hasText: 'Landmine Press' });
      await fill(landmine.getByRole('textbox', { name: 'Weight', exact: true }), 30);
      await landmine.getByRole('button', { name: 'Use This Weight' }).click();
      await landmine.getByRole('button', { name: 'Complete set 1' }).click();
      const unused = p.locator('.ex-card', { hasText: 'Unused Lift' });
      await unused.getByRole('button', { name: 'Unused Lift options' }).click();
      await unused.getByRole('button', { name: 'Remove Exercise' }).click();
    }
    await p.getByRole('button', { name: 'Finish' }).click();
    await p.locator('.toast').waitFor();
  }

  await p.goto(URL);
  await emptyWorkout(60, 8, { extraUnused: true });
  await p.clock.runFor(3 * 86400_000);
  await emptyWorkout(65, 8);
  log('logged two workouts');

  // --- History list
  await tab('History').click();
  await p.locator('.list-row').first().waitFor();
  const rows = await p.locator('.list-row').allInnerTexts();
  console.log('  history list:', rows.map((r) => r.replace(/\n/g, ' ')).join(' || '));
  expect(rows[0].includes('Bench Press') && rows[0].includes('65 kg × 8'), 'bench best 65 kg × 8 listed first');
  await p.screenshot({ path: path.join(out, 'p4-history.png') });

  // --- Exercise page
  await p.getByRole('button', { name: /Bench Press/ }).click();
  await p.locator('.session-sets').first().waitFor();
  const sessions = await p.locator('.session-sets').allTextContents();
  console.log('  bench sessions:', sessions.join(' | '));
  expect(sessions.length === 2 && sessions[0] === '65 kg × 8, 8, 8', 'two sessions, newest first');
  await p.screenshot({ path: path.join(out, 'p4-exercise.png') });

  // --- Edit a past workout (fix a typo)
  await p.locator('.list-row').nth(1).click();
  await fill(p.locator('.ex-card', { hasText: 'Bench Press' }).getByRole('textbox', { name: 'Set 3 reps' }), 6);
  await p.screenshot({ path: path.join(out, 'p4-edit.png') });
  await p.locator('.back-btn').click();
  const edited = await p.locator('.session-sets').allTextContents();
  expect(edited[1] === '60 kg × 8, 8, 6', 'edit saved: ' + edited[1]);
  log('edited past workout →', edited[1]);

  // --- Units → lb
  await tab('Settings').click();
  await p.getByRole('radio', { name: 'Pounds (lb)' }).click();
  await tab('History').click();
  await p.locator('.list-row').first().waitFor();
  const lbRow = await p.locator('.list-row').first().innerText();
  expect(lbRow.includes('143.5 lb'), 'history shows lb: ' + lbRow);
  log('units switched:', lbRow.replace(/\n/g, ' '));
  await tab('Settings').click();
  await p.getByRole('radio', { name: 'Kilograms (kg)' }).click();
  await p.screenshot({ path: path.join(out, 'p4-settings.png'), fullPage: true });

  // --- My exercises: delete blocked when used, allowed when unused, rename
  await p.getByRole('button', { name: /My Exercises/ }).click();
  const mine = await p.locator('.list-row span:first-child').allTextContents();
  console.log('  my exercises:', mine.join(', '));
  await p.locator('.list-row', { hasText: 'Landmine Press' }).getByRole('button', { name: 'Delete' }).click();
  expect(dialogs.at(-1).includes('can’t be deleted'), 'used exercise protected');
  await p.locator('.list-row', { hasText: 'Unused Lift' }).getByRole('button', { name: 'Delete' }).click();
  await p.locator('.list-row', { hasText: 'Landmine Press' }).getByRole('button', { name: 'Rename' }).click();
  await p.getByText('Landmine Press (Barbell)').waitFor();
  const after = await p.locator('.list-row span:first-child').allTextContents();
  expect(after.length === 1 && after[0] === 'Landmine Press (Barbell)', 'unused deleted + renamed: ' + after);
  log('custom exercises: protected / deleted / renamed →', after.join(', '));
  await tab('Settings').click();

  // --- Backup round trip
  const [download] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Export Backup' }).click()]);
  const file = path.join(out, download.suggestedFilename());
  await download.saveAs(file);
  log('exported', download.suggestedFilename());

  // wipe: delete the newest workout via History
  await tab('History').click();
  await p.getByRole('button', { name: /Bench Press/ }).click();
  await p.locator('.list-row').first().click();
  await p.getByRole('button', { name: 'Delete Workout' }).click();
  await p.waitForFunction(() => document.querySelectorAll('.session-sets').length === 1, null, { timeout: 5000 });
  log('deleted a workout (1 session left)');

  await tab('Settings').click();
  await p.getByLabel('Backup file').setInputFiles(file);
  await p.locator('.backup-msg').waitFor();
  console.log('  restore message:', await p.locator('.backup-msg').textContent());
  await tab('History').click();
  await p.getByRole('button', { name: /Bench Press/ }).click();
  await p.waitForFunction(() => document.querySelectorAll('.session-sets').length === 2, null, { timeout: 5000 });
  const restored = await p.locator('.session-sets').allTextContents();
  expect(restored.length === 2, 'restored both sessions');
  log('restored backup →', restored.join(' | '));

  // bad file
  await tab('Settings').click();
  await p.getByLabel('Backup file').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await p.getByText('Not a Liftr backup file.').waitFor();
  log('rejected a non-backup file with a friendly message');

  console.log('errors:', errors);
  if (errors.length) process.exitCode = 1;
  await b.close();
})().catch((e) => { console.error('FAILED', e.message.split('\n').slice(0,4).join(' / ')); console.error(e.stack.split('\n').find(l => l.includes('history-settings'))); process.exit(1); });
