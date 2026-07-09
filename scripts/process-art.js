/**
 * M12 art-intake tool: turns accepted Gemini generations into registry-ready
 * masters (build-time only; never shipped). Two operations:
 *
 *   strip  — crop away the rounded-rect "card" frame Gemini bakes around
 *            exports (its gray outline would wall off the edge flood fill),
 *            remove the solid near-white background via edge flood fill
 *            (interior whites like teeth/eyes are safe — only pixels
 *            reachable from the border are cleared), erase the residual
 *            light halo on silhouette edges, drop tiny stray blobs the
 *            generator left near the character (pebbles/ground bits — Rig
 *            Bible section 8 forbids baked ground), trim to content, pad to
 *            a centered square, and resize to the 1024x1024 master canvas
 *            (Rig Bible section 1).
 *   resize — plain proportional downscale (opaque scene art, e.g. the
 *            mountain background).
 *
 * Usage:
 *   node scripts/process-art.js strip  <in.png> <out.png> [size=1024] [--erase x,y,w,h]...
 *   node scripts/process-art.js resize <in.png> <out.png> <width>
 *
 * --erase paints a rect of the SOURCE image white before any processing —
 * surgical removal of generator debris the automatic passes can't safely
 * take (e.g. outlined pebbles fused to a boot). Repeatable; source-pixel
 * coordinates so the rect is measured on the original export. Record the
 * exact command used per accepted asset so masters stay reproducible.
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

/** Thin neutral-gray line pixel (the card frame's outline / its soft shadow). */
function isFrameGray(data, i) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const min = Math.min(r, g, b), max = Math.max(r, g, b);
  return max - min < 16 && min >= 150 && !isBackground(data, i);
}

/**
 * Detect the rounded-rect card frame some Gemini exports bake in: from each
 * canvas edge along the center row/column, white → a 1–10px neutral-gray line
 * → white again. Returns the crop box just inside the frame, or null when the
 * image has no such frame (all four sides must match — content never does,
 * its outline is dark/colored).
 */
function findCardCrop(png) {
  const { width: w, height: h, data } = png;
  const scan = (len, at) => {
    let p = 0;
    while (p < len && isBackground(data, at(p) * 4)) p++;
    const runStart = p;
    while (p < len && isFrameGray(data, at(p) * 4)) p++;
    const runLen = p - runStart;
    if (runLen < 1 || runLen > 10 || p >= len) return null;
    return isBackground(data, at(p) * 4) ? p : null;
  };
  const cy = Math.floor(h / 2), cx = Math.floor(w / 2);
  const left = scan(w, (p) => cy * w + p);
  const right = scan(w, (p) => cy * w + (w - 1 - p));
  const top = scan(h, (p) => p * w + cx);
  const bottom = scan(h, (p) => (h - 1 - p) * w + cx);
  if (left == null || right == null || top == null || bottom == null) return null;
  const box = {
    x: left + 2,
    y: top + 2,
    w: w - right - 2 - (left + 2),
    h: h - bottom - 2 - (top + 2),
  };
  return box.w > 0 && box.h > 0 ? box : null;
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

/**
 * Dissolve soft ground/shadow smudges: clear light, near-neutral pixels
 * reachable from the (already transparent) background. The style's bold dark
 * outlines seal every real shape, so this can only eat unoutlined wash —
 * baked dirt/contact shadows (Rig Bible section 8 forbids them). Outlined
 * debris (pebbles) becomes disconnected and falls to despeckle.
 */
function sweepSoftGround(png) {
  const { width: w, height: h, data } = png;
  const soft = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    return lum > 190 && Math.max(r, g, b) - Math.min(r, g, b) < 45;
  };
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] === 0) { seen[p] = 1; stack.push(p); }
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p / w) | 0;
    for (const q of [p - 1, p + 1, p - w, p + w]) {
      if (q < 0 || q >= w * h || seen[q]) continue;
      if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
      seen[q] = 1;
      if (data[q * 4 + 3] > 0 && soft(q * 4)) {
        data[q * 4 + 3] = 0;
        stack.push(q);
      }
    }
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

/**
 * Remove opaque blobs disconnected from the main art and tiny relative to it
 * (stray pebbles/ground bits). Threshold is a fraction of the largest
 * component so it scales with input resolution; intentional multi-part
 * layers (e.g. a boots pair) are orders of magnitude above it.
 */
function despeckle(png) {
  const { width: w, height: h, data } = png;
  const label = new Int32Array(w * h); // 0 = unvisited/transparent
  const areas = [0];
  for (let start = 0; start < w * h; start++) {
    if (label[start] || data[start * 4 + 3] <= 8) continue;
    const id = areas.length;
    let area = 0;
    const stack = [start];
    label[start] = id;
    while (stack.length) {
      const p = stack.pop();
      area++;
      const x = p % w, y = (p / w) | 0;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        if (!label[q] && data[q * 4 + 3] > 8) { label[q] = id; stack.push(q); }
      }
    }
    areas.push(area);
  }
  const largest = Math.max(...areas);
  const minArea = Math.max(48, Math.round(largest * 0.0025));
  const drop = new Set(areas.map((a, id) => (id && a < minArea ? id : 0)).filter(Boolean));
  if (drop.size === 0) return;
  let cleared = 0;
  for (let p = 0; p < w * h; p++) {
    if (drop.has(label[p])) { data[p * 4 + 3] = 0; cleared++; }
  }
  console.log(`  despeckle: removed ${drop.size} stray blob(s), ${cleared}px total (min area ${minArea})`);
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

async function strip(inPath, outPath, size, erases) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  let png = PNG.sync.read(fs.readFileSync(inPath));
  for (const [ex, ey, ew, eh] of erases) {
    for (let y = ey; y < Math.min(ey + eh, png.height); y++) {
      for (let x = ex; x < Math.min(ex + ew, png.width); x++) {
        png.data.fill(255, (y * png.width + x) * 4, (y * png.width + x) * 4 + 4);
      }
    }
    console.log(`  erase: ${ex},${ey} ${ew}x${eh} painted white`);
  }
  const card = findCardCrop(png);
  if (card) {
    const inner = new PNG({ width: card.w, height: card.h });
    PNG.bitblt(png, inner, card.x, card.y, card.w, card.h, 0, 0);
    png = inner;
    console.log(`  de-card: cropped inside the baked card frame (${card.w}x${card.h})`);
  }
  floodClear(png);
  sweepSoftGround(png);
  cleanHalo(png);
  despeckle(png);
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
  const args = process.argv.slice(2);
  const erases = [];
  for (let i = args.indexOf('--erase'); i !== -1; i = args.indexOf('--erase')) {
    const rect = (args[i + 1] || '').split(',').map(Number);
    if (rect.length !== 4 || rect.some((n) => !Number.isFinite(n) || n < 0)) {
      console.error(`bad --erase rect: ${args[i + 1]} (want x,y,w,h)`);
      process.exit(1);
    }
    erases.push(rect);
    args.splice(i, 2);
  }
  const [op, inPath, outPath, arg] = args;
  if (op === 'strip') await strip(inPath, outPath, Number(arg) || 1024, erases);
  else if (op === 'resize') await resize(inPath, outPath, Number(arg));
  else {
    console.error('usage: process-art.js strip|resize <in.png> <out.png> [size|width] [--erase x,y,w,h]...');
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
