// Capture real app screens using a fresh local demo, never the user's browser.
// Optional tool: PLAYWRIGHT_MODULE can point to a temporary Playwright install.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createStaticServer } from './serve.mjs';
import { ACTIVITIES, getLearningActivity, getPetStats } from '../dist/core.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'demo/pitch/stills');
await mkdir(output, { recursive: true });
const server = createStaticServer();
let browser;
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'en-SG',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const tap = async selector => { await page.locator(selector).tap(); await page.waitForTimeout(120); };
  const modalTop = async () => page.locator('.modal').evaluate(element => { element.scrollTop = 0; });
  const shots = [];
  const capture = async (name, description, pause = 400) => {
    await page.waitForTimeout(pause);
    await page.screenshot({ path: join(output, `${name}.png`) });
    shots.push({ file: `${name}.png`, description, width: 780, height: 1688 });
    console.log(`Captured ${name}`);
  };
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
  await capture('01-home', 'Charlie at home: the starting point for shared play.');
  await tap('.nav-item[data-page="activities"]');
  await page.locator('.activity-card').first().scrollIntoViewIfNeeded();
  await capture('02-games', 'Eight ways to play, with Pick Up Sticks first.');
  await tap('[data-action="together-mode"][data-kind="sticks"]');
  await capture('03-play-together', 'Two nicknames, one shared device; no account needed.');
  await tap('#together-setup-form button[type="submit"]');
  await page.locator('.sticks-howto-art').scrollIntoViewIfNeeded();
  await capture('04-how-to-play', 'An illustrated explanation of which stick lies on top.');
  await tap('[data-action="session-start"]');
  await page.locator('.sticks-board-viewport').scrollIntoViewIfNeeded();
  await page.locator('.stick-on-table').last().locator('.stick-label').tap();
  await capture('05-pick-up-sticks', 'A real nine-stick pile, with a selected top stick.');
  for (let index = 0; index < 9; index++) {
    if (index) await page.locator('.stick-on-table').last().locator('.stick-label').tap();
    await tap('[data-action="stick-pick"]');
    if (index === 1 || index === 4) await tap('[data-action="stick-pass"]');
  }
  await page.getByText('MISSION COMPLETE', { exact: true }).waitFor();
  await modalTop();
  await capture('06-mission-complete', 'A completed game, individual stick scores, and a shared reward.');
  await tap('[data-action="close-dialog"]');
  await tap('.nav-item[data-page="circle"]');
  await page.locator('.together-history').scrollIntoViewIfNeeded();
  await capture('07-shared-moments', 'The completed game and the pair’s scores are saved locally.');
  await tap('.nav-item[data-page="discover"]');
  await tap('[data-action="pet-ask"]');
  await modalTop();
  await capture('08-family-question', 'Charlie’s weekly question invites a family conversation.');
  await tap('#dialog-root [data-action="pet-reply"]');
  await page.locator('#pet-reply-text').fill('I would love to teach you pick-up sticks. We used to play it after school.');
  await capture('09-family-reply', 'An illustrative sample reply, typed into the real story form.');
  await tap('#pet-reply-form button[type="submit"]');
  await page.getByText('A FAMILY STORY SAVED', { exact: true }).waitFor();
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
  assert.equal(getPetStats(state).experience, 25, 'The actual Save story button awards story growth.');
  await tap('[data-action="close-dialog"]');
  await tap('[data-action="pet-feed"]');
  // Earn level two through actual UI play, rather than editing the save file.
  for (let round = 0; round < 2; round++) {
    await tap('.nav-item[data-page="activities"]');
    await tap('[data-action="together-mode"][data-kind="quiz"]');
    await tap('#together-setup-form button[type="submit"]');
    const title = await page.locator('#dialog-title').textContent();
    const activity = ACTIVITIES.find(item => title.includes(item.title));
    assert.ok(activity?.kind === 'quiz');
    const questions = getLearningActivity(activity.id, { age: 12, challenge: 1 }).questions;
    await tap('[data-action="session-start"]');
    for (const question of questions) {
      await tap(`[data-action="together-answer"][data-index="${question.correct}"]`);
      await tap(`[data-action="together-answer"][data-index="${question.correct}"]`);
      await tap('[data-action="together-next"]');
    }
    await tap('[data-action="close-dialog"]');
  }
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
  assert.equal(getPetStats(state).level, 2);
  await tap('.nav-item[data-page="settings"]');
  await capture('10-settings', 'Age group and challenge controls live outside the play screens.');
  await tap('[data-action="characters"]');
  await capture('11-charlie-growth', 'Charlie at level two, earned through play, care, and a sample story.');
  await tap('.nav-item[data-page="discover"]');
  await tap('[data-action="storybook"]');
  await capture('12-storybook', 'A printable monthly storybook keeps games and family stories together.');
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
    storageState: await context.storageState(), locale: 'en-SG',
  });
  const wide = await desktop.newPage();
  await wide.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
  await wide.screenshot({ path: join(output, '13-desktop-home.png') });
  shots.push({ file: '13-desktop-home.png', description: 'Desktop overview of Charlie and the family story loop.', width: 1440, height: 1000 });
  await tap('.points-pill');
  await page.locator('.reward-card').first().evaluate(element => element.scrollIntoView({ block: 'center' }));
  const pointsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')).points);
  await capture('18-rewards', 'Choose a sample tea voucher, redeemable for 60 earned points.');
  await tap('[data-action="redeem"][data-id="tea"]');
  await tap('[data-action="redeem-confirm"][data-id="tea"]');
  const redeemed = await page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
  assert.equal(redeemed.points, pointsBefore - 60);
  assert.equal(redeemed.redemptions[0].code, 'DEMO-TEA-0001');
  await page.waitForTimeout(250);
  await capture('19-redeem-reward', 'The gift opens as the 60-point reward exchange succeeds.', 0);
  await page.waitForTimeout(1800);
  await capture('20-reward-voucher', 'The revealed sample voucher, its code, and the remaining point balance.');
  await tap('[data-action="reward-view"]');
  assert.deepEqual(errors, []);
  await writeFile(join(output, 'manifest.json'), JSON.stringify({
    capturedAt: new Date().toISOString(), source: 'Actual local app in Chromium; smartphone viewport emulation.',
    sampleData: 'Alex and Gran are illustrative nicknames. The family reply is written sample text, not a real participant’s story.',
    screenshots: shots,
  }, null, 2));
  console.log(`Captured ${shots.length} pitch stills. Verified: browser errors absent, story saved via its button, level two earned through the UI.`);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
