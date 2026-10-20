import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { assets, root } from './build.js';

const { values } = parseArgs({ options: {
  host: { type: 'string', default: '127.0.0.1' },
  port: { type: 'string', default: '3000' },
} });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('Port must be an integer between 0 and 65535');
}
const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', jpg: 'image/jpeg' };
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = pathname === '/' ? 'index.html' : pathname.slice(1);
    // Only expose publishable assets, never repository files or local secrets.
    if (path.includes('\\') || path.split('/').some(part => part.startsWith('.')) ||
        !assets.some(asset => path === asset || (['src', 'images'].includes(asset) && path.startsWith(`${asset}/`)))) {
      response.writeHead(404).end('Not found');
      return;
    }
    const body = await readFile(new URL(path, root));
    response.writeHead(200, {
      'Content-Type': types[path.split('.').pop()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404).end('Not found');
  }
});
server.on('error', error => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, values.host, () => {
  console.log(`Dev server: http://${values.host}:${server.address().port}`);
});
