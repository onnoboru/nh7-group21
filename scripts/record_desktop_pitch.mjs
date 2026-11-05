// Capture the complete kit. Optional PITCH_CAPTURE_LAYOUT=phone and
// PITCH_CAPTURE_OUTPUT let the full-kit runner stage fresh captures safely.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './serve.mjs';
import { ACTIVITIES, getLearningActivity, getPetStats, PET_EVOLUTIONS } from '../dist/core.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pitch = join(root, 'demo/pitch');
const desktop = process.env.PITCH_CAPTURE_LAYOUT !== 'phone';
const variant = desktop ? 'desktop' : 'phone';
const output = process.env.PITCH_CAPTURE_OUTPUT ? resolve(process.env.PITCH_CAPTURE_OUTPUT) : join(pitch, 'desktop');
const temporary = await mkdtemp(join(tmpdir(), 'grandpals-desktop-pitch-'));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const original = JSON.parse(await readFile(process.env.PITCH_CAPTURE_CATALOG || join(pitch, 'manifest.json'), 'utf8'));
const catalog = [...original.videos, ...(original.previews ?? [])];
const homeShot = original.screenshots.find(shot => shot.file.startsWith('13-'));
homeShot.file = '13-charlie-home.png';
homeShot.description = 'Charlie at level two after real shared games, care, and a family story.';
const sticksOnly = process.argv.includes('--sticks-only');
const previous = sticksOnly ? JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8')) : null;
const previousScenes = sticksOnly ? JSON.parse(await readFile(join(output, 'source/scenes.json'), 'utf8')) : null;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
for (const folder of ['source', 'stills', 'posters', 'videos']) await mkdir(join(output, folder), { recursive: true });
async function hashes(directory) {
  const result = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (path === output) continue;
    if (entry.isDirectory()) for (const pair of await hashes(path)) result.set(...pair);
    else result.set(path, createHash('sha256').update(await readFile(path)).digest('hex'));
  }
  return result;
}
const protectedFiles = await hashes(join(root, 'demo'));
const progress = process.env.PITCH_CAPTURE_RESUME ? await readFile(join(output, 'capture-progress.json'), 'utf8').then(JSON.parse).catch(error => { if (error.code === 'ENOENT') return null; throw error; }) : null;
const completed = new Set(progress?.completed ?? []);
const screenshots = progress?.screenshots ?? previous?.screenshots.filter(shot => Number(shot.file.slice(0, 2)) >= 14) ?? [];
const features = progress?.features ?? previousScenes?.features ?? [], evolutions = progress?.evolutions ?? previousScenes?.evolutions ?? [], sticks = progress?.sticks ?? [];
const server = createStaticServer();
let browser;
const errors = [];
let base;

async function session(name, action) {
  name = name.replaceAll('desktop', variant);
  if (completed.has(name)) { console.log(`Reusing completed fresh ${name} recording.`); return; }
  const context = await browser.newContext({
    viewport: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 }, deviceScaleFactor: desktop ? 1 : 2,
    isMobile: !desktop, hasTouch: !desktop, locale: 'en-SG',
    recordVideo: { dir: temporary, size: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 } },
  });
  const started = performance.now();
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const elapsed = () => (performance.now() - started) / 1000;
  const hold = ms => page.waitForTimeout(ms);
  let keyboardPreparation = false;
  const prepareKeyboard = () => { keyboardPreparation = true; };
  const checkButtons = async () => {
    const longLabels = await page.locator('button:visible:not(.quiz-option)').evaluateAll(buttons => buttons.map(button => button.textContent.trim())
      .filter(label => (label.match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || []).length > 2));
    assert.deepEqual(longLabels, [], 'Action buttons use at most two words.');
  };
  const click = async (selector, pause = 100) => {
    if (keyboardPreparation) await page.locator(selector).press('Enter');
    else await page.locator(selector)[desktop ? 'click' : 'tap']();
    await hold(pause);
    await checkButtons();
  };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
  const shot = async (number, pause = 400) => {
    const source = original.screenshots.find(shot => Number(shot.file.slice(0, 2)) === number);
    assert.ok(source);
    await hold(pause);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow.');
    await page.screenshot({ path: join(output, 'stills', source.file) });
    screenshots.push({ ...source, width: desktop ? 1920 : 780, height: desktop ? 1080 : 1688 });
    console.log(`${variant} image ${number}/${original.screenshots.length}: ${source.file}`);
  };
  const together = async (kind, age = 12) => {
    await click('.nav-item[data-page="activities"]');
    await click(`[data-action="together-mode"][data-kind="${kind}"]`);
    await click('#together-setup-form button[type="submit"]');
    const title = await page.locator('#dialog-title').textContent();
    const activity = ACTIVITIES.find(item => title.includes(item.title));
    assert.equal(activity?.kind, kind);
    await click('[data-action="session-start"]', 300);
    return getLearningActivity(activity.id, { age, challenge: 1 });
  };
  const finishQuiz = async questions => {
    for (const question of questions) {
      const answer = `[data-action="together-answer"][data-index="${question.correct}"]`;
      await click(answer);
      await click(answer);
      await click('[data-action="together-next"]');
    }
  };
  const feature = async (id, seconds, action) => {
    const start = elapsed();
    await action();
    await hold(Math.max(0, (seconds - elapsed() + start) * 1000));
    const end = elapsed();
    assert.ok(end - start < 10, `${id} exceeds ten seconds.`);
    features.push({ id, start, end, source: `source/${name}.webm` });
    console.log(`${variant} feature: ${id}, ${(end - start).toFixed(1)} seconds.`);
  };
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await hold(800);
    await checkButtons();
    assert.equal(await page.locator('.charlie-art path[d^="M37 192"]').count(), 0);
    await action({ page, click, hold, elapsed, state, shot, together, finishQuiz, feature, prepareKeyboard });
    await hold(1500); // Recorded buffer after the last exported interval.
    const video = page.video();
    await context.close();
    await video.saveAs(join(output, 'source', `${name}.webm`));
    completed.add(name);
    await writeFile(join(output, 'capture-progress.json'), JSON.stringify({ completed: [...completed], screenshots, features, evolutions, sticks }));
  } finally {
    await context.close();
  }
}

try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ headless: true });

  // The complete sticks journey, plus the corresponding stills and family loop.
  await session('pick-up-sticks-desktop', async ({ page, click, hold, elapsed, state, shot, together, finishQuiz }) => {
    const mark = (name, start, end = elapsed()) => sticks.push({ name, start, end });
    await shot(1);
    const home = elapsed();
    await hold(1500);
    mark('Home', home);
    await click('.nav-item[data-page="activities"]', 500);
    await shot(2);
    mark('Choose a game', elapsed() - 1);
    await click('[data-action="together-mode"][data-kind="sticks"]', 400);
    await shot(3);
    mark('Two players', elapsed() - 1);
    await click('#together-setup-form button[type="submit"]', 500);
    await page.locator('.sticks-howto-art').scrollIntoViewIfNeeded();
    if (desktop) assert.ok(await page.locator('.modal').evaluate(element => element.scrollHeight <= element.clientHeight + 2), 'Desktop instructions fit.');
    await shot(4);
    await hold(1000);
    mark('How to play', elapsed() - 1.5);
    await click('[data-action="session-start"]', 700);
    await page.locator('.sticks-board-viewport').scrollIntoViewIfNeeded();
    await click('[data-action="stick-zoom"]', 700);
    await click('[data-action="stick-zoom"]', 400);
    let first, final;
    for (let index = 0; index < 9; index++) {
      if (index === 0) first = elapsed();
      if (index === 8) final = elapsed();
      await page.locator('.stick-on-table').last().locator('.stick-label')[desktop ? 'click' : 'tap']();
      await hold(450);
      if (!index) {
        if (desktop) assert.ok(await page.locator('.modal').evaluate(element => element.scrollHeight <= element.clientHeight + 2), 'Desktop board and controls fit.');
        await shot(5);
      }
      await click('[data-action="stick-pick"]', 650);
      if (index === 1 || index === 4) await click('[data-action="stick-pass"]', 600);
      if (index === 1) mark('Play and pass the turn', first);
    }
    await page.getByText('MISSION COMPLETE', { exact: true }).waitFor();
    assert.ok(await page.locator('.compact-completion-modal').evaluate(element => element.scrollHeight <= element.clientHeight + 2));
    await shot(6);
    await hold(1500);
    mark('Final stick and reward', final);
    const saved = await state();
    assert.equal(saved.points, 30);
    assert.equal(saved.reviews[0].stickCount, 9);
    await click('[data-action="close-dialog"]');
    await click('.nav-item[data-page="circle"]');
    await page.locator('.together-history').scrollIntoViewIfNeeded();
    await shot(7);
    await click('.nav-item[data-page="discover"]');
    await click('[data-action="pet-ask"]');
    await shot(8);
    await click('#dialog-root [data-action="pet-reply"]');
    await page.locator('#pet-reply-text').fill('I would love to teach you pick-up sticks. We used to play it after school.');
    await shot(9);
    await click('#pet-reply-form button[type="submit"]');
    assert.equal(getPetStats(await state()).experience, 25);
    await click('[data-action="close-dialog"]');
    await click('[data-action="pet-feed"]');
    for (let round = 0; round < 2; round++) {
      const quiz = await together('quiz');
      await finishQuiz(quiz.questions);
      await click('[data-action="close-dialog"]');
    }
    assert.equal(getPetStats(await state()).level, 2);
    await click('.nav-item[data-page="settings"]');
    await shot(10);
    await click('[data-action="characters"]');
    await shot(11);
    await click('.nav-item[data-page="discover"]');
    await click('[data-action="storybook"]');
    await shot(12);
    await click('.nav-item[data-page="discover"]');
    await shot(13);
    console.log('Desktop sticks: nine real picks, scores, and one 30-point award verified.');
  });

  if (!sticksOnly) await session('features-desktop', async ({ page, click, hold, elapsed, state, shot, together, finishQuiz, feature }) => {
    await click('.nav-item[data-page="settings"]');
    await page.locator('#learning-age').selectOption('6');
    await click('#learning-form button[type="submit"]');
    const quiz = await together('quiz', 6);
    await hold(700);
    const correct = `[data-action="together-answer"][data-index="${quiz.questions[0].correct}"]`;
    await feature('quiz-together', 8, async () => {
      await hold(1200);
      await click(correct, 1000);
      await click(correct, 1800);
      await click('[data-action="together-next"]', 800);
    });
    await finishQuiz(quiz.questions.slice(1));
    await click('[data-action="close-dialog"]');
    await together('conversation', 6);
    await hold(700);
    await feature('talk-together', 8, async () => {
      await hold(1700);
      await click('[data-action="together-next"]', 2000);
      await click('[data-action="together-next"]', 1300);
    });
    for (let turn = 0; turn < 6; turn++) await click('[data-action="together-next"]');
    await click('[data-action="close-dialog"]');
    assert.equal((await state()).points, 60);
    assert.equal(getPetStats(await state()).experience, 20);
    await click('.nav-item[data-page="discover"]', 800);
    await feature('family-question', 9, async () => {
      await hold(700);
      await click('[data-action="pet-ask"]', 1200);
      await click('#dialog-root [data-action="pet-reply"]', 700);
      await page.locator('#pet-reply-text').fill('Let’s play pick-up sticks together.');
      await hold(800);
      await click('#pet-reply-form button[type="submit"]', 1000);
    });
    assert.equal(getPetStats(await state()).experience, 35);
    await click('[data-action="close-dialog"]', 700);
    await feature('care-and-grow', 7, async () => {
      await hold(1000);
      await click('[data-action="pet-feed"]', 3500);
    });
    assert.equal(getPetStats(await state()).experience, 38);
    await click('[data-action="storybook"]', 800);
    await feature('monthly-storybook', 8, async () => {
      await hold(1400);
      await page.locator('.storybook-section').first().evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      await hold(1800);
      await page.locator('.storybook-story').first().evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await hold(1500);
    });
    await click('.points-pill');
    await page.evaluate(() => window.scrollTo(0, 0));
    await hold(1500);
    await shot(18);
    let celebrationStart;
    await feature('reward-redemption', 9.5, async () => {
      await hold(400);
      await page.locator('.reward-card').first().evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await hold(700);
      await click('[data-action="redeem"][data-id="tea"]', 1100);
      celebrationStart = elapsed() - .5;
      await click('[data-action="redeem-confirm"][data-id="tea"]', 500);
      assert.equal((await state()).points, 0);
      assert.equal((await state()).redemptions[0].code, 'DEMO-TEA-0001');
      await shot(19, 0);
      await hold(1500);
      await shot(20);
      await click('[data-action="reward-view"]', 100);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await hold(700);
      await page.locator('.voucher-item').evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    });
    await hold(Math.max(0, (celebrationStart + 8 - elapsed()) * 1000));
    features.push({ id: 'reward-redemption-celebration', start: celebrationStart, end: celebrationStart + 8, source: `source/features-${variant}.webm` });
  });

  if (!sticksOnly) await session('evolution-desktop', async ({ page, click, hold, elapsed, state, shot, prepareKeyboard }) => {
    // Earn prerequisite growth with actual keyboard activation of the buttons;
    // only the real-time evolution animations are exported from this session.
    prepareKeyboard();
    await click('.nav-item[data-page="activities"]');
    await click('[data-action="together-mode"][data-kind="conversation"]');
    await click('#together-setup-form button[type="submit"]');
    for (let round = 1; round <= 18; round++) {
      if (round > 1) await click('[data-action="quick-pair-play"]', 30);
      await click('[data-action="session-start"]', 30);
      for (let turn = 0; turn < 8; turn++) await click('[data-action="together-next"]', 30);
      const pet = getPetStats(await state());
      assert.equal(pet.experience, round * 10);
      const form = PET_EVOLUTIONS.find(item => item.unlockXp === pet.experience);
      if (form) {
        const reveal = page.locator('.evolution-reveal');
        assert.equal(await reveal.getAttribute('data-to'), form.id);
        const start = elapsed();
        await hold(3150);
        evolutions.push({ name: form.name, from: await reveal.getAttribute('data-from'), to: form.id, growth: pet.experience, start, end: elapsed() });
        await shot(13 + evolutions.length);
      } else if (round % 3 === 0) console.log(`${variant} evolution progress: ${round}/18 completed games.`);
    }
    const earned = await state();
    assert.equal(earned.points, 540);
    assert.equal(getPetStats(earned).form.id, 'story-keeper');
    await click('[data-action="close-dialog"]');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.evolution-reveal').count(), 0);
    if (desktop) await click('.nav-item[data-page="characters"]');
    else { await click('.nav-item[data-page="settings"]'); await click('[data-action="characters"]'); }
    await page.locator('.evolution-journey').evaluate(element => element.scrollIntoView({ block: 'start' }));
    await shot(17);
    await click('[data-action="evolution-replay"][data-id="little-explorer"]');
    assert.deepEqual(await state(), earned);
  });
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

// Screencast frames trail the UI clock slightly. Start after the measured
// transition into the result, preserving both the old pose and transformation.
const evolutionCaptureOffset = Number(process.env.PITCH_EVOLUTION_OFFSET ?? .4);
assert.ok(Number.isFinite(evolutionCaptureOffset) && evolutionCaptureOffset >= 0 && evolutionCaptureOffset <= 2);
const evolutionCuts = evolutions.slice(1).map(scene => ({ ...scene, start: scene.start + evolutionCaptureOffset, end: scene.end + evolutionCaptureOffset }));
await writeFile(join(output, 'source/scenes.json'), JSON.stringify({
  recordedAt: new Date().toISOString(), viewport: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 },
  sticks, features, evolutions, evolutionHighlight: evolutionCuts, evolutionCaptureOffset,
  earnedThrough: 'Actual UI play in isolated browsers. No saved growth, points, or level was edited.',
}, null, 2));
function run(args) {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
}
async function encode(id, source, filters, speed = 1) {
  const target = join(output, 'videos', `${id}.mp4`);
  const existing = catalog.find(video => video.file.endsWith(`/${id}.mp4`));
  assert.ok(existing);
  const title = existing.title || (speed === 1.5 ? 'Pick Up Sticks · full walkthrough · 1.5×' : 'Pick Up Sticks · highlights · 1×');
  if (!desktop) {
    const caption = join(temporary, `${id}.txt`);
    await writeFile(caption, title.replace(':', ' ·'));
    const header = `pad=iw:ih+48:0:48:color=0x204a36,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${caption}:fontcolor=white:fontsize=14:x=(w-text_w)/2:y=15`;
    filters = [...filters];
    if (filters[0] === '-vf') filters[1] += `,${header}`;
    else filters[1] = filters[1].replace(/\[out\]$/, `,${header}[out]`);
  }
  run(['-y', '-hide_banner', '-loglevel', 'error', '-i', join(output, source), ...filters,
    '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', target]);
  run(['-hide_banner', '-loglevel', 'error', '-i', target, '-f', 'null', '-']);
  const probe = spawnSync(ffmpeg, ['-hide_banner', '-i', target], { encoding: 'utf8' });
  const duration = probe.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  assert.ok(duration && probe.stderr.includes('Video: h264') && probe.stderr.includes(desktop ? '1920x1080' : '390x892') && !probe.stderr.includes('Audio:'));
  const seconds = Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
  const poster = `posters/${id}.png`;
  run(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(Math.max(0, seconds - .6)), '-i', target, '-frames:v', '1', join(output, poster)]);
  console.log(`Exported ${variant} ${id}: ${seconds.toFixed(2)} seconds.`);
  return { file: `videos/${id}.mp4`, title,
    width: desktop ? 1920 : 390, height: desktop ? 1080 : 892, codec: 'H.264', silent: true, durationSeconds: seconds, speed, poster };
}
function joinScenes(parts) {
  return `${parts.map((part, index) => `[0:v]trim=start=${part.start}:end=${part.end},setpts=PTS-STARTPTS[p${index}]`).join(';')};${parts.map((_, index) => `[p${index}]`).join('')}concat=n=${parts.length}:v=1:a=0[out]`;
}
const videos = previous?.videos.filter(video => !video.file.includes('pick-up-sticks-')) ?? [];
videos.push(await encode('pick-up-sticks-1.5x', `source/pick-up-sticks-${variant}.webm`, ['-vf', `trim=start=${sticks[0].start}:end=${sticks.at(-1).end},setpts=(PTS-STARTPTS)/1.5`], 1.5));
videos.push({ ...await encode('pick-up-sticks-highlights', `source/pick-up-sticks-${variant}.webm`, ['-filter_complex', joinScenes(sticks), '-map', '[out]']), sourceScenes: sticks });
if (!sticksOnly) videos.push({ ...await encode('charlie-evolution', `source/evolution-${variant}.webm`, ['-filter_complex', joinScenes(evolutionCuts), '-map', '[out]']), sourceScenes: evolutionCuts });
for (const feature of sticksOnly ? [] : features) {
  const video = await encode(feature.id, feature.source, ['-vf', `trim=start=${feature.start}:end=${feature.end},setpts=PTS-STARTPTS`]);
  assert.ok(video.durationSeconds >= 5 && video.durationSeconds <= 10);
  videos.push({ ...video, sourceScene: feature });
}
screenshots.sort((a, b) => a.file.localeCompare(b.file));
videos.sort((a, b) => catalog.findIndex(video => video.file === a.file) - catalog.findIndex(video => video.file === b.file));
assert.deepEqual(videos.map(video => video.file).sort(), catalog.map(video => video.file).sort());
assert.deepEqual(screenshots.map(shot => shot.file), original.screenshots.map(shot => shot.file).sort());
const manifest = {
  generatedAt: new Date().toISOString(), variant,
  capture: desktop ? 'Actual desktop Chromium layout, 1920 × 1080; mouse input.' : 'Actual phone layout, 390 × 844; touch input. Videos add a 48-pixel title band.',
  sampleData: original.sampleData, videos, screenshots,
};
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const cards = videos.map(video => `<article><h2>${esc(video.title)}</h2><p>${video.durationSeconds.toFixed(1)} seconds · ${video.speed}× · silent MP4</p><video controls playsinline preload="metadata" poster="${video.poster}"><source src="${video.file}" type="video/mp4"></video><a href="${video.file}" download>Download MP4 · 1920 × 1080</a></article>`).join('');
const shots = screenshots.map(shot => `<article><a href="stills/${shot.file}"><img loading="lazy" src="stills/${shot.file}" alt="${esc(shot.description)}"></a><h2>${shot.file}</h2><p>${esc(shot.description)}</p><a href="stills/${shot.file}" download>Download PNG · 1920 × 1080</a></article>`).join('');
await writeFile(join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GrandPals · desktop pitch kit</title><style>*{box-sizing:border-box}body{margin:0;background:#f8f7f2;color:#283c33;font:17px/1.6 system-ui,sans-serif}main{max-width:1600px;margin:auto;padding:36px 24px}h1,h2{line-height:1.25}h2{font-size:21px}a{color:#305e47}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}article{padding:20px;border:1px solid #dce3d7;border-radius:16px;background:#fffefa}video,img{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;border-radius:10px;background:#edf1e7;margin-bottom:16px}.note{padding:16px;background:#e9eee3;border-radius:12px;margin:24px 0}@media(max-width:800px){.grid{grid-template-columns:1fr}}</style><main><a href="../index.html">Mobile pitch kit</a><h1>GrandPals · desktop pitch kit</h1><p>Full HD · 1920 × 1080 · landscape · real desktop layout</p><p class="note">${videos.length} videos and ${screenshots.length} screenshots. Feature demos play at 1×; the full sticks walkthrough is 1.5×. The evolution highlight includes the later two transformations. Names, the family reply, and vouchers are illustrative demo data. All videos are silent.</p><h2>Videos · ${videos.length}</h2><div class="grid">${cards}</div><h2>Screenshots · ${screenshots.length}</h2><div class="grid">${shots}</div></main></html>`);
await writeFile(join(output, 'README.md'), `# GrandPals PC・横画面版ピッチ素材\n\n[index.html](index.html) で一覧できます。全素材1920×1080、16:9。PCの実際のレイアウトをマウスで操作して撮影しています。\n\n## 動画（9本、MP4 / H.264、無音）\n\n${videos.map(video => `- [${video.title}](${video.file})：${video.durationSeconds.toFixed(1)}秒、${video.speed}倍速。`).join('\n')}\n\n進化動画は最初の変身を省き、80・180成長ポイントの2回を収録。成長とポイントは実際のゲーム・世話・返事の操作で獲得しました。特典交換はサンプル券で、実店舗では利用できません。\n\n## 画像（${screenshots.length}枚、PNG）\n\n${screenshots.map(shot => `- [${shot.file}](stills/${shot.file})：${shot.description}`).join('\n')}\n\n## 保存と再撮影\n\nスマホ版の動画・画像は保持しています。撮影元は source/、各抜粋の秒数は source/scenes.json と manifest.json に記録しています。再撮影スクリプトは scripts/record_desktop_pitch.mjs。Playwright と FFmpeg を別途指定して実行します。demo/ 全体は .gitignore の対象です。\n`);
assert.deepEqual(await hashes(join(root, 'demo')), protectedFiles, 'An existing pitch file changed.');
console.log(JSON.stringify({ gallery: join(output, 'index.html'), videos: videos.length, screenshots: screenshots.length, existingFilesUnchanged: protectedFiles.size }, null, 2));
