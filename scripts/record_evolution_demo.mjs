// Earn all three transformations through the real two-player activity UI.
// Only the three animation intervals are used in the short highlight.
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createStaticServer } from './serve.mjs';
import { getPetStats, PET_EVOLUTIONS } from '../dist/core.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = resolve(dirname(fileURLToPath(import.meta.url)), '../demo/pitch');
await mkdir(join(output, 'source'), { recursive: true });
await mkdir(join(output, 'stills'), { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'grandpals-evolution-'));
const server = createStaticServer();
let browser, context;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'en-SG',
    recordVideo: { dir: temporary, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  const clock = performance.now();
  const elapsed = () => (performance.now() - clock) / 1000;
  const errors = [], scenes = [], screenshots = [];
  page.on('pageerror', error => errors.push(error.message));
  const tap = async selector => { await page.locator(selector).tap(); await page.waitForTimeout(30); };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
  await tap('.nav-item[data-page="activities"]');
  await tap('[data-action="together-mode"][data-kind="conversation"]');
  await tap('#together-setup-form button[type="submit"]');
  for (let round = 1; round <= 18; round++) {
    if (round > 1) await tap('[data-action="quick-pair-play"]');
    await tap('[data-action="session-start"]');
    // Default challenge uses four prompts; both people get a turn on each.
    for (let turn = 0; turn < 8; turn++) await tap('[data-action="together-next"]');
    const current = getPetStats(await state());
    assert.equal(current.experience, round * 10);
    const form = PET_EVOLUTIONS.find(item => item.unlockXp === current.experience);
    if (form) {
      const reveal = page.locator('.evolution-reveal');
      await reveal.waitFor();
      assert.equal(await reveal.getAttribute('data-to'), form.id);
      const start = elapsed();
      await page.waitForTimeout(3150);
      const end = elapsed();
      assert.ok(await page.locator('.modal').evaluate(element => element.scrollHeight <= element.clientHeight + 2), 'Evolution result fits on the phone screen.');
      const file = `${14 + scenes.length}-${form.id}.png`;
      await page.screenshot({ path: join(output, 'stills', file) });
      scenes.push({ name: form.name, from: await reveal.getAttribute('data-from'), to: form.id,
        growth: current.experience, level: current.level, start: Number(start.toFixed(3)), end: Number(end.toFixed(3)) });
      screenshots.push({ file, description: `Earned transformation: ${form.name}, at ${current.experience} growth.`, width: 780, height: 1688 });
      console.log(`Captured earned evolution: ${form.name}, ${current.experience} growth.`);
    }
  }
  assert.equal(scenes.length, 3);
  const earned = await state();
  assert.equal(earned.points, 540);
  assert.equal(getPetStats(earned).form.id, 'story-keeper');
  await tap('[data-action="close-dialog"]');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.evolution-reveal').count(), 0, 'Reload does not repeat evolution rewards.');
  await tap('.nav-item[data-page="settings"]');
  await tap('[data-action="characters"]');
  await page.locator('.evolution-journey').evaluate(element => element.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: join(output, 'stills/17-evolution-journey.png') });
  screenshots.push({ file: '17-evolution-journey.png', description: 'All four looks, with replay available for earned evolutions.', width: 780, height: 1688 });
  await tap('[data-action="evolution-replay"][data-id="little-explorer"]');
  assert.deepEqual(await state(), earned, 'Replay must not change points, growth, or history.');
  assert.deepEqual(errors, []);
  const video = page.video();
  await context.close();
  context = null;
  await video.saveAs(join(output, 'source/evolution-mobile.webm'));
  await writeFile(join(output, 'source/evolution-scenes.json'), JSON.stringify({
    recordedAt: new Date().toISOString(), source: 'source/evolution-mobile.webm', speed: 1,
    earnedThrough: '18 completed two-player conversation games. No saved growth or level was edited.',
    scenes, screenshots,
  }, null, 2));
  console.log('Saved three real evolution animations and four screenshots. Persistence and reward-free replay verified.');
} finally {
  await context?.close();
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
