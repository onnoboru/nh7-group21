// Verify and capture the reward animation without changing existing pitch media.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pitch = join(root, 'demo/pitch');
const temporary = await mkdtemp(join(tmpdir(), 'grandpals-reward-animation-'));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const filename = 'reward-redemption-celebration.mp4';
const allowed = new Set(['', 'desktop'].map(variant => join(pitch, variant, 'videos', filename)));
async function hashes(directory) {
  const result = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) for (const pair of await hashes(path)) result.set(...pair);
    else if (/\.(png|jpe?g|svg|webp|mp4|webm|mov|mp3|wav)$/i.test(entry.name) && !allowed.has(path)) {
      result.set(path, createHash('sha256').update(await readFile(path)).digest('hex'));
    }
  }
  return result;
}
function run(args) {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
}
const protectedMedia = await hashes(join(root, 'demo'));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = createStaticServer();
let browser;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  browser = await chromium.launch({ headless: true });
  for (const desktop of [false, true]) {
    const context = await browser.newContext({
      viewport: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 },
      deviceScaleFactor: desktop ? 1 : 2, isMobile: !desktop, hasTouch: !desktop,
      locale: 'en-SG', recordVideo: { dir: temporary, size: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 } },
    });
    const clock = performance.now();
    const page = await context.newPage();
    const elapsed = () => (performance.now() - clock) / 1000;
    const hold = ms => page.waitForTimeout(ms);
    const click = async (selector, delay = 80) => { await page.locator(selector).click(); await hold(delay); };
    const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const earn = async () => {
      for (let game = 0; game < 2; game++) {
        await click('.nav-item[data-page="activities"]');
        await click('[data-action="together-mode"][data-kind="conversation"]');
        await click('#together-setup-form button[type="submit"]');
        await click('[data-action="session-start"]');
        for (let turn = 0; turn < 8; turn++) await click('[data-action="together-next"]');
        await click('[data-action="close-dialog"]');
      }
      assert.equal((await state()).points, 60);
      await click('.points-pill');
      await click('[data-action="redeem"][data-id="tea"]');
      await hold(900);
    };
    let start, end;
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
      await earn();
      start = elapsed();
      await hold(700);
      await click('[data-action="redeem-confirm"][data-id="tea"]', 100);
      assert.equal((await state()).points, 0);
      assert.equal((await state()).redemptions.length, 1);
      assert.equal(await page.locator('.reward-ticket').evaluate(element => getComputedStyle(element).animationName), 'reward-ticket-arrive');
      assert.ok(await page.locator('.reward-ticket').evaluate(element => element.getAnimations().some(animation => animation.playState === 'running')));
      assert.equal(await page.evaluate(() => document.activeElement?.dataset.action), 'reward-view');
      await hold(2100);
      assert.ok(await page.locator('.modal').evaluate(element => element.scrollHeight <= element.clientHeight + 2), 'Reward result fits without scrolling.');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: join(temporary, `${desktop ? 'desktop' : 'mobile'}-reward-ready.png`) });
      await hold(700);
      await click('[data-action="reward-view"]');
      assert.equal(await page.locator('.reward-celebration').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'DEMO-TEA-0001');
      await hold(Math.max(0, (8 - elapsed() + start) * 1000));
      end = elapsed();
      await hold(800);
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('.reward-celebration').count(), 0);
      assert.equal((await state()).points, 0);
      assert.equal((await state()).redemptions.length, 1);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await earn();
      await click('[data-action="redeem-confirm"][data-id="tea"]');
      assert.equal(await page.locator('.reward-gift').evaluate(element => getComputedStyle(element).display), 'none');
      assert.equal(await page.locator('.reward-ticket').evaluate(element => getComputedStyle(element).animationName), 'none');
      assert.equal(await page.locator('.reward-ticket').evaluate(element => getComputedStyle(element).opacity), '1');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.reward-celebration').count(), 0);
      assert.equal((await state()).redemptions.length, 2);
      assert.deepEqual(errors, []);
      const video = page.video();
      await context.close();
      const raw = join(temporary, `${desktop ? 'desktop' : 'mobile'}.webm`);
      await video.saveAs(raw);
      const output = join(pitch, desktop ? 'desktop' : '');
      const file = join(output, 'videos', filename);
      run(['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-vf', `trim=start=${start}:end=${end},setpts=PTS-STARTPTS`,
        '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', file]);
      run(['-hide_banner', '-loglevel', 'error', '-i', file, '-f', 'null', '-']);
      const galleryPath = join(output, 'index.html');
      let gallery = await readFile(galleryPath, 'utf8');
      if (!gallery.includes(`src="videos/${filename}"`)) gallery = gallery.replace('<h2 class="section-title">Feature demos', `<section><h2>Reward celebration · 1×</h2><video controls playsinline preload="metadata"><source src="videos/${filename}" type="video/mp4"></video><a href="videos/${filename}" download>Download animation demo</a></section><h2 class="section-title">Feature demos`);
      // Desktop gallery has a different section heading.
      if (!gallery.includes(`src="videos/${filename}"`)) gallery = gallery.replace('<h2>Videos ·', `<section><h2>Reward celebration · 1×</h2><video controls playsinline preload="metadata"><source src="videos/${filename}" type="video/mp4"></video><a href="videos/${filename}" download>Download animation demo</a></section><h2>Videos ·`);
      assert.ok(gallery.includes(`src="videos/${filename}"`));
      await writeFile(galleryPath, gallery);
      const manifestPath = join(output, 'manifest.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      manifest.previews = [...(manifest.previews ?? []).filter(preview => preview.file !== `videos/${filename}`), { file: `videos/${filename}`, title: 'Reward redemption with gift animation', speed: 1, silent: true, width: desktop ? 1920 : 390, height: desktop ? 1080 : 844 }];
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      const readmePath = join(output, 'README.md');
      const readme = await readFile(readmePath, 'utf8');
      if (!readme.includes(filename)) await writeFile(readmePath, `${readme}\n- [特典交換のアニメーション付きデモ](videos/${filename})：約8秒、1倍速、無音MP4。既存動画は保持しています。\n`);
      console.log(`Verified ${desktop ? 'desktop' : 'mobile'}: gift animation, result layout, focus, balance, persistence, reduced motion. ${file}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
assert.deepEqual(await hashes(join(root, 'demo')), protectedMedia, 'An existing media file changed.');
console.log(JSON.stringify({ temporary, existingMediaUnchanged: protectedMedia.size }, null, 2));
