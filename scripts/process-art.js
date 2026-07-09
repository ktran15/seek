/**
 * M12 art-intake tool: turns accepted Gemini generations into registry-ready
 * masters (build-time only; never shipped). Two operations:
 *
 *   strip  — remove a solid near-white background via edge flood fill
 *            (interior whites like teeth/eyes are safe — only pixels
 *            reachable from the border are cleared), erase the residual
 *            light halo on silhouette edges, trim to content, pad to a
 *            centered square, and resize to the 1024x1024 master canvas
 *            (Rig Bible section 1).
 *   resize — plain proportional downscale (opaque scene art, e.g. the
 *            mountain background).
 *
 * Usage:
 *   node scripts/process-art.js strip  <in.png> <out.png> [size=1024]
 *   node scripts/process-art.js resize <in.png> <out.png> <width>
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const Jimp = require('jimp-compact');

const WHITE_TOL = 23; // min channel above 255-tol and near-neutral = background
const MARGIN = 0.06; // padding around the trimmed content on the square canvas

function isBackground(data, i) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const min = Math.min(r, g, b), max = Math.max(r, g, b);
  return min > 255 - WHITE_TOL && max - min < 14;
}

/** Clear every background pixel reachable from the canvas border. */
function floodClear(png) {
  const { width: w, height: h, data } = png;
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const p = y * w + x;
    if (!seen[p] && data[p * 4 + 3] > 0 && isBackground(data, p * 4)) {
      seen[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p / w) | 0;
    data[p * 4 + 3] = 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
}

/** Erase the light anti-aliased halo left where art blended into white. */
function cleanHalo(png) {
  const { width: w, height: h, data } = png;
  for (let pass = 0; pass < 2; pass++) {
    const clear = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] === 0) continue;
        const nearBg =
          (x > 0 && data[i - 4 + 3] === 0) ||
          (x < w - 1 && data[i + 4 + 3] === 0) ||
          (y > 0 && data[i - w * 4 + 3] === 0) ||
          (y < h - 1 && data[i + w * 4 + 3] === 0);
        if (!nearBg) continue;
        const lum = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
        if (lum > 228) clear.push(i);
        else if (lum > 200) data[i + 3] = Math.round(((228 - lum) / 28) * 255);
      }
    }
    for (const i of clear) data[i + 3] = 0;
    if (clear.length === 0) break;
  }
}

/** Bounding box of visible pixels. */
function contentBox(png) {
  const { width: w, height: h, data } = png;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('image is fully transparent after strip');
  return { minX, minY, maxX, maxY };
}

async function strip(inPath, outPath, size) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const png = PNG.sync.read(fs.readFileSync(inPath));
  floodClear(png);
  cleanHalo(png);
  const { minX, minY, maxX, maxY } = contentBox(png);
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const side = Math.round(Math.max(bw, bh) * (1 + MARGIN * 2));
  const canvas = new PNG({ width: side, height: side });
  PNG.bitblt(
    png, canvas, minX, minY, bw, bh,
    Math.round((side - bw) / 2), Math.round((side - bh) / 2),
  );
  const img = await Jimp.read(PNG.sync.write(canvas));
  await img.resize(size, size).writeAsync(outPath);
  console.log(`strip: ${inPath} -> ${outPath} (content ${bw}x${bh}, master ${size}x${size})`);
}

async function resize(inPath, outPath, width) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const img = await Jimp.read(inPath);
  await img.resize(width, Jimp.AUTO).writeAsync(outPath);
  console.log(`resize: ${inPath} -> ${outPath} (${img.bitmap.width}x${img.bitmap.height})`);
}

(async () => {
  const [op, inPath, outPath, arg] = process.argv.slice(2);
  if (op === 'strip') await strip(inPath, outPath, Number(arg) || 1024);
  else if (op === 'resize') await resize(inPath, outPath, Number(arg));
  else {
    console.error('usage: process-art.js strip|resize <in.png> <out.png> [size|width]');
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
