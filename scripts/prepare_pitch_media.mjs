// Build shareable MP4 cuts and an offline asset gallery. FFmpeg is optional
// tooling, supplied through PATH or FFMPEG_PATH, not an app dependency.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'demo/pitch');
const source = join(root, 'demo/pick-up-sticks-mobile.webm');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const recording = JSON.parse(await readFile(join(root, 'demo/pick-up-sticks-scenes.json'), 'utf8'));
const scenes = recording.scenes;
const featureRecording = JSON.parse(await readFile(join(output, 'source/features-scenes.json'), 'utf8'));
await mkdir(join(output, 'videos'), { recursive: true });
function run(args) {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
}
async function encode(filename, filters, { input = source, height = 844 } = {}) {
  const target = join(output, 'videos', filename);
  const existing = await stat(target).catch(() => null);
  if (!existing || existing.mtimeMs < Math.max((await stat(input)).mtimeMs, (await stat(fileURLToPath(import.meta.url))).mtimeMs)) {
    run(['-y', '-hide_banner', '-loglevel', 'error', '-i', input, ...filters,
      '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
      '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', target]);
  }
  // Decode the entire result, rather than only checking for a nonempty file.
  run(['-hide_banner', '-loglevel', 'error', '-i', target, '-f', 'null', '-']);
  const probe = spawnSync(ffmpeg, ['-hide_banner', '-i', target], { encoding: 'utf8' });
  const duration = probe.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!duration || !probe.stderr.includes('Video: h264') || !probe.stderr.includes(`390x${height}`) || probe.stderr.includes('Audio:')) throw new Error(`Unexpected video format: ${filename}`);
  return { file: `videos/${filename}`, width: 390, height, codec: 'H.264', silent: true,
    durationSeconds: Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) };
}
const fast = await encode('pick-up-sticks-1.5x.mp4', ['-vf', 'setpts=PTS/1.5']);
const split = `[0:v]split=${scenes.length}${scenes.map((_, index) => `[s${index}]`).join('')};`;
const trims = scenes.map((scene, index) => `[s${index}]trim=start=${scene.start}:end=${scene.end},setpts=PTS-STARTPTS[c${index}]`).join(';');
const concat = `${scenes.map((_, index) => `[c${index}]`).join('')}concat=n=${scenes.length}:v=1:a=0[out]`;
const highlights = await encode('pick-up-sticks-highlights.mp4', ['-filter_complex', `${split}${trims};${concat}`, '-map', '[out]']);
const featureVideos = [];
for (const feature of featureRecording.features) {
  const caption = join(output, 'source', `${feature.id}-caption.txt`);
  await writeFile(caption, feature.title.replace(':', ' ·'));
  const filter = `trim=start=${feature.start}:end=${feature.end},setpts=PTS-STARTPTS,pad=iw:ih+48:0:48:color=0x204a36,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${caption}:fontcolor=white:fontsize=14:x=(w-text_w)/2:y=15`;
  const video = await encode(`${feature.id}.mp4`, ['-vf', filter], { input: join(output, featureRecording.source), height: 892 });
  if (video.durationSeconds < 5 || video.durationSeconds > 10) throw new Error(`${feature.id} must be 5–10 seconds.`);
  featureVideos.push({ ...video, title: feature.title, speed: 1, poster: feature.poster, sourceScene: { start: feature.start, end: feature.end } });
}
const evolutionRecording = await readFile(join(output, 'source/evolution-scenes.json'), 'utf8').then(JSON.parse).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (evolutionRecording) {
  const parts = evolutionRecording.scenes;
  const caption = join(output, 'source/evolution-caption.txt');
  await writeFile(caption, 'Charlie evolves through shared play');
  const fork = `[0:v]split=${parts.length}${parts.map((_, index) => `[e${index}]`).join('')};`;
  const cut = parts.map((part, index) => `[e${index}]trim=start=${part.start}:end=${part.end},setpts=PTS-STARTPTS[p${index}]`).join(';');
  const joined = `${parts.map((_, index) => `[p${index}]`).join('')}concat=n=${parts.length}:v=1:a=0,pad=iw:ih+48:0:48:color=0x204a36,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${caption}:fontcolor=white:fontsize=14:x=(w-text_w)/2:y=15[out]`;
  const video = await encode('charlie-evolution.mp4', ['-filter_complex', `${fork}${cut};${joined}`, '-map', '[out]'], { input: resolve(output, evolutionRecording.source), height: 892 });
  if (video.durationSeconds < 5 || video.durationSeconds > 10) throw new Error('Evolution highlight must be 5–10 seconds.');
  featureVideos.unshift({ ...video, title: 'Charlie evolves through shared play', speed: 1,
    poster: `stills/${evolutionRecording.screenshots[0].file}`, sourceScenes: parts, earnedThrough: evolutionRecording.earnedThrough });
}
const stills = JSON.parse(await readFile(join(output, 'stills/manifest.json'), 'utf8'));
const allScreenshots = [...stills.screenshots, ...(evolutionRecording?.screenshots ?? [])].sort((a, b) => a.file.localeCompare(b.file));
const manifest = {
  generatedAt: new Date().toISOString(), source: '../pick-up-sticks-mobile.webm',
  videos: [{ ...fast, speed: 1.5 }, { ...highlights, speed: 1, sourceScenes: scenes }, ...featureVideos],
  screenshots: allScreenshots, sampleData: stills.sampleData,
};
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const videoCard = (video, title) => `<article><h2>${title}</h2><p>${video.durationSeconds.toFixed(1)} seconds · ${video.width} × ${video.height} · silent MP4</p><video controls playsinline preload="metadata" ${video.poster ? `poster="${video.poster}"` : ''}><source src="${video.file}" type="video/mp4"></video><p><a href="${video.file}" download>Download MP4</a></p></article>`;
const screenshots = allScreenshots.map(shot => `<article class="shot"><a href="stills/${esc(shot.file)}"><img loading="lazy" src="stills/${esc(shot.file)}" alt="${esc(shot.description)}"></a><h3>${esc(shot.file.replace(/\.png$/, '').replaceAll('-', ' '))}</h3><p>${esc(shot.description)}</p><a href="stills/${esc(shot.file)}" download>Download PNG · ${shot.width} × ${shot.height}</a></article>`).join('');
await writeFile(join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GrandPals pitch kit</title><style>
*{box-sizing:border-box}body{margin:0;background:#f8f7f2;color:#283c33;font:17px/1.6 system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:36px 24px}h1,h2,h3{line-height:1.2}h1{font-size:40px}a{color:#305e47}article{padding:22px;border:1px solid #dce3d7;background:#fffefa;border-radius:18px}.videos{display:grid;grid-template-columns:1fr 1fr;gap:24px}video{display:block;width:100%;max-height:560px;background:#182e23;border-radius:12px}.shots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.shot img{display:block;width:100%;max-height:460px;object-fit:contain;background:#edf1e7;border-radius:10px}.shot h3{font-size:18px;margin-top:16px}.shot p{font-size:15px}.note{padding:18px 22px;background:#e9eee3;border-radius:14px;margin:24px 0}.section-title{margin-top:42px}@media(max-width:700px){.videos,.shots{grid-template-columns:1fr}main{padding:24px 16px}h1{font-size:32px}}</style><main><h1>GrandPals pitch kit</h1><p>Shared play → a small family conversation → a growing companion.</p><div class="videos">${videoCard(highlights, 'Pick Up Sticks · highlights · 1×')}${videoCard(fast, 'Full walkthrough · 1.5×')}</div><h2 class="section-title">Feature demos · 5–10 seconds · 1×</h2><div class="videos">${featureVideos.map(video => videoCard(video, esc(video.title))).join('')}</div><p class="note">Actual prototype screens captured in Chromium. Mobile views emulate a phone, rather than recording a physical handset. Names and the written family reply are illustrative sample data. Media is silent.</p><h2 class="section-title">Screenshots · ${allScreenshots.length} assets</h2><div class="shots">${screenshots}</div></main></html>`);
const rows = allScreenshots.map(shot => `| [${shot.file}](stills/${shot.file}) | ${shot.description} |`).join('\n');
await writeFile(join(output, 'README.md'), `# GrandPals ピッチ素材\n\n[index.html](index.html) をブラウザーで開くと動画・画像を一覧できます。\n\n- [1.5倍速版](videos/pick-up-sticks-1.5x.mp4)：${fast.durationSeconds.toFixed(1)}秒、MP4 / H.264、無音。元の操作動画を全編収録。\n- [要点版](videos/pick-up-sticks-highlights.mp4)：${highlights.durationSeconds.toFixed(1)}秒、MP4 / H.264、無音・1倍速。ホーム→ゲーム選択→2人の名前→遊び方→プレイ・交代→最後の棒・報酬を抜粋。\n${featureVideos.map(video => `- [${video.title}](${video.file})：${video.durationSeconds.toFixed(1)}秒、1倍速、MP4。`).join('\n')}\n- スマホ画像${allScreenshots.filter(shot => shot.width === 780).length}枚は780×1688、デスクトップ画像1枚は1440×1000。加工したモックアップではなく、実際の画面を保存しています。\n\nまず要点版で「2人で遊べる」を示し、05の盤面、08〜09の質問と返事、11〜12の成長とストーリーブックで「遊びを家族の交流につなげる」を説明できます。詳細操作を見せる場合は1.5倍速版を使います。各機能の紹介動画は5〜10秒の等速で、画面外の見出しを付けています。\n\n## 画像一覧\n\n| ファイル | 用途 |\n| --- | --- |\n${rows}\n\n## 撮影条件と保存\n\n実機撮影ではなく、Chromiumのスマホ表示390×844（画像は2倍解像度）です。Alex・Granはサンプル名で、家族の返事も説明用に入力した架空の文章です。成長と進化は保存データを書き換えず、実際にゲーム・世話・返事の操作を行って到達しています。進化ハイライトは30・80・180成長ポイントでの変身3回を等速で抜粋しています。\n\n元動画は ../pick-up-sticks-mobile.webm。抜粋元の秒数は manifest.json に記録しています。demo/ 全体は .gitignore の対象です。動画・画像を更新してもGitには入りません。共有やバックアップはこのフォルダーを別途コピーしてください。\n`);
console.log(JSON.stringify({ videos: manifest.videos, stills: allScreenshots.length, gallery: join(output, 'index.html') }, null, 2));
