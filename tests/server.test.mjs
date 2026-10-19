import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStaticHandler, createStaticServer } from '../scripts/serve.mjs';

test('static server serves only public assets and handles HTTP requests', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'kindred-test-'));
  const root = join(dir, 'public');
  const { mkdir } = await import('node:fs/promises');
  await mkdir(root);
  await writeFile(join(root, 'index.html'), '<html lang="en">Kindred</html>');
  await writeFile(join(root, 'app.js'), 'export const example = true;');
  await writeFile(join(dir, 'private.txt'), 'private');
  await symlink(join(dir, 'private.txt'), join(root, 'linked.txt'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const handler = createStaticHandler({ root });
  const get = async (path, method = 'GET') => {
    const result = { status: 200, headers: {}, body: '' };
    await handler({ url: path, method }, {
      setHeader(name, value) { result.headers[name.toLowerCase()] = value; },
      writeHead(status, headers = {}) {
        result.status = status;
        for (const [name, value] of Object.entries(headers)) result.headers[name.toLowerCase()] = value;
      },
      end(body) { result.body = body?.toString() || ''; },
    });
    return result;
  };
  await t.test('serves the entry page', async () => {
    const res = await get('/?preview=1');
    assert.equal(res.status, 200);
    assert.match(res.body, /Kindred/);
    assert.match(res.headers['content-type'], /text\/html/);
  });
  await t.test('serves ESM with JavaScript MIME type', async () => {
    assert.match((await get('/app.js')).headers['content-type'], /javascript/);
  });
  await t.test('HEAD returns headers without a body', async () => {
    const res = await get('/', 'HEAD');
    assert.equal(res.status, 200);
    assert.equal(res.body, '');
  });
  await t.test('missing files return 404', async () => {
    assert.equal((await get('/missing.js')).status, 404);
  });
  await t.test('write methods are rejected', async () => {
    assert.equal((await get('/', 'POST')).status, 405);
  });
  await t.test('encoded traversal and hidden files are blocked', async () => {
    for (const path of ['/../private.txt', '/%2e%2e/private.txt', '/.env', '/%5c..%5cprivate.txt']) {
      assert.equal((await get(path)).status, 403, path);
    }
  });
  await t.test('symlinks cannot expose files outside dist', async () => {
    assert.equal((await get('/linked.txt')).status, 403);
  });
  await t.test('malformed encoded paths return 400', async () => {
    assert.equal((await get('/%ZZ')).status, 400);
  });
});

test('HTTP listener smoke test', async t => {
  const server = createStaticServer();
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  } catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) {
      t.skip('This environment does not allow local listening sockets.');
      return;
    }
    throw error;
  }
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Kindred/);
});
