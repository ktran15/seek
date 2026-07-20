/**
 * Placement Studio local server — zero dependencies, Node's http only.
 *
 *   npm run placement        (or: node tools/placement-studio/serve.mjs)
 *
 * Serves the tool at http://localhost:4173 and persists BOTH halves of a
 * session into the repo, so nothing has to be re-loaded next time:
 *   - assets/art/beaver-placement.json           the placements (coordinates)
 *   - assets/art/beaver/bodies/<name>.png        the body art you load
 *   - assets/art/beaver/cosmetics/<name>.png     the cosmetic art you load
 *
 * On open the page lists the saved images, reloads each one, and re-applies its
 * saved placement — so you pick up exactly where you left off. Commit the images
 * + JSON like any other asset.
 *
 * Binds to 127.0.0.1 only (this writes to your working tree — local use).
 */
import http from 'node:http';
import { readFile, writeFile, readdir, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '../../assets/art');
const JSON_PATH = path.join(ASSETS, 'beaver-placement.json');
const IMG_ROOT = path.join(ASSETS, 'beaver');
const KIND_DIR = {
  bodies: path.join(IMG_ROOT, 'bodies'),
  cosmetics: path.join(IMG_ROOT, 'cosmetics'),
};
const PORT = 4173;

/** basename + .png only — blocks path traversal and non-image writes. */
const safeName = (n) => {
  const base = path.basename(n || '');
  return /^[\w.\- ]+\.png$/i.test(base) ? base : null;
};

async function listPng(dir) {
  try {
    return (await readdir(dir)).filter((f) => /\.png$/i.test(f)).sort();
  } catch {
    return []; // folder not created yet
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);

    // ---- the tool itself ----
    if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(path.join(here, 'index.html')));
      return;
    }

    // ---- placements (coordinates JSON) ----
    if (url === '/api/placement') {
      if (req.method === 'GET') {
        try {
          const data = await readFile(JSON_PATH);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        } catch {
          res.writeHead(204); // no file yet — the first Save creates it
          res.end();
        }
        return;
      }
      if (req.method === 'PUT') {
        let body = '';
        for await (const chunk of req) body += chunk;
        JSON.parse(body); // reject broken payloads before touching the file
        await writeFile(JSON_PATH, body);
        res.writeHead(200);
        res.end('ok');
        return;
      }
    }

    // ---- image manifest: what art is persisted ----
    if (req.method === 'GET' && url === '/api/images') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        bodies: await listPng(KIND_DIR.bodies),
        cosmetics: await listPng(KIND_DIR.cosmetics),
      }));
      return;
    }

    // ---- a single image: /api/images/<kind>/<name>.png ----
    const m = url.match(/^\/api\/images\/(bodies|cosmetics)\/(.+)$/);
    if (m) {
      const dir = KIND_DIR[m[1]];
      const name = safeName(m[2]);
      if (!name) { res.writeHead(400); res.end('bad name'); return; }
      const file = path.join(dir, name);

      if (req.method === 'GET') {
        try {
          res.writeHead(200, { 'Content-Type': 'image/png' });
          res.end(await readFile(file));
        } catch { res.writeHead(404); res.end(); }
        return;
      }
      if (req.method === 'PUT') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk); // BINARY: keep Buffers
        await mkdir(dir, { recursive: true });
        await writeFile(file, Buffer.concat(chunks));
        res.writeHead(200);
        res.end('ok');
        return;
      }
      if (req.method === 'DELETE') {
        try { await unlink(file); } catch { /* already gone */ }
        res.writeHead(200);
        res.end('ok');
        return;
      }
    }

    res.writeHead(404);
    res.end();
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Placement Studio  →  http://localhost:${PORT}`);
  console.log(`placements        →  ${JSON_PATH}`);
  console.log(`images            →  ${IMG_ROOT}/{bodies,cosmetics}`);
});
