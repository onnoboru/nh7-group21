// Record reward clips using visible sync slates outside the exported intervals.
// FFmpeg locates the actual source frames, avoiding UI-clock/screencast drift.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.env.PITCH_MEDIA_ROOT || join(root, 'demo/pitch'));
const temporary = await mkdtemp(join(tmpdir(), 'grandpals-confetti-'));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ids = ['reward-redemption', 'reward-redemption-celebration'];
const allowed = new Set(['phone', 'desktop'].flatMap(variant => [
  ...ids.map(id => join(output, `videos_${variant}`, `${id}.mp4`)),
  ...ids.map(id => join(output, `images_${variant}`, 'posters', `${id}.png`)),
  ...['19-redeem-reward.png', '20-reward-voucher.png'].map(file => join(output, `images_${variant}`, file)),
  join(output, 'source', variant, `reward-confetti-${variant}.webm`),
]));
const digest = async path => createHash('sha256').update(await readFile(path)).digest('hex');
async function hashes(directory) {
  const result = new Map();
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) for (const pair of await hashes(path)) result.set(...pair);
    else if (/\.(png|jpe?g|svg|webp|mp4|webm|mov|mp3|wav)$/i.test(item.name) && !allowed.has(path)) result.set(path, await digest(path));
  }
  return result;
}
function run(args, loglevel = 'error') {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', loglevel, ...args], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stderr;
}
function blackSegments(file) {
  const log = run(['-i', file, '-vf', 'blackdetect=d=0.3:pix_th=0.04:pic_th=0.99', '-an', '-f', 'null', '-'], 'info');
  return [...log.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)]
    .map(match => ({ start: Number(match[1]), end: Number(match[2]), duration: Number(match[3]) }));
}
const protectedMedia = await hashes(output);
const appHashes = Object.fromEntries(await Promise.all(['dist/app.js', 'dist/core.js', 'dist/styles.css', 'dist/index.html'].map(async file => [file, await digest(join(root, file))])));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = createStaticServer();
const captures = [];
let browser;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  browser = await chromium.launch({ headless: true });
  for (const variant of ['phone', 'desktop']) {
    const desktop = variant === 'desktop';
    const folder = join(temporary, variant);
    await mkdir(folder);
    const context = await browser.newContext({ viewport: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 },
      deviceScaleFactor: desktop ? 1 : 2, isMobile: !desktop, hasTouch: !desktop, locale: 'en-SG', reducedMotion: 'no-preference',
      recordVideo: { dir: folder, size: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 } } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const hold = ms => page.waitForTimeout(ms);
    const click = async (selector, delay = 100) => { await page.locator(selector)[desktop ? 'click' : 'tap'](); await hold(delay); };
    const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
    const slate = async () => {
      await page.evaluate(async () => {
        const slate = document.createElement('div');
        slate.id = 'recording-sync';
        Object.assign(slate.style, { position: 'fixed', inset: '0', background: '#000', zIndex: '2147483647', pointerEvents: 'none' });
        document.body.append(slate);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await hold(850);
      await page.locator('#recording-sync').evaluate(element => element.remove());
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    const visiblePaper = () => page.locator('.reward-confetti span').evaluateAll(papers => {
      const container = papers[0].parentElement.getBoundingClientRect();
      return papers.filter(paper => {
        const rect = paper.getBoundingClientRect();
        return Number(getComputedStyle(paper).opacity) > .2 && rect.bottom > container.top && rect.top < container.bottom;
      }).length;
    });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
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
      if (!desktop) await page.locator('.reward-card').first().scrollIntoViewIfNeeded();
      await hold(700);
      await slate(); // First export segment: reward selection and confirmation.
      await hold(650);
      await click('[data-action="redeem"][data-id="tea"]', 800);
      assert.equal(await page.locator('[data-action="redeem-confirm"]').innerText(), 'Redeem');
      await slate(); // Second export segment: the complete uninterrupted effect.
      await hold(1100);
      await click('[data-action="redeem-confirm"][data-id="tea"]', 0);
      const confirmedAt = performance.now();
      assert.equal((await state()).points, 0);
      assert.equal((await state()).redemptions[0].code, 'DEMO-TEA-0001');
      assert.equal(await page.locator('.reward-confetti span').count(), 36);
      await hold(850);
      assert.ok(await visiblePaper() >= 12, 'Visible falling confetti must fill the result.');
      await hold(Math.max(0, 2300 - performance.now() + confirmedAt));
      assert.ok(await visiblePaper() >= 12, 'Confetti stays visible while the ticket is revealed.');
      assert.equal(await page.locator('.reward-ticket').evaluate(element => getComputedStyle(element).opacity), '1');
      assert.ok(await page.locator('.modal').evaluate(element => element.scrollHeight <= element.clientHeight + 2));
      // Keep the result still until BOTH output intervals have fully finished.
      await hold(Math.max(0, 10500 - performance.now() + confirmedAt));
      assert.equal(await page.locator('.reward-celebration').count(), 1);
      // Still captures happen AFTER the video intervals. Scrub only the visual
      // animations in this isolated browser so image capture never drops video frames.
      for (const [file, time] of [['19-redeem-reward.png', 800], ['20-reward-voucher.png', 2400]]) {
        await page.locator('.reward-reveal, .reward-confetti').evaluateAll(async (regions, time) => {
          for (const region of regions) for (const animation of region.getAnimations({ subtree: true })) {
            animation.pause(); animation.currentTime = time;
          }
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }, time);
        await page.screenshot({ path: join(folder, file) });
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.reward-confetti').evaluate(element => getComputedStyle(element).display), 'none');
      assert.equal(await page.locator('.reward-ticket').evaluate(element => getComputedStyle(element).animationName), 'none');
      assert.equal(await page.locator('.reward-ticket').evaluate(element => getComputedStyle(element).opacity), '1');
      await click('[data-action="reward-view"]');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'DEMO-TEA-0001');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('.reward-celebration').count(), 0);
      assert.equal((await state()).redemptions.length, 1);
      assert.deepEqual(errors, []);
      const video = page.video();
      await context.close();
      const raw = join(folder, `reward-confetti-${variant}.webm`);
      await video.saveAs(raw);
      const markers = blackSegments(raw).slice(-2);
      assert.equal(markers.length, 2, 'Both frame-accurate synchronization slates must be detected.');
      const lead = { start: markers[0].end + .12, end: markers[1].start - .08 };
      assert.ok(lead.end - lead.start > .5 && lead.end - lead.start < 3);
      const reveal = markers[1].end + .12;
      const videos = [];
      for (const id of ids) {
        const caption = join(folder, `${id}.txt`);
        await writeFile(caption, id.endsWith('celebration') ? 'Reward celebration · confetti' : 'Rewards · redeem and celebrate');
        const titleBand = desktop ? '' : `,pad=iw:ih+48:0:48:color=0x204a36,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${caption}:fontcolor=white:fontsize=14:x=(w-text_w)/2:y=15`;
        const parts = id.endsWith('celebration') ? [{ start: reveal, end: reveal + 9.5 }]
          : [lead, { start: reveal, end: reveal + 9.5 - lead.end + lead.start }];
        const trims = parts.map((part, i) => `[0:v]trim=start=${part.start}:end=${part.end},setpts=PTS-STARTPTS[p${i}]`).join(';');
        const filter = `${trims};${parts.map((_, i) => `[p${i}]`).join('')}concat=n=${parts.length}:v=1:a=0${titleBand}[out]`;
        const file = join(folder, `${id}.mp4`);
        run(['-y', '-i', raw, '-filter_complex', filter, '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', file]);
        run(['-i', file, '-f', 'null', '-']);
        assert.equal(blackSegments(file).length, 0, 'No sync slate is allowed in the exported movie.');
        const poster = join(folder, `${id}.png`);
        const posterTime = (parts.length === 2 ? lead.end - lead.start : 0) + 2.6;
        run(['-y', '-ss', String(posterTime), '-i', file, '-frames:v', '1', poster]);
        const log = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr;
        const duration = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
        assert.ok(duration && log.includes('Video: h264') && log.includes(desktop ? '1920x1080' : '390x892') && !log.includes('Audio:'));
        const seconds = Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
        assert.ok(seconds >= 9.4 && seconds <= 9.6);
        videos.push({ id, file, poster, parts, durationSeconds: seconds });
      }
      captures.push({ variant, folder, raw, markers, videos });
      console.log(`Verified ${variant}: visible confetti, complete gift opening, stable result, frame-accurate cuts, reduced motion.`);
    } finally { await context.close(); }
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

const manifestPath = join(output, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
let gallery = await readFile(join(output, 'index.html'), 'utf8');
const capturedAt = new Date().toISOString();
for (const capture of captures) {
  const { variant, folder, raw, markers, videos } = capture;
  const source = `source/${variant}/${basename(raw)}`;
  await copyFile(raw, join(output, source));
  for (const video of videos) {
    const existing = manifest.videos.find(item => item.variant === variant && item.file.endsWith(`/${video.id}.mp4`));
    assert.ok(existing);
    await copyFile(video.file, join(output, existing.file));
    await copyFile(video.poster, join(output, existing.poster));
    delete existing.sourceScene;
    Object.assign(existing, { durationSeconds: video.durationSeconds, source, sourceScenes: video.parts, capturedAt, appHashes,
      capture: 'Frame-aligned recording of confirmation, full gift opening and falling confetti. Result remains visible to the end.' });
    // Bust cached posters and MP4s while keeping the expected file names.
    const version = (await digest(join(output, existing.file))).slice(0, 12);
    for (const path of [existing.file, existing.poster]) {
      const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      gallery = gallery.replace(new RegExp(`((?:src|href|poster)="${escaped})(?:\\?v=[^" ]*)?("|$)`, 'g'), `$1?v=${version}$2`);
    }
    gallery = gallery.replace(/<article>[\s\S]*?<\/article>/g, card => card.includes(`src="${existing.file}?`) ? card.replace(/<p>[\s\S]*?<\/p>/, `<p>${video.durationSeconds.toFixed(1)} s · 1× · ${existing.width} × ${existing.height} · confetti</p>`) : card);
  }
  for (const [file, description] of [['19-redeem-reward.png', 'The gift opens with a shower of colourful confetti.'], ['20-reward-voucher.png', 'The revealed voucher, updated balance and falling confetti.']]) {
    const relative = `images_${variant}/${file}`;
    await copyFile(join(folder, file), join(output, relative));
    const image = manifest.images.find(item => item.file === relative);
    Object.assign(image, { description, capturedAt, appHashes });
    const version = (await digest(join(output, relative))).slice(0, 12);
    const escaped = relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    gallery = gallery.replace(new RegExp(`((?:src|href)="${escaped})(?:\\?v=[^" ]*)?("|$)`, 'g'), `$1?v=${version}$2`);
    gallery = gallery.replace(/<article>[\s\S]*?<\/article>/g, card => card.includes(`src="${relative}?`) ? card.replace(/<p>[\s\S]*?<\/p>/, `<p>${description}</p>`).replace(/alt="[^"]*"/, `alt="${description}"`) : card);
  }
  await writeFile(join(output, 'source', variant, 'reward-confetti-scenes.json'), JSON.stringify({ capturedAt, source, markers, appHashes,
    clips: videos.map(({ id, parts, durationSeconds }) => ({ id, parts, durationSeconds })) }, null, 2));
}
manifest.rewardUpdatedAt = capturedAt;
await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
await writeFile(join(output, 'index.html'), gallery);
const readmePath = join(output, 'README.md');
const readme = await readFile(readmePath, 'utf8');
if (!readme.includes('refresh_reward_confetti.mjs')) await writeFile(readmePath, `${readme}\n特典交換の2種類の動画は約9.5秒に更新。ギフト開封・紙吹雪・完了画面まで画面を切り替えずに収録しています。特典だけの再撮影は scripts/refresh_reward_confetti.mjs。録画の同期用スレートは書き出しに含めません。\n`);
assert.deepEqual(await hashes(output), protectedMedia, 'An unrelated media file changed.');
console.log(JSON.stringify({ temporary, updatedVideos: captures.flatMap(capture => capture.videos.map(video => `videos_${capture.variant}/${video.id}.mp4`)), protectedMediaUnchanged: protectedMedia.size }, null, 2));
