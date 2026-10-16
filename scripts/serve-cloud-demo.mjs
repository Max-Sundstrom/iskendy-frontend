import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

// Deliberately no SPA fallback: reproduce the static host's real 404 responses.
const root = resolve('dist-demo');
const prefix = '/iskendy-frontend/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) throw new Error('Outside demo');
    let file = resolve(
      root,
      decodeURIComponent(url.pathname.slice(prefix.length)),
    );
    if (file !== root && !file.startsWith(root + sep))
      throw new Error('Outside root');
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        response.writeHead(301, { Location: url.pathname + '/' + url.search });
        response.end();
        return;
      }
      file = resolve(file, 'index.html');
    }
    const bytes = await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(bytes);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(4191, '127.0.0.1', () => {
  console.log('Static demo: http://127.0.0.1:4191' + prefix);
});
