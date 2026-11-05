// Record the real app in a fresh mobile browser. Playwright is an optional
// recording tool; it is not added to the app's runtime dependencies.
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createStaticServer } from './serve.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'demo');
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'grandpals-mobile-video-'));
const server = createStaticServer();
let browser;
let context;
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'en-SG',
    recordVideo: { dir: temporary, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  const recordingStarted = performance.now();
  const elapsed = () => (performance.now() - recordingStarted) / 1000;
  const scenes = [];
  const mark = (name, start, end = elapsed()) => scenes.push({ name, start: Number(start.toFixed(3)), end: Number(end.toFixed(3)) });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // A tap indicator helps viewers follow the actual touch events.
  await page.addInitScript(() => {
    document.addEventListener('pointerdown', event => {
      const dot = document.createElement('div');
      Object.assign(dot.style, {
        position: 'fixed', left: `${event.clientX - 17}px`, top: `${event.clientY - 17}px`,
        width: '34px', height: '34px', borderRadius: '50%',
        border: '3px solid #dc855d', background: '#ffffff66',
        pointerEvents: 'none', zIndex: '9999',
      });
      document.body.append(dot);
      dot.animate([{ opacity: 1, transform: 'scale(.7)' }, { opacity: 0, transform: 'scale(1.8)' }], { duration: 650 });
      setTimeout(() => dot.remove(), 650);
    }, true);
  });
  const hold = ms => page.waitForTimeout(ms);
  const tap = async (locator, pause = 800) => {
    await locator.scrollIntoViewIfNeeded();
    await hold(250);
    await locator.tap();
    await hold(pause);
  };
  const scrollTo = async locator => {
    await locator.evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await hold(900);
  };
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
  await page.locator('.pet-home').waitFor();
  await hold(1800);
  mark('Home', elapsed() - 1.5);
  const playBounds = await page.locator('.pet-home [data-action="activities"]').boundingBox();
  assert.ok(playBounds && playBounds.y + playBounds.height < 764, 'Play action is visible without scrolling.');
  await page.screenshot({ path: join(output, 'pick-up-sticks-mobile-home.png') });
  console.log('Home: mobile viewport 390 × 844.');
  await tap(page.locator('.nav-item[data-page="activities"]'), 1100);
  const play = page.locator('[data-action="together-mode"][data-kind="sticks"]');
  await scrollTo(play);
  mark('Choose a game', elapsed() - .75);
  await tap(play, 1300);
  mark('Two players', elapsed() - 1.1);
  await tap(page.locator('#together-setup-form button[type="submit"]'), 1000);
  await scrollTo(page.locator('.sticks-howto-art'));
  await hold(1800);
  mark('How to play', elapsed() - 1.7);
  await tap(page.locator('[data-action="session-start"]'), 1200);
  await scrollTo(page.locator('.sticks-board-viewport'));
  await page.screenshot({ path: join(output, 'pick-up-sticks-mobile-poster.png') });
  console.log('Game started: nine sticks, fresh browser data.');
  // Show the larger board, then return to the overview before picking.
  await tap(page.locator('[data-action="stick-zoom"]'), 1000);
  await tap(page.locator('[data-action="stick-zoom"]'), 700);
  let firstPicksStart;
  let finalPickStart;
  for (let index = 0; index < 9; index++) {
    if (index === 0) firstPicksStart = elapsed();
    if (index === 8) finalPickStart = elapsed();
    // The last rendered stick is physically on top. Select its endpoint using
    // the real touch handler, rather than changing game state or calling APIs.
    await tap(page.locator('.stick-on-table').last().locator('.stick-label'), 450);
    await tap(page.locator('[data-action="stick-pick"]'), 650);
    if (index === 1 || index === 4) await tap(page.locator('[data-action="stick-pass"]'), 600);
    if (index === 1) mark('Play and pass the turn', firstPicksStart);
  }
  await page.getByText('MISSION COMPLETE', { exact: true }).waitFor();
  await page.locator('.modal').evaluate(element => { element.scrollTop = 0; });
  const completionFits = await page.locator('.compact-completion-modal').evaluate(element => element.scrollHeight <= element.clientHeight + 2);
  assert.ok(completionFits, 'The simplified result fits without scrolling.');
  await hold(1800);
  mark('Final stick and reward', finalPickStart);
  await page.screenshot({ path: join(output, 'pick-up-sticks-mobile-complete.png') });
  const result = await page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
  assert.equal(result.points, 30);
  assert.equal(result.reviews[0].activityId, 'pick-up-sticks');
  assert.equal(result.reviews[0].stickCount, 9);
  assert.deepEqual(errors, [], 'Browser JavaScript errors');
  const video = page.video();
  await context.close();
  context = null;
  const destination = join(output, 'pick-up-sticks-mobile.webm');
  await video.saveAs(destination);
  await writeFile(join(output, 'pick-up-sticks-scenes.json'), JSON.stringify({ recordedAt: new Date().toISOString(), source: 'pick-up-sticks-mobile.webm', scenes, highlightSpeed: 1 }, null, 2));
  console.log(`Recorded ${destination}`);
  console.log('Verified: all nine sticks collected, one 30-point award, no browser JavaScript errors.');
} finally {
  await context?.close();
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
