// A deliberately limited revision: never run the full media generators here.
// Existing source recordings, posters, and every other image/video stay intact.
import { copyFile, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createStaticServer } from './serve.mjs';
import { getPetStats } from '../dist/core.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'demo/pitch');
const temporary = await mkdtemp(join(tmpdir(), 'grandpals-selected-revision-'));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const rewardOnly = process.argv.includes('--reward-only');
const allowed = new Set([
  'stills/01-home.png', 'videos/care-and-grow.mp4',
  'videos/family-question.mp4', 'videos/charlie-evolution.mp4',
  'videos/reward-redemption.mp4',
].map(file => join(output, file)));
const media = /\.(png|jpe?g|gif|svg|webp|avif|mp4|webm|mov|m4v|mp3|wav|m4a)$/i;
async function hashes(directory) {
  const result = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) for (const pair of await hashes(path)) result.set(...pair);
    else if (media.test(entry.name) && !allowed.has(path)) {
      result.set(path, createHash('sha256').update(await readFile(path)).digest('hex'));
    }
  }
  return result;
}
const protectedMedia = await hashes(join(root, 'demo'));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = createStaticServer();
let browser, context;
const features = [];
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
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const hold = ms => page.waitForTimeout(ms);
  const tap = async (selector, pause = 120) => { await page.locator(selector).tap(); await hold(pause); };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
  const record = async (id, title, seconds, action) => {
    const start = elapsed();
    await action();
    await hold(Math.max(0, (seconds - elapsed() + start) * 1000));
    const end = elapsed();
    assert.ok(end - start < 10, `${id}: action exceeded the clip duration`);
    features.push({ id, title, start, end });
    console.log(`Recorded ${id}: ${(end - start).toFixed(1)} seconds.`);
  };
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
  await hold(400);
  // The stray floor sprig is absent; Charlie's own head ornament stays attached.
  assert.equal(await page.locator('.charlie-art path[d^="M37 192"]').count(), 0);
  assert.equal(await page.locator('.charlie-head .charlie-leaf').count(), 1);
  if (!rewardOnly) await page.screenshot({ path: join(temporary, '01-home.png') });
  for (let game = 0; game < 2; game++) {
    await tap('.nav-item[data-page="activities"]');
    await tap('[data-action="together-mode"][data-kind="conversation"]');
    await tap('#together-setup-form button[type="submit"]');
    await tap('[data-action="session-start"]');
    for (let turn = 0; turn < 8; turn++) await tap('[data-action="together-next"]');
    await tap('[data-action="close-dialog"]');
  }
  assert.equal(getPetStats(await state()).experience, 20);
  assert.equal((await state()).points, 60);
  if (!rewardOnly) {
    await tap('.nav-item[data-page="discover"]');
    await page.locator('[data-action="pet-ask"]').scrollIntoViewIfNeeded();
    await record('family-question', 'Weekly question: save a family story', 9, async () => {
      await hold(700);
      await tap('[data-action="pet-ask"]', 1200);
      await tap('#dialog-root [data-action="pet-reply"]', 700);
      await page.locator('#pet-reply-text').fill('Let’s play pick-up sticks together.');
      await hold(800);
      await tap('#pet-reply-form button[type="submit"]', 1000);
    });
    assert.equal(getPetStats(await state()).experience, 35);
    await tap('[data-action="close-dialog"]');
    await page.locator('.pet-home').scrollIntoViewIfNeeded();
    await record('care-and-grow', 'Daily care: help Charlie grow', 7, async () => {
      await hold(1000);
      await tap('[data-action="pet-feed"]', 3500);
    });
    assert.equal(getPetStats(await state()).experience, 38);
    assert.ok(await page.locator('[data-action="pet-feed"]').isDisabled());
  }
  await tap('.points-pill');
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(1500);
  await record('reward-redemption', 'Rewards: redeem a sample voucher', 9.5, async () => {
    await hold(400);
    await page.locator('.reward-card').first().evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await hold(700);
    await tap('[data-action="redeem"][data-id="tea"]', 1100);
    await tap('[data-action="redeem-confirm"][data-id="tea"]', 500);
    assert.equal((await state()).points, 0);
    assert.equal((await state()).redemptions[0].code, 'DEMO-TEA-0001');
    await hold(1500);
    await tap('[data-action="reward-view"]', 100);
    // Show the zero balance before scrolling to the issued sample voucher.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await hold(700);
    await page.locator('.voucher-item').evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await hold(600);
    assert.match(await page.locator('.voucher-item').innerText(), /Demo only · no cash value/);
  });
  // Leave the issued code unobscured after the normal notification disappears.
  await hold(1800);
  await page.screenshot({ path: join(temporary, 'reward-end.png') });
  assert.deepEqual(errors, []);
  const video = page.video();
  await context.close();
  context = null;
  await video.saveAs(join(temporary, 'selected-mobile.webm'));
} finally {
  await context?.close();
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

function run(args) {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
}
async function captionFilter(id, title) {
  const caption = join(temporary, `${id}.txt`);
  await writeFile(caption, title.replace(':', ' ·'));
  return `pad=iw:ih+48:0:48:color=0x204a36,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${caption}:fontcolor=white:fontsize=14:x=(w-text_w)/2:y=15`;
}
async function encode(id, input, filters) {
  const file = join(temporary, `${id}.mp4`);
  run(['-y', '-hide_banner', '-loglevel', 'error', '-i', input, ...filters,
    '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-r', '30', '-movflags', '+faststart', file]);
  run(['-hide_banner', '-loglevel', 'error', '-i', file, '-f', 'null', '-']);
  const probe = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const duration = probe.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  assert.ok(duration && probe.stderr.includes('Video: h264') && probe.stderr.includes('390x892') && !probe.stderr.includes('Audio:'));
  const seconds = Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
  assert.ok(seconds >= 5 && seconds <= 10);
  return { file: `videos/${id}.mp4`, width: 390, height: 892, codec: 'H.264', silent: true, durationSeconds: seconds, speed: 1 };
}
const revisions = [];
for (const feature of features) {
  const filter = `trim=start=${feature.start}:end=${feature.end},setpts=PTS-STARTPTS,${await captionFilter(feature.id, feature.title)}`;
  revisions.push({ ...await encode(feature.id, join(temporary, 'selected-mobile.webm'), ['-vf', filter]), title: feature.title,
    capture: 'Fresh isolated browser session; two real completed games earn 60 points. Sample family reply and demo voucher.' });
}
const evolution = JSON.parse(await readFile(join(output, 'source/evolution-scenes.json'), 'utf8'));
const parts = evolution.scenes.slice(1);
assert.equal(parts.length, 2);
const cuts = parts.map((part, i) => `[0:v]trim=start=${part.start}:end=${part.end},setpts=PTS-STARTPTS[p${i}]`).join(';');
const concat = `${parts.map((_, i) => `[p${i}]`).join('')}concat=n=${parts.length}:v=1:a=0,${await captionFilter('evolution', 'Charlie evolves through shared play')}[out]`;
if (!rewardOnly) revisions.push({ ...await encode('charlie-evolution', join(output, evolution.source), ['-filter_complex', `${cuts};${concat}`, '-map', '[out]']),
  title: 'Charlie evolves through shared play', poster: 'stills/15-little-explorer.png',
  sourceScenes: parts, earnedThrough: evolution.earnedThrough });

// Publish only the four specifically allowed existing files and the new MP4.
await mkdir(join(output, 'videos'), { recursive: true });
if (!rewardOnly) await copyFile(join(temporary, '01-home.png'), join(output, 'stills/01-home.png'));
for (const video of revisions) {
  assert.ok(allowed.has(join(output, video.file)));
  await copyFile(join(temporary, video.file.replace('videos/', '')), join(output, video.file));
}
const manifest = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
for (const video of revisions) {
  const index = manifest.videos.findIndex(existing => existing.file === video.file);
  if (index === -1) manifest.videos.push(video);
  else manifest.videos[index] = video;
}
manifest.generatedAt = new Date().toISOString();
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
const videoCard = video => `<article><h2>${video.title}</h2><p>${video.durationSeconds.toFixed(1)} seconds · ${video.width} × ${video.height} · silent MP4</p><video controls playsinline preload="metadata" ${video.poster ? `poster="${video.poster}"` : ''}><source src="${video.file}" type="video/mp4"></video><p><a href="${video.file}" download>Download MP4</a></p></article>`;
let gallery = await readFile(join(output, 'index.html'), 'utf8');
for (const video of revisions) {
  const previous = gallery.match(/<article>\s*<h2>[\s\S]*?<\/article>/g)?.find(card => card.includes(`src="${video.file}"`));
  if (previous) gallery = gallery.replace(previous, videoCard(video));
  else gallery = gallery.replace('</div><p class="note">', `${videoCard(video)}</div><p class="note">`);
}
await writeFile(join(output, 'index.html'), gallery);
let readme = await readFile(join(output, 'README.md'), 'utf8');
readme = readme.replace(/(\[Charlie evolves through shared play\]\(videos\/charlie-evolution.mp4\)：)[\d.]+秒/, `$1${manifest.videos.find(video => video.file === 'videos/charlie-evolution.mp4').durationSeconds.toFixed(1)}秒`)
  .replace('進化ハイライトは30・80・180成長ポイントでの変身3回を等速で抜粋しています。', '進化ハイライトは最初の変身を除き、80・180成長ポイントでの変身2回を等速で抜粋しています。');
if (!readme.includes('videos/reward-redemption.mp4')) readme = readme.replace('- スマホ画像', '- [特典交換デモ](videos/reward-redemption.mp4)：9.5秒、1倍速、MP4。60ポイントからサンプル券の発行まで（実店舗では利用不可）。\n- スマホ画像');
if (!readme.includes('revise_selected_pitch_media.mjs')) readme += '\n指定素材だけの撮り直しには scripts/revise_selected_pitch_media.mjs を使用。元動画・既存ポスター・他の動画画像は保持します。\n';
await writeFile(join(output, 'README.md'), readme);
assert.deepEqual(await hashes(join(root, 'demo')), protectedMedia, 'A protected media file changed.');
console.log(JSON.stringify({ temporary, videos: revisions, protectedMediaUnchanged: protectedMedia.size }, null, 2));
