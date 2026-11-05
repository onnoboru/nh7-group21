// Freshly record both layouts, then publish the four-folder kit as one batch.
// The previous kit and loose legacy media are retained together in an archive.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demo = join(root, 'demo');
const pitch = join(demo, 'pitch');
const temporary = process.env.PITCH_CAPTURE_RESUME_ROOT ? resolve(process.env.PITCH_CAPTURE_RESUME_ROOT) : await mkdtemp(join(tmpdir(), 'grandpals-full-pitch-'));
const publish = join(temporary, 'publish');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const files = async directory => {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
};
const digest = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const appFiles = ['dist/app.js', 'dist/core.js', 'dist/styles.css', 'dist/index.html'];
const appHashes = Object.fromEntries(await Promise.all(appFiles.map(async file => [file, await digest(join(root, file))])));
const oldHashes = new Map(await Promise.all((await files(pitch)).map(async path => [path.slice(pitch.length + 1), await digest(path)])));
const oldLooseFiles = (await readdir(demo, { withFileTypes: true })).filter(item => item.isFile()).map(item => item.name);
const oldLooseHashes = Object.fromEntries(await Promise.all(oldLooseFiles.map(async file => [file, await digest(join(demo, file))])));
const current = JSON.parse(await readFile(join(pitch, 'manifest.json'), 'utf8'));
const catalog = current.screenshots ? current : JSON.parse(await readFile(join(pitch, 'source/catalog.json'), 'utf8'));
const catalogPath = join(temporary, 'catalog.json');
await writeFile(catalogPath, JSON.stringify(catalog));
await mkdir(publish, { recursive: true });

function worker(variant) {
  return new Promise((resolve, reject) => {
    const process = spawn(globalThis.process.execPath, [join(root, 'scripts/record_desktop_pitch.mjs')], {
      cwd: root, stdio: 'inherit', env: { ...globalThis.process.env,
        PITCH_CAPTURE_LAYOUT: variant, PITCH_CAPTURE_OUTPUT: join(temporary, variant), PITCH_CAPTURE_CATALOG: catalogPath, PITCH_CAPTURE_RESUME: '1' },
    });
    process.once('error', reject);
    process.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${variant} capture failed: ${code ?? signal}. Staged output: ${temporary}`)));
  });
}
function sourcePaths(value, variant) {
  if (Array.isArray(value)) return value.map(item => sourcePaths(item, variant));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    key === 'source' && typeof item === 'string' && item.startsWith('source/') ? `source/${variant}/${basename(item)}` : sourcePaths(item, variant)]));
}
const videos = [], images = [];
for (const variant of ['phone', 'desktop']) {
  console.log(`Recording every ${variant} video and screenshot from the current app…`);
  await worker(variant);
  const captured = join(temporary, variant);
  const manifest = JSON.parse(await readFile(join(captured, 'manifest.json'), 'utf8'));
  assert.equal(manifest.videos.length, 10);
  assert.equal(manifest.screenshots.length, 20);
  const videoFolder = `videos_${variant}`;
  const imageFolder = `images_${variant}`;
  await mkdir(join(publish, videoFolder), { recursive: true });
  await mkdir(join(publish, imageFolder, 'posters'), { recursive: true });
  await mkdir(join(publish, 'source', variant), { recursive: true });
  for (const movie of manifest.videos) {
    const file = `${videoFolder}/${basename(movie.file)}`;
    const poster = `${imageFolder}/posters/${basename(movie.poster)}`;
    await cp(join(captured, movie.file), join(publish, file));
    await cp(join(captured, movie.poster), join(publish, poster));
    const sourceName = movie.file.includes('pick-up-sticks-') ? 'pick-up-sticks' : movie.file.includes('charlie-evolution') ? 'evolution' : 'features';
    videos.push({ ...sourcePaths(movie, variant), variant, file, poster, source: `source/${variant}/${sourceName}-${variant}.webm` });
  }
  for (const shot of manifest.screenshots) {
    const file = `${imageFolder}/${shot.file}`;
    await cp(join(captured, 'stills', shot.file), join(publish, file));
    const bytes = await readFile(join(publish, file));
    const dimensions = variant === 'phone' ? [780, 1688] : [1920, 1080];
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], dimensions);
    images.push({ ...shot, variant, file });
  }
  for (const file of await files(join(captured, 'source'))) {
    if (file.endsWith('.json')) await writeFile(join(publish, 'source', variant, basename(file)), JSON.stringify(sourcePaths(JSON.parse(await readFile(file, 'utf8')), variant), null, 2));
    else await cp(file, join(publish, 'source', variant, basename(file)));
  }
}
for (const variant of ['phone', 'desktop']) {
  const movies = videos.filter(movie => movie.variant === variant);
  assert.equal(movies.find(movie => movie.file.includes('pick-up-sticks-1.5x')).speed, 1.5);
  assert.equal(movies.find(movie => movie.file.includes('pick-up-sticks-highlights')).speed, 1);
  assert.equal(movies.find(movie => movie.file.includes('charlie-evolution')).sourceScenes.length, 2);
  assert.ok(movies.filter(movie => !movie.file.includes('pick-up-sticks')).every(movie => movie.speed === 1 && movie.durationSeconds >= 5 && movie.durationSeconds <= 10));
}
await writeFile(join(publish, 'source/catalog.json'), JSON.stringify(catalog, null, 2));
const manifest = { generatedAt: new Date().toISOString(), appHashes,
  capture: 'Fresh isolated Chromium sessions. Phone uses touch input; desktop uses mouse input. All points and growth are earned through real UI actions.',
  sampleData: catalog.sampleData, videos, images };
await writeFile(join(publish, 'manifest.json'), JSON.stringify(manifest, null, 2));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const movieCard = movie => `<article><h3>${esc(movie.title)}</h3><p>${movie.durationSeconds.toFixed(1)} s · ${movie.speed}× · ${movie.width} × ${movie.height}</p><video controls playsinline preload="metadata" poster="${movie.poster}"><source src="${movie.file}" type="video/mp4"></video><a href="${movie.file}" download>Download MP4</a></article>`;
const imageCard = shot => `<article><a href="${shot.file}"><img loading="lazy" src="${shot.file}" alt="${esc(shot.description)}"></a><h3>${basename(shot.file)}</h3><p>${esc(shot.description)}</p><a href="${shot.file}" download>Download PNG</a></article>`;
const sections = ['phone', 'desktop'].map(variant => `<section id="videos_${variant}"><h2>${variant === 'phone' ? 'Phone' : 'Desktop'} videos · 10</h2><p><code>videos_${variant}/</code></p><div class="videos ${variant}">${videos.filter(movie => movie.variant === variant).map(movieCard).join('')}</div></section><section id="images_${variant}"><h2>${variant === 'phone' ? 'Phone' : 'Desktop'} images · 20</h2><p><code>images_${variant}/</code></p><div class="images ${variant}">${images.filter(shot => shot.variant === variant).map(imageCard).join('')}</div></section>`).join('');
await writeFile(join(publish, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GrandPals pitch kit</title><style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f8f7f2;color:#283c33;font:17px/1.6 system-ui,sans-serif}main{max-width:1520px;margin:auto;padding:32px 24px}h1,h2,h3{line-height:1.25}h1{font-size:38px}h2{margin-top:42px}h3{font-size:20px}a{color:#305e47}nav{display:flex;flex-wrap:wrap;gap:10px}nav a{padding:10px 16px;background:#e5eddf;border-radius:10px;text-decoration:none}.note{padding:16px 20px;background:#e9eee3;border-radius:14px;margin:24px 0}.videos,.images{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.images.phone{grid-template-columns:repeat(4,minmax(0,1fr))}article{padding:18px;border:1px solid #dce3d7;border-radius:16px;background:#fffefa}video,img{display:block;width:100%;object-fit:contain;border-radius:10px;background:#e9eee3;margin-bottom:14px}.phone video{max-height:520px}.desktop video,.desktop img{aspect-ratio:16/9}.phone img{max-height:440px}article p{font-size:15px}@media(max-width:850px){.videos,.images,.images.phone{grid-template-columns:1fr}main{padding:24px 16px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}</style><main><h1>GrandPals pitch kit</h1><p>Fresh captures of the current app · 20 videos · 40 screenshots</p><nav><a href="#videos_phone">Phone videos</a><a href="#videos_desktop">Desktop videos</a><a href="#images_phone">Phone images</a><a href="#images_desktop">Desktop images</a></nav><p class="note">Actual prototype screens, captured in Chromium. Feature clips and highlights play at 1×; the full sticks walkthrough plays at 1.5×. Evolution includes the later two transformations. Reward clips include the opening gift. Names, stories, and vouchers are illustrative demo data. All videos are silent.</p>${sections}</main></html>`);
await writeFile(join(publish, 'README.md'), `# GrandPals ピッチ素材\n\n[index.html](index.html) でスマホ・PCの最新版を一覧できます。全動画・全画像を現在のアプリから撮り直しています。\n\n| フォルダー | 内容 |\n| --- | --- |\n| images_phone/ | スマホ画像20枚、780×1688。動画ポスターは posters/ 内 |\n| images_desktop/ | PC画像20枚、1920×1080。動画ポスターは posters/ 内 |\n| videos_phone/ | スマホ動画10本、390×892（見出し付き） |\n| videos_desktop/ | PC動画10本、1920×1080 |\n\n## 動画\n\n各フォルダーに同じ10本があります。\n\n${videos.filter(movie => movie.variant === 'phone').map(movie => `- ${basename(movie.file)}：${movie.title}（${movie.speed}倍速）`).join('\n')}\n\n各機能の動画は5〜10秒。棒拾いのハイライトは1倍速、全編は1.5倍速。進化動画は最初の変身を省いて後半2回を収録しています。特典画像19はギフト開封、20は券の現れた交換完了画面です。\n\n## 撮影と保存\n\n実機の撮影ではなくChromiumの画面収録です。スマホはタッチ操作、PCはマウス操作。成長やポイントは保存データを編集せず、実際にゲーム・世話・家族の返事を操作して獲得しています。サンプル券は実店舗では使えません。元動画・抜粋秒数は source/、寸法・速度・現在のアプリのハッシュは manifest.json にあります。\n\n再撮影は scripts/refresh_pitch_kit.mjs。PLAYWRIGHT_MODULE、PLAYWRIGHT_BROWSERS_PATH、FFMPEG_PATH を指定して実行します。旧構成は demo/archive/ に保存しています。demo/ 全体は .gitignore の対象です。\n`);

// Re-record rewards without screenshots or navigation interrupting the effect.
// This pass aligns cuts to actual video frames and preserves every other asset.
await new Promise((resolve, reject) => {
  const capture = spawn(process.execPath, [join(root, 'scripts/refresh_reward_confetti.mjs')], {
    cwd: root, stdio: 'inherit', env: { ...process.env, PITCH_MEDIA_ROOT: publish },
  });
  capture.once('error', reject);
  capture.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Reward capture failed: ${code ?? signal}. Staged output: ${temporary}`)));
});

// Verify the complete staged kit and unchanged app before switching folders.
for (const [file, sha] of Object.entries(appHashes)) assert.equal(await digest(join(root, file)), sha, 'App changed while recording.');
for (const movie of videos) {
  assert.ok((await readFile(join(publish, movie.file))).length > 1000);
  await readFile(join(publish, movie.poster));
  await readFile(join(publish, movie.source));
}
const staging = join(demo, `.pitch-staging-${stamp}`);
await cp(publish, staging, { recursive: true, errorOnExist: true, force: false });
const archive = join(demo, 'archive', `pitch-${stamp}`);
await mkdir(archive, { recursive: true });
await rename(pitch, join(archive, 'pitch'));
try { await rename(staging, pitch); }
catch (error) { await rename(join(archive, 'pitch'), pitch); throw error; }
for (const file of oldLooseFiles) await rename(join(demo, file), join(archive, file));
for (const [file, sha] of oldHashes) assert.equal(await digest(join(archive, 'pitch', file)), sha, `Archived file changed: ${file}`);
for (const [file, sha] of Object.entries(oldLooseHashes)) assert.equal(await digest(join(archive, file)), sha);
console.log(JSON.stringify({ gallery: join(pitch, 'index.html'), folders: ['images_phone', 'images_desktop', 'videos_phone', 'videos_desktop'], videos: videos.length, screenshots: images.length, archive, temporary }, null, 2));
