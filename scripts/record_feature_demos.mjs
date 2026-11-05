// Record short, real UI interactions. Only the marked intervals are exported;
// setup and completing earlier games remain outside the feature clips.
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createStaticServer } from './serve.mjs';
import { ACTIVITIES, getLearningActivity, getPetStats } from '../dist/core.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = resolve(dirname(fileURLToPath(import.meta.url)), '../demo/pitch');
await mkdir(join(output, 'source'), { recursive: true });
await mkdir(join(output, 'feature-posters'), { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'grandpals-features-'));
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
  const errors = [], features = [];
  page.on('pageerror', error => errors.push(error.message));
  const hold = ms => page.waitForTimeout(ms);
  const tap = async (selector, pause = 100) => { await page.locator(selector).tap(); await hold(pause); };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
  const record = async (id, title, action, seconds = 8) => {
    const start = elapsed();
    await action();
    await hold(Math.max(0, (seconds - elapsed() + start) * 1000));
    const end = elapsed();
    assert.ok(end - start <= 10, `${id} exceeded ten seconds`);
    const poster = `feature-posters/${id}.png`;
    await page.screenshot({ path: join(output, poster) });
    features.push({ id, title, start: Number(start.toFixed(3)), end: Number(end.toFixed(3)), speed: 1, poster });
    console.log(`Recorded ${id}: ${(end - start).toFixed(1)} seconds at normal speed.`);
  };
  const startTogether = async kind => {
    await tap('.nav-item[data-page="activities"]');
    await tap(`[data-action="together-mode"][data-kind="${kind}"]`);
    await tap('#together-setup-form button[type="submit"]');
    const title = await page.locator('#dialog-title').textContent();
    const activity = ACTIVITIES.find(item => title.includes(item.title));
    await tap('[data-action="session-start"]', 250);
    await page.locator('.prompt-text').scrollIntoViewIfNeeded();
    return getLearningActivity(activity.id, { age: 6, challenge: 1 });
  };
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
  await tap('.nav-item[data-page="settings"]');
  await page.locator('#learning-age').selectOption('6');
  await tap('#learning-form button[type="submit"]');

  const quiz = await startTogether('quiz');
  const correct = `[data-action="together-answer"][data-index="${quiz.questions[0].correct}"]`;
  await record('quiz-together', 'Quiz together: pick, pass, reveal', async () => {
    await hold(1200);
    await tap(correct, 1000);
    await tap(correct, 1800);
    await tap('[data-action="together-next"]', 800);
  });
  for (const question of quiz.questions.slice(1)) {
    await tap(`[data-action="together-answer"][data-index="${question.correct}"]`);
    await tap(`[data-action="together-answer"][data-index="${question.correct}"]`);
    await tap('[data-action="together-next"]');
  }
  await tap('[data-action="close-dialog"]');
  await startTogether('conversation');
  await record('talk-together', 'Conversation: a turn for each person', async () => {
    await hold(1700);
    await tap('[data-action="together-next"]', 2000);
    await tap('[data-action="together-next"]', 1300);
  });
  for (let step = 0; step < 6; step++) await tap('[data-action="together-next"]');
  await tap('[data-action="close-dialog"]');
  assert.equal(getPetStats(await state()).experience, 20);

  await tap('.nav-item[data-page="discover"]');
  await page.locator('[data-action="pet-ask"]').scrollIntoViewIfNeeded();
  await record('family-question', 'Weekly question: save a family story', async () => {
    await hold(700);
    await tap('[data-action="pet-ask"]', 1200);
    await tap('#dialog-root [data-action="pet-reply"]', 700);
    await page.locator('#pet-reply-text').fill('Let’s play pick-up sticks together.');
    await hold(800);
    await tap('#pet-reply-form button[type="submit"]', 1000);
  }, 9);
  assert.equal(getPetStats(await state()).experience, 35);
  await tap('[data-action="close-dialog"]');
  await page.locator('.pet-home').scrollIntoViewIfNeeded();
  await record('care-and-grow', 'Daily care: help Charlie grow', async () => {
    await hold(1000);
    await tap('[data-action="pet-feed"]', 3500);
  }, 7);
  assert.equal(getPetStats(await state()).experience, 38);
  assert.ok(await page.locator('[data-action="pet-feed"]').isDisabled());

  await tap('[data-action="storybook"]', 300);
  await record('monthly-storybook', 'Storybook: keep your shared moments', async () => {
    await hold(1400);
    await page.locator('.storybook-section').first().evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    await hold(1800);
    await page.locator('.storybook-story').first().evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await hold(1500);
  });
  assert.deepEqual(errors, []);
  const video = page.video();
  await context.close();
  context = null;
  await video.saveAs(join(output, 'source/features-mobile.webm'));
  await writeFile(join(output, 'source/features-scenes.json'), JSON.stringify({
    recordedAt: new Date().toISOString(), source: 'source/features-mobile.webm',
    sampleData: 'Alex and Gran are sample nicknames. The family reply is illustrative. No conversations or voices are recorded.',
    features,
  }, null, 2));
  console.log('Saved five feature demos. Native story saving, shared turns, and daily growth verified.');
} finally {
  await context?.close();
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
