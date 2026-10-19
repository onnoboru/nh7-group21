import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function inside(root, path) {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

export function createStaticHandler({ root = resolve(projectRoot, 'dist') } = {}) {
  return async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end('Method not allowed');
      return;
    }
    try {
      const path = decodeURIComponent((req.url || '/').split('?')[0]);
      if (path.includes('\0') || path.includes('\\') || path.split('/').some(part => part.startsWith('.'))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const rootPath = await realpath(root);
      let filePath = resolve(rootPath, `.${path}`);
      if (!inside(rootPath, filePath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      if ((await stat(filePath)).isDirectory()) filePath = resolve(filePath, 'index.html');
      filePath = await realpath(filePath);
      if (!inside(rootPath, filePath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const body = await readFile(filePath);
      res.writeHead(200, {
        'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
        'Content-Length': body.byteLength,
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      const status = error instanceof URIError ? 400 : ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) ? 404 : 500;
      res.writeHead(status);
      res.end(status === 400 ? 'Bad request' : status === 404 ? 'Not found' : 'Server error');
    }
  };
}

export function createStaticServer(options) {
  return createServer(createStaticHandler(options));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let host = '127.0.0.1';
  let port = 4173;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host' && args[i + 1]) host = args[++i];
    else if (args[i] === '--port' && args[i + 1]) port = Number(args[++i]);
    else {
      console.error('Usage: node scripts/serve.mjs [--host 127.0.0.1] [--port 4173]');
      process.exit(1);
    }
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Port must be an integer from 1 to 65535.');
    process.exit(1);
  }
  const server = createStaticServer();
  server.on('error', error => {
    console.error(`Could not start server: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    console.log(`Kindred is available at http://${host.includes(':') ? `[${host}]` : host}:${port}`);
    console.log('Serving dist/ only. Press Ctrl+C to stop.');
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
}
