import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const files = await readdir(dist, { recursive: true });
for (const filename of files) {
  if (!filename.endsWith('.js')) continue;
  const result = spawnSync(process.execPath, ['--check', resolve(dist, filename)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
}
const html = await readFile(resolve(dist, 'index.html'), 'utf8');
if (!/<html\b[^>]*lang="en"/i.test(html)) throw new Error('Document language must be English.');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const path = match[1];
  if (/^(https?:|\/)/.test(path)) throw new Error(`Use local relative assets for portable hosting: ${path}`);
  if (!path.startsWith('data:')) await stat(resolve(dist, path));
}
for (const filename of files.filter(file => /\.(js|html|css|svg)$/.test(file))) {
  const content = await readFile(resolve(dist, filename), 'utf8');
  if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(content)) throw new Error(`Product files must use English text: ${filename}`);
}
console.log('Checks passed: JavaScript syntax, English product text, and relative local HTML assets.');
