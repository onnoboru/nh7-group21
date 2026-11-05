// Refresh only reward-related assets, including the existing 18/19/20 filenames.
// No shared source recording or unrelated pitch image/video is overwritten.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pitch = join(root, 'demo/pitch');
const temporary = await mkdtemp(join(tmpdir(), 'grandpals-reward-refresh-'));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const shots = [
  { file: '18-rewards.png', description: 'Choose a sample tea voucher using 60 points earned through two shared games.' },
  { file: '19-redeem-reward.png', description: 'The gift opens as the 60-point reward exchange succeeds.' },
  { file: '20-reward-voucher.png', description: 'The revealed sample voucher, its code, and the updated zero-point balance.' },
];
const allowed = new Set(['', 'desktop'].flatMap(variant => [
  ...shots.map(shot => `stills/${shot.file}`),
  'videos/reward-redemption.mp4', 'videos/reward-redemption-celebration.mp4',
  'source/reward-redemption.webm',
  ...(variant ? ['posters/reward-redemption.png'] : []),
].map(file => join(pitch, variant, file))));
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
const captures = [];
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  browser = await chromium.launch({ headless: true });
  for (const desktop of [false, true]) {
    const variant = desktop ? 'desktop' : 'mobile';
    const folder = join(temporary, variant);
    await mkdir(folder);
    const context = await browser.newContext({
      viewport: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 },
      deviceScaleFactor: desktop ? 1 : 2, isMobile: !desktop, hasTouch: !desktop, locale: 'en-SG',
      recordVideo: { dir: folder, size: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 } },
    });
    const clock = performance.now();
    const page = await context.newPage();
    const elapsed = () => (performance.now() - clock) / 1000;
    const hold = ms => page.waitForTimeout(ms);
    const checkButtons = async () => {
      const longLabels = await page.locator('button:visible:not(.quiz-option)').evaluateAll(buttons => buttons
        .map(button => button.textContent.trim())
        .filter(label => (label.match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || []).length > 2));
      assert.deepEqual(longLabels, [], 'Action buttons use at most two words.');
    };
    const click = async (selector, delay = 100) => { await page.locator(selector).click(); await hold(delay); await checkButtons(); };
    const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
      await checkButtons();
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
      await page.evaluate(() => window.scrollTo(0, 0));
      await hold(1500);
      const start = elapsed();
      await hold(500);
      if (!desktop) await page.locator('.reward-card').first().evaluate(element => element.scrollIntoView({ block: 'center' }));
      await hold(300);
      await page.screenshot({ path: join(folder, shots[0].file) });
      await click('[data-action="redeem"][data-id="tea"]', 800);
      assert.equal(await page.locator('[data-action="redeem-confirm"]').innerText(), 'Redeem');
      assert.equal(await page.locator('#dialog-root .button[data-action="close-dialog"]').innerText(), 'Cancel');
      const celebrationStart = elapsed() - .5;
      await click('[data-action="redeem-confirm"][data-id="tea"]', 0);
      assert.equal((await state()).points, 0);
      assert.equal((await state()).redemptions[0].code, 'DEMO-TEA-0001');
      await hold(400);
      assert.ok(await page.locator('.reward-gift-box').evaluate(element => Number(getComputedStyle(element).opacity) > .1));
      await page.screenshot({ path: join(folder, shots[1].file) });
      await hold(1800);
      assert.equal(await page.locator('.reward-ticket').evaluate(element => getComputedStyle(element).opacity), '1');
      assert.ok(await page.locator('.modal').evaluate(element => element.scrollHeight <= element.clientHeight + 2));
      await page.screenshot({ path: join(folder, shots[2].file) });
      await hold(700);
      await click('[data-action="reward-view"]');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'DEMO-TEA-0001');
      const end = Math.max(start + 9.5, celebrationStart + 8);
      await hold(Math.max(0, (end - elapsed()) * 1000));
      await hold(1000);
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal((await state()).points, 0);
      assert.equal((await state()).redemptions.length, 1);
      assert.equal(await page.locator('.reward-celebration').count(), 0);
      assert.deepEqual(errors, []);
      const video = page.video();
      await context.close();
      const raw = join(folder, 'reward-redemption.webm');
      await video.saveAs(raw);
      const caption = join(folder, 'caption.txt');
      await writeFile(caption, 'Rewards · redeem and celebrate');
      const mainFilter = `trim=start=${start}:end=${end},setpts=PTS-STARTPTS${desktop ? '' : `,pad=iw:ih+48:0:48:color=0x204a36,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${caption}:fontcolor=white:fontsize=14:x=(w-text_w)/2:y=15`}`;
      const clips = [
        { file: 'reward-redemption.mp4', filter: mainFilter, start, end, height: desktop ? 1080 : 892 },
        { file: 'reward-redemption-celebration.mp4', filter: `trim=start=${celebrationStart}:end=${celebrationStart + 8},setpts=PTS-STARTPTS`, start: celebrationStart, end: celebrationStart + 8, height: desktop ? 1080 : 844 },
      ];
      for (const clip of clips) {
        const file = join(folder, clip.file);
        run(['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-vf', clip.filter, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', file]);
        run(['-hide_banner', '-loglevel', 'error', '-i', file, '-f', 'null', '-']);
        const probe = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' });
        const duration = probe.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
        assert.ok(duration && probe.stderr.includes('Video: h264') && probe.stderr.includes(`${desktop ? 1920 : 390}x${clip.height}`) && !probe.stderr.includes('Audio:'));
        clip.durationSeconds = Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
        assert.ok(clip.durationSeconds >= 5 && clip.durationSeconds <= 10);
      }
      captures.push({ desktop, folder, raw, clips });
      console.log(`Captured ${variant}: selection → opening gift → revealed voucher; both clips verified.`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
for (const { desktop, folder, raw, clips } of captures) {
  const output = join(pitch, desktop ? 'desktop' : '');
  const dimensions = { width: desktop ? 1920 : 780, height: desktop ? 1080 : 1688 };
  const metadata = shots.map(shot => ({ ...shot, ...dimensions }));
  for (const shot of metadata) await copyFile(join(folder, shot.file), join(output, 'stills', shot.file));
  for (const clip of clips) await copyFile(join(folder, clip.file), join(output, 'videos', clip.file));
  if (desktop) await copyFile(join(folder, shots[2].file), join(output, 'posters/reward-redemption.png'));
  await copyFile(raw, join(output, 'source/reward-redemption.webm'));
  await writeFile(join(output, 'source/reward-scenes.json'), JSON.stringify({
    recordedAt: new Date().toISOString(), source: 'source/reward-redemption.webm',
    sampleData: '60 points earned by completing two real shared games; illustrative nicknames and demo voucher.',
    clips: clips.map(({ filter, ...clip }) => clip), screenshots: metadata,
  }, null, 2));
  const manifestPath = join(output, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.generatedAt = new Date().toISOString();
  for (const shot of metadata) {
    const index = manifest.screenshots.findIndex(item => item.file === shot.file);
    assert.ok(index >= 0);
    manifest.screenshots[index] = shot;
  }
  const main = clips[0];
  const video = { file: `videos/${main.file}`, title: 'Rewards: redeem and celebrate', width: desktop ? 1920 : 390,
    height: main.height, codec: 'H.264', silent: true, speed: 1, durationSeconds: main.durationSeconds,
    poster: desktop ? 'posters/reward-redemption.png' : 'stills/20-reward-voucher.png',
    sourceScene: { source: 'source/reward-redemption.webm', start: main.start, end: main.end } };
  const index = manifest.videos.findIndex(item => item.file === video.file);
  assert.ok(index >= 0);
  manifest.videos[index] = video;
  const celebration = clips[1];
  const preview = { file: `videos/${celebration.file}`, title: 'Reward redemption with gift animation', speed: 1, silent: true,
    width: desktop ? 1920 : 390, height: celebration.height, durationSeconds: celebration.durationSeconds };
  manifest.previews = [...(manifest.previews ?? []).filter(item => item.file !== preview.file), preview];
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  const galleryPath = join(output, 'index.html');
  let gallery = await readFile(galleryPath, 'utf8');
  gallery = gallery.replace(/<article[^>]*>[\s\S]*?<\/article>/g, card => {
    const shot = metadata.find(item => card.includes(`src="stills/${item.file}"`));
    if (shot) return `<article class="shot"><a href="stills/${shot.file}"><img loading="lazy" src="stills/${shot.file}" alt="${esc(shot.description)}"></a><h3>${shot.file}</h3><p>${esc(shot.description)}</p><a href="stills/${shot.file}" download>Download PNG · ${shot.width} × ${shot.height}</a></article>`;
    if (card.includes(`src="${video.file}"`)) return `<article><h2>${video.title}</h2><p>${video.durationSeconds.toFixed(1)} seconds · ${video.width} × ${video.height} · silent MP4 · 1×</p><video controls playsinline preload="metadata" poster="${video.poster}"><source src="${video.file}" type="video/mp4"></video><p><a href="${video.file}" download>Download MP4</a></p></article>`;
    return card;
  });
  await writeFile(galleryPath, gallery);
  const readmePath = join(output, 'README.md');
  let readme = await readFile(readmePath, 'utf8');
  for (const shot of metadata) {
    readme = readme.replace(new RegExp(`(\\[${shot.file.replaceAll('.', '\\.')}\\]\\(stills/${shot.file.replaceAll('.', '\\.')}\\)[^\\n]*?)[：|][^\\n]*`, 'g'), `$1：${shot.description}`);
  }
  if (!readme.includes('refresh_reward_media.mjs')) readme += '\n特典関連の18・19・20と動画は新しい演出で更新済みです。19はギフトが開く瞬間、20は券が現れた交換完了画面です。両サイズの特典素材一式は scripts/refresh_reward_media.mjs で再撮影します。\n';
  await writeFile(readmePath, readme);
  if (!desktop) {
    const path = join(output, 'stills/manifest.json');
    const stills = JSON.parse(await readFile(path, 'utf8'));
    for (const shot of metadata) {
      const index = stills.screenshots.findIndex(item => item.file === shot.file);
      assert.ok(index >= 0);
      stills.screenshots[index] = shot;
    }
    await writeFile(path, JSON.stringify(stills, null, 2));
  }
}
assert.deepEqual(await hashes(join(root, 'demo')), protectedMedia, 'An unrelated image or video changed.');
console.log(JSON.stringify({ temporary, protectedMediaUnchanged: protectedMedia.size,
  updated: captures.map(({ desktop, clips }) => ({ variant: desktop ? 'desktop' : 'mobile', screenshots: shots.map(shot => shot.file), videos: clips.map(clip => ({ file: clip.file, durationSeconds: clip.durationSeconds })) })) }, null, 2));
