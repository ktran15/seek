/**
 * M12 crate recolors (spec §9.3 LOCKED "one design, recolored 5 ways"):
 * derives the blue/red/yellow/gold crates from the accepted wooden master by
 * replacing hue + saturation while preserving lightness — so grain, cel
 * shading, and outline survive and every tier is provably the same design.
 * Tier hues follow the rarity ladder (aesthetic §2): blue = bice blue,
 * red = vermillon, yellow = indian yellow, gold = richer metallic gold.
 *
 * Usage: node scripts/recolor-crates.js   (build-time only; never shipped)
 */
const fs = require('fs');
const { PNG } = require('pngjs');

const MASTER = 'assets/art/crate-wooden.png';

// { hue 0-360, saturation 0-1, lightness lift 0-1 } per tier.
const TIERS = {
  blue: { h: 207, s: 0.64, lift: 0 }, // bice blue #2774B4
  red: { h: 13, s: 0.65, lift: 0 }, // vermillon #D45735
  yellow: { h: 36, s: 0.72, lift: 0.02 }, // indian yellow #ECA945
  gold: { h: 46, s: 0.85, lift: 0.08 }, // brighter metallic gold
};

function rgbToL(r, g, b) {
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  return (max + min) / 2;
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255].map(Math.round);
}

const master = PNG.sync.read(fs.readFileSync(MASTER));

for (const [tier, { h, s, lift }] of Object.entries(TIERS)) {
  const out = new PNG({ width: master.width, height: master.height });
  master.data.copy(out.data);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    let l = rgbToL(d[i], d[i + 1], d[i + 2]);
    l = Math.min(1, l + lift * l); // lift scales with lightness: outline stays dark
    [d[i], d[i + 1], d[i + 2]] = hslToRgb(h, s, l);
  }
  const file = `assets/art/crate-${tier}.png`;
  fs.writeFileSync(file, PNG.sync.write(out));
  console.log(`recolored ${tier} -> ${file}`);
}
