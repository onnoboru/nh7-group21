// Add reward screenshots in both layouts without regenerating existing media.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pitch = join(root, 'demo/pitch');
const scenes = [
  { file: '18-rewards.png', description: 'Choose a sample tea voucher, redeemable for 60 earned points.' },
  { file: '19-redeem-reward.png', description: 'The gift opens as the 60-point reward exchange succeeds.' },
  { file: '20-reward-voucher.png', description: 'The revealed sample voucher, its code, and the updated zero-point balance.' },
];
const targets = new Set(['', 'desktop'].flatMap(variant => scenes.map(scene => join(pitch, variant, 'stills', scene.file))));
async function hashes(directory) {
  const result = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) for (const pair of await hashes(path)) result.set(...pair);
    else if (/\.(png|jpe?g|svg|webp|mp4|webm|mov|mp3|wav)$/i.test(entry.name) && !targets.has(path)) {
      result.set(path, createHash('sha256').update(await readFile(path)).digest('hex'));
    }
  }
  return result;
}
const protectedMedia = await hashes(join(root, 'demo'));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = createStaticServer();
let browser;
const captured = [];
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  browser = await chromium.launch({ headless: true });
  for (const desktop of [false, true]) {
    const output = join(pitch, desktop ? 'desktop' : '');
    await mkdir(join(output, 'stills'), { recursive: true });
    const context = await browser.newContext({
      viewport: desktop ? { width: 1920, height: 1080 } : { width: 390, height: 844 },
      deviceScaleFactor: desktop ? 1 : 2, isMobile: !desktop, hasTouch: !desktop, locale: 'en-SG',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const click = async selector => { await page.locator(selector).click(); await page.waitForTimeout(100); };
    const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kindred.v1')));
    const shots = [];
    const shot = async (index, pause = 400) => {
      await page.waitForTimeout(pause);
      const metadata = { ...scenes[index], width: desktop ? 1920 : 780, height: desktop ? 1080 : 1688 };
      await page.screenshot({ path: join(output, 'stills', metadata.file) });
      shots.push(metadata);
      console.log(`Captured ${desktop ? 'desktop' : 'mobile'} ${metadata.file}`);
    };
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
      if (desktop) await page.evaluate(() => window.scrollTo(0, 0));
      else await page.locator('.reward-card').first().evaluate(element => element.scrollIntoView({ block: 'center' }));
      await shot(0);
      await click('[data-action="redeem"][data-id="tea"]');
      await click('[data-action="redeem-confirm"][data-id="tea"]');
      assert.equal((await state()).points, 0);
      assert.equal((await state()).redemptions[0].code, 'DEMO-TEA-0001');
      await page.waitForTimeout(300);
      await shot(1, 0);
      await page.waitForTimeout(1800);
      assert.ok(await page.locator('#dialog-root .voucher-code').isVisible());
      await shot(2);
      await click('[data-action="reward-view"]');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal((await state()).points, 0);
      assert.equal((await state()).redemptions.length, 1);
      assert.deepEqual(errors, []);
      captured.push({ output, shots });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

const esc = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
for (const { output, shots } of captured) {
  const manifestPath = join(output, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.screenshots = [...manifest.screenshots.filter(shot => !scenes.some(scene => scene.file === shot.file)), ...shots]
    .sort((a, b) => a.file.localeCompare(b.file));
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  const count = manifest.screenshots.length;
  const cards = shots.map(shot => `<article class="shot"><a href="stills/${shot.file}"><img loading="lazy" src="stills/${shot.file}" alt="${esc(shot.description)}"></a><h3>${shot.file}</h3><p>${esc(shot.description)}</p><a href="stills/${shot.file}" download>Download PNG · ${shot.width} × ${shot.height}</a></article>`).join('');
  const galleryPath = join(output, 'index.html');
  let gallery = await readFile(galleryPath, 'utf8');
  gallery = gallery.replace(/<article[^>]*>[\s\S]*?<\/article>/g, card => scenes.some(scene => card.includes(`src="stills/${scene.file}"`)) ? '' : card);
  gallery = gallery.replace('</div></main>', `${cards}</div></main>`)
    .replace(/Screenshots · \d+( assets)?/, (_, suffix = '') => `Screenshots · ${count}${suffix}`)
    .replace('Nine videos and seventeen screenshots.', `Nine videos and ${count} screenshots.`);
  await writeFile(galleryPath, gallery);
  const readmePath = join(output, 'README.md');
  let readme = await readFile(readmePath, 'utf8');
  readme = readme.replace('画像（17枚、PNG）', `画像（${count}枚、PNG）`).replace('Screenshots · 17', `Screenshots · ${count}`);
  if (!readme.includes('18-rewards.png')) readme += `\n## 特典交換の画像\n\n${shots.map(shot => `- [${shot.file}](stills/${shot.file})：${shot.description}`).join('\n')}\n\n60ポイントを実際のゲーム2回で獲得し、交換前・確認・交換後を撮影。再撮影には scripts/capture_reward_stills.mjs を使用します。\n`;
  await writeFile(readmePath, readme);
}
const stillsPath = join(pitch, 'stills/manifest.json');
const stills = JSON.parse(await readFile(stillsPath, 'utf8'));
stills.screenshots = [...stills.screenshots.filter(shot => !scenes.some(scene => scene.file === shot.file)), ...captured[0].shots];
await writeFile(stillsPath, JSON.stringify(stills, null, 2));
assert.deepEqual(await hashes(join(root, 'demo')), protectedMedia, 'An existing image or video changed.');
console.log(`Six new reward screenshots added. ${protectedMedia.size} existing media files unchanged.`);
