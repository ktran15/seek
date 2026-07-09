/**
 * M12 cosmetic-layer extraction (Rig Bible §6 step 3, the "fiddly" isolation
 * pass): a cosmetic is generated WORN on the frozen canonical so its position
 * is inherited from the reference; this tool cuts the item out into its own
 * transparent 1024² layer, registered to the master grid, by diffing the
 * aligned worn image against the canonical body.
 *
 * Pipeline per item (input = the stripped 1024² worn image):
 *   1. ALIGN to the canonical: the generator reframes each output slightly
 *      and the stripper pads by content bbox (a tall hat shifts the body
 *      down), so we re-derive scale from the ARM-SPAN width (the widest
 *      body rows are unaffected by headwear) and translate feet→feetY,
 *      centering on the span's midline.
 *   2. DIFF inside the slot's anchor zone: a pixel is item, not body, when
 *      the aligned worn pixel exists and differs from the canonical by more
 *      than a noise threshold (regeneration jitter on skin/hair is small;
 *      garment over skin/hair/background is a big jump).
 *   3. CLEAN: drop tiny disconnected diff-blobs (regeneration noise),
 *      keep everything else.
 *   4. Write the layer + a composite QA preview (layer over the canonical)
 *      so drift is visible immediately (Rig Bible §9: verify, regenerate
 *      near-misses — never accept them).
 *
 * Usage:
 *   node scripts/extract-layer.js <slot> <stripped-worn.png> <out-layer.png> [qa-out.png]
 *     slot ∈ anchor-zones.json zones (hats, sunglasses, shirts, ...)
 */
const fs = require('fs');
const { PNG } = require('pngjs');

const ZONES = JSON.parse(fs.readFileSync('assets/art/anchor-zones.json', 'utf8'));
const CANONICAL = 'assets/art/hiker-base.png';

// Canonical registration landmarks (anchor-zones referenceLines / bodyBox).
const BASE_SPAN = ZONES.bodyBox.x[1] - ZONES.bodyBox.x[0]; // arm-span width
const BASE_CENTER_X = (ZONES.bodyBox.x[0] + ZONES.bodyBox.x[1]) / 2;
const BASE_FEET_Y = ZONES.referenceLines.feetY;

// Arm-span sampling rows (canonical coords): mid-torso, hats can't reach.
const SPAN_Y = [380, 620];
const DIFF_THRESHOLD = 55; // euclidean RGB distance = "different object"
const MIN_BLOB = 60; // px; smaller diff islands are regeneration noise

function readPng(p) {
  return PNG.sync.read(fs.readFileSync(p));
}

/** Opaque-content bbox + the widest row span within a y-range. */
function contentStats(png, yRange) {
  const { width: w, height: h, data } = png;
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  let spanW = 0, spanCx = 0;
  for (let y = 0; y < h; y++) {
    let rx0 = -1, rx1 = -1;
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 32) {
        if (rx0 === -1) rx0 = x;
        rx1 = x;
      }
    }
    if (rx0 === -1) continue;
    if (rx0 < x0) x0 = rx0;
    if (rx1 > x1) x1 = rx1;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
    if (y >= yRange[0] && y <= yRange[1] && rx1 - rx0 > spanW) {
      spanW = rx1 - rx0;
      spanCx = (rx0 + rx1) / 2;
    }
  }
  if (x1 === -1) throw new Error('empty image');
  return { x0, x1, y0, y1, spanW, spanCx };
}

/** Sample the worn image (bilinear) at canonical-grid coordinates. */
function makeSampler(png, scale, dx, dy) {
  const { width: w, height: h, data } = png;
  return (cx, cy) => {
    const sx = (cx - dx) / scale;
    const sy = (cy - dy) / scale;
    const x = Math.round(sx), y = Math.round(sy);
    if (x < 0 || y < 0 || x >= w || y >= h) return [0, 0, 0, 0];
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
}

function main() {
  const [slot, wornPath, outPath, qaPath] = process.argv.slice(2);
  const zone = ZONES.zones[slot];
  if (!zone || !wornPath || !outPath) {
    console.error('usage: extract-layer.js <slot> <stripped-worn.png> <out-layer.png> [qa.png]');
    process.exit(1);
  }

  const base = readPng(CANONICAL);
  const worn = readPng(wornPath);
  const W = base.width;

  // 1. Alignment: scale by arm span, then pin feet + span midline.
  // SPAN_Y is in canonical coords; first estimate scale from full-height
  // ratio to locate the torso rows on the worn image, then refine by span.
  const wornStats0 = contentStats(worn, [0, worn.height - 1]);
  const roughScale = (BASE_FEET_Y - 55) / (wornStats0.y1 - wornStats0.y0);
  const torsoRange = [
    Math.round(wornStats0.y0 + (SPAN_Y[0] - 55) / roughScale),
    Math.round(wornStats0.y0 + (SPAN_Y[1] - 55) / roughScale),
  ];
  const wornStats = contentStats(worn, torsoRange);
  const scale = BASE_SPAN / wornStats.spanW;
  const dx = BASE_CENTER_X - wornStats.spanCx * scale;
  const dy = BASE_FEET_Y - wornStats.y1 * scale;
  console.log(
    `${slot}: scale=${scale.toFixed(3)} dx=${dx.toFixed(1)} dy=${dy.toFixed(1)} (span ${wornStats.spanW}px)`,
  );
  const sample = makeSampler(worn, scale, dx, dy);

  // 2. Diff inside the anchor zone.
  const layer = new PNG({ width: W, height: W });
  const bd = base.data;
  const mask = new Uint8Array(W * W);
  for (let y = zone.y[0]; y <= zone.y[1]; y++) {
    for (let x = zone.x[0]; x <= zone.x[1]; x++) {
      if (y < 0 || x < 0 || x >= W || y >= W) continue;
      const [r, g, b, a] = sample(x, y);
      if (a < 100) continue;
      const i = (y * W + x) * 4;
      const baseA = bd[i + 3];
      const dist =
        baseA < 32
          ? 255
          : Math.hypot(r - bd[i], g - bd[i + 1], b - bd[i + 2]);
      if (dist > DIFF_THRESHOLD) mask[y * W + x] = 1;
    }
  }

  // 3. Despeckle: keep connected components >= MIN_BLOB px.
  const seen = new Uint8Array(W * W);
  for (let p = 0; p < W * W; p++) {
    if (!mask[p] || seen[p]) continue;
    const blob = [p];
    seen[p] = 1;
    for (let k = 0; k < blob.length; k++) {
      const q = blob[k];
      const qx = q % W;
      for (const n of [q - 1, q + 1, q - W, q + W]) {
        if (n < 0 || n >= W * W || seen[n] || !mask[n]) continue;
        if ((n === q - 1 && qx === 0) || (n === q + 1 && qx === W - 1)) continue;
        seen[n] = 1;
        blob.push(n);
      }
    }
    if (blob.length < MIN_BLOB) for (const q of blob) mask[q] = 0;
  }

  // 3b. Fill enclosed holes: where the item's color happens to sit within
  // the noise threshold of the body underneath (olive hat over brown hair),
  // the diff leaves pinholes and the base streaks through the composite.
  // Any non-mask pocket NOT reachable from the zone border is inside the
  // item — take it from the worn image.
  const outside = new Uint8Array(W * W);
  const borderStack = [];
  for (let y = zone.y[0]; y <= zone.y[1]; y++) {
    for (let x = zone.x[0]; x <= zone.x[1]; x++) {
      const onBorder =
        y === zone.y[0] || y === zone.y[1] || x === zone.x[0] || x === zone.x[1];
      const p = y * W + x;
      if (onBorder && !mask[p]) {
        outside[p] = 1;
        borderStack.push(p);
      }
    }
  }
  while (borderStack.length) {
    const p = borderStack.pop();
    const px0 = p % W, py0 = (p / W) | 0;
    for (const [nx, ny] of [[px0 - 1, py0], [px0 + 1, py0], [px0, py0 - 1], [px0, py0 + 1]]) {
      if (nx < zone.x[0] || nx > zone.x[1] || ny < zone.y[0] || ny > zone.y[1]) continue;
      const n = ny * W + nx;
      if (outside[n] || mask[n]) continue;
      outside[n] = 1;
      borderStack.push(n);
    }
  }
  let filled = 0;
  for (let y = zone.y[0]; y <= zone.y[1]; y++) {
    for (let x = zone.x[0]; x <= zone.x[1]; x++) {
      const p = y * W + x;
      if (mask[p] || outside[p]) continue;
      const [, , , a] = sample(x, y);
      if (a > 100) {
        mask[p] = 1;
        filled++;
      }
    }
  }
  if (filled > 0) console.log(`  hole-fill: ${filled}px enclosed pinholes taken from worn`);

  let px = 0;
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (!mask[p]) continue;
      const [r, g, b, a] = sample(x, y);
      const i = p * 4;
      layer.data[i] = r;
      layer.data[i + 1] = g;
      layer.data[i + 2] = b;
      layer.data[i + 3] = a;
      px++;
    }
  }
  fs.writeFileSync(outPath, PNG.sync.write(layer));
  console.log(`  layer -> ${outPath} (${px}px)`);

  // 4. Composite QA preview: layer stacked over the canonical.
  if (qaPath) {
    const qa = readPng(CANONICAL);
    for (let p = 0; p < W * W; p++) {
      const i = p * 4;
      const a = layer.data[i + 3] / 255;
      if (a === 0) continue;
      for (let c = 0; c < 3; c++) {
        qa.data[i + c] = Math.round(layer.data[i + c] * a + qa.data[i + c] * (1 - a));
      }
      qa.data[i + 3] = Math.max(qa.data[i + 3], layer.data[i + 3]);
    }
    fs.writeFileSync(qaPath, PNG.sync.write(qa));
    console.log(`  QA composite -> ${qaPath}`);
  }
}

main();
