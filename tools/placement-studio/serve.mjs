/**
 * Placement Studio local server — zero dependencies, Node's http only.
 *
 *   npm run placement        (or: node tools/placement-studio/serve.mjs)
 *
 * Serves the tool at http://localhost:4173 and wires it to the repo's
 * placement file: the page auto-loads assets/art/beaver-placement.json on
 * open and Save writes straight back to it — no Link step, no browser
 * file-picker. Anyone who pulls the repo runs the same command and edits the
 * same file; commit + push the JSON like any other change.
 *
 * Binds to 127.0.0.1 only (this writes to your working tree — local use).
 */
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.resolve(here, '../../assets/art/beaver-placement.json');
const PORT = 4173;

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(path.join(here, 'index.html')));
      return;
    }
    if (req.method === 'GET' && req.url === '/api/placement') {
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
    if (req.method === 'PUT' && req.url === '/api/placement') {
      let body = '';
      for await (const chunk of req) body += chunk;
      JSON.parse(body); // reject broken payloads before touching the file
      await writeFile(JSON_PATH, body);
      res.writeHead(200);
      res.end('ok');
      return;
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
  console.log(`reads/writes      →  ${JSON_PATH}`);
});
