const { chromium, devices } = require('playwright');
// Walkthrough test: run `npm run build`, then `npm run e2e` (needs Playwright + Chromium).
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.LIFTR_URL || 'http://localhost:4173/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 15'] });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  p.on('dialog', (d) => { errors.push('Unexpected browser pop-up: ' + d.message()); d.dismiss(); });
  const accept = async () => { await p.locator('.dialog .dialog-btn.strong').click(); await p.locator('.dialog').waitFor({ state: 'detached' }); };
  const step = (s) => console.log('✓', s);
  await p.goto(URL);
  await p.getByRole('button', { name: 'Create Program' }).click();
  await p.getByLabel('Program name').fill('Strength Block');
  await p.getByRole('button', { name: 'Create', exact: true }).click();
  step('created program');
  await p.getByRole('button', { name: '+ Add Day' }).click();
  await p.getByLabel('Day name').fill('Push');
  step('added day + renamed');
  // Bench 5x5 @ 80
  await p.getByRole('button', { name: '+ Add Exercise' }).click();
  await p.getByLabel('Search exercises').fill('bench');
  await p.getByRole('button', { name: 'Bench Press', exact: true }).click();
  await p.getByRole('textbox', { name: 'Sets' }).fill('5'); await p.getByRole('textbox', { name: 'Sets' }).blur();
  await p.getByRole('textbox', { name: 'Reps' }).fill('5'); await p.getByRole('textbox', { name: 'Reps' }).blur();
  await p.getByRole('button', { name: 'Increase Weight (optional)' }).click(); // 2.5
  await p.getByRole('textbox', { name: 'Weight (optional)' }).fill('80'); await p.getByRole('textbox', { name: 'Weight (optional)' }).blur();
  await p.screenshot({ path: out + '/p2-sheet.png' });
  await p.getByRole('button', { name: 'Add', exact: true }).click();
  // OHP default
  await p.getByRole('button', { name: '+ Add Exercise' }).click();
  await p.getByLabel('Search exercises').fill('overhead');
  await p.getByRole('button', { name: 'Overhead Press' }).click();
  await p.getByRole('button', { name: 'Add', exact: true }).click();
  // Plank (timed)
  await p.getByRole('button', { name: '+ Add Exercise' }).click();
  await p.getByLabel('Search exercises').fill('plank');
  await p.getByRole('button', { name: 'Plank' }).click();
  await p.getByRole('button', { name: 'Add', exact: true }).click();
  // Custom
  await p.getByRole('button', { name: '+ Add Exercise' }).click();
  await p.getByLabel('Search exercises').fill('Landmine Press');
  await p.getByRole('button', { name: /Create “Landmine Press”/ }).click();
  await p.getByRole('button', { name: 'Create & Add' }).click();
  await p.getByRole('button', { name: 'Add', exact: true }).click();
  step('added 4 exercises incl. custom');
  // reorder: move Plank (3rd) up
  await p.getByRole('button', { name: 'Move Plank up' }).click();
  const names = await p.locator('.exercise-name').allTextContents();
  console.log('  order:', names.join(', '));
  console.log('  details:', (await p.locator('.exercise-detail').allTextContents()).join(' | '));
  await p.screenshot({ path: out + '/p2-day.png' });
  await p.getByRole('button', { name: 'Strength Block' }).click();
  await p.getByRole('button', { name: '+ Add Day' }).click();
  await p.getByLabel('Day name').fill('Pull');
  await p.getByRole('button', { name: 'Strength Block' }).click();
  await p.getByRole('button', { name: 'Week 1 options' }).click();
  await p.getByRole('button', { name: 'Copy Week' }).click();
  step('copied week');
  await p.screenshot({ path: out + '/p2-program.png', fullPage: true });
  // persistence
  await p.reload();
  await p.locator('.start-sub').waitFor();
  console.log('  home subtitle after reload:', await p.locator('.start-sub').textContent());
  await p.getByRole('button', { name: 'Programs' }).click();
  console.log('  programs list:', await p.locator('.list-row').first().innerText());
  await p.screenshot({ path: out + '/p2-home-list.png' });
  console.log('errors:', errors);
  if (errors.length) process.exitCode = 1;
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
