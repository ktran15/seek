/**
 * Generates placeholder PNGs for asset registry slots (build-time tool; no
 * dependencies). Real art replaces these files in M12 — same filenames, zero
 * code change (spec §4.2). Two kinds:
 *
 *   - solid-color rectangles for standalone slots (logo, flags, badges…)
 *   - avatar LAYER placeholders: a transparent 1024² master canvas with a
 *     translucent rarity-colored box at the slot's LOCKED-ON-BASE anchor
 *     zone (assets/art/anchor-zones.json), so equipped cosmetics composite
 *     over the frozen base with real registration before their art exists.
 *
 * Usage: node scripts/generate-placeholders.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = (table[(crc ^ b) & 0xff] ^ (crc >>> 8)) >>> 0;
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Solid-color RGBA PNG with a slightly darker border so edges are visible. */
function makePng(width, height, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dark = (v) => Math.max(0, Math.round(v * 0.6));
  const border = Math.max(4, Math.round(width / 32));

  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const edge =
        x < border || y < border || x >= width - border || y >= height - border;
      const o = 1 + x * 4;
      row[o] = edge ? dark(r) : r;
      row[o + 1] = edge ? dark(g) : g;
      row[o + 2] = edge ? dark(b) : b;
      row[o + 3] = 255;
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Transparent 1024² layer canvas with a translucent box (solid border) over
 * the given anchor zone — visible, correctly registered, obviously fake.
 */
function makeLayerPng(zone, hex) {
  const size = 1024;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dark = (v) => Math.max(0, Math.round(v * 0.6));
  const [x0, x1] = zone.x;
  const [y0, y1] = zone.y;
  const border = 6;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: none
    if (y >= y0 && y <= y1) {
      for (let x = x0; x <= x1; x++) {
        const edge = x - x0 < border || x1 - x < border || y - y0 < border || y1 - y < border;
        const o = 1 + x * 4;
        row[o] = edge ? dark(r) : r;
        row[o + 1] = edge ? dark(g) : g;
        row[o + 2] = edge ? dark(b) : b;
        row[o + 3] = edge ? 255 : 150;
      }
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// slot → [color, width, height]. Colors loosely evoke the final asset so the
// placeholder shell reads sensibly (crate tiers, greens for the mountain...).
const SLOTS = {
  'app-logo': ['#EC8340', 512, 512],
  'loading-screen': ['#F5ECE3', 1024, 1024],
  'mascot-avatar': ['#A44F3C', 512, 512],
  'mascot-cheer': ['#ECA945', 512, 512],
  'mascot-defeat': ['#B5D7CC', 512, 512],
  'mountain-background': ['#779F6F', 1024, 1536],
  trail: ['#D45735', 256, 1024],
  'flag-start': ['#2774B4', 256, 256],
  'flag-planted': ['#EC8340', 256, 256],
  'summit-state': ['#ECA945', 512, 512],
  'hiker-base': ['#3D4625', 512, 512],
  'crate-wooden': ['#A44F3C', 512, 512],
  'crate-blue': ['#2774B4', 512, 512],
  'crate-red': ['#D45735', 512, 512],
  'crate-yellow': ['#ECA945', 512, 512],
  'crate-gold': ['#EC8340', 512, 512],
  'badge-summit-reached': ['#779F6F', 256, 256],
  'badge-first-win': ['#2774B4', 256, 256],
  'badge-vote-winner': ['#ECA945', 256, 256],
  'badge-perfect-week': ['#EC8340', 256, 256],
};

// Cosmetic layer placeholders: 8 slots × 4 rarities (the catalog's 32
// asset_slot_name values, M7 seed), boxed at the slot's anchor zone and
// tinted with the rarity token color (src/theme colors.rarity).
const ZONES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'assets', 'art', 'anchor-zones.json'), 'utf8'),
).zones;
const RARITY_COLORS = {
  common: '#779F6F',
  rare: '#2774B4',
  epic: '#D45735',
  legendary: '#ECA945',
};
const COSMETIC_SLOTS = [
  'boots', 'pants', 'backpack', 'hats', 'sunglasses', 'shirts', 'jacket', 'pet',
];

const outDir = path.join(__dirname, '..', 'assets', 'placeholders');
fs.mkdirSync(outDir, { recursive: true });
for (const [name, [color, w, h]] of Object.entries(SLOTS)) {
  fs.writeFileSync(path.join(outDir, `${name}.png`), makePng(w, h, color));
  console.log(`  ${name}.png (${w}x${h} ${color})`);
}
let layerCount = 0;
for (const slot of COSMETIC_SLOTS) {
  for (const [rarity, color] of Object.entries(RARITY_COLORS)) {
    const name = `cos-${slot}-${rarity}.png`;
    fs.writeFileSync(path.join(outDir, name), makeLayerPng(ZONES[slot], color));
    layerCount++;
  }
  console.log(`  cos-${slot}-{common,rare,epic,legendary}.png (1024² layers)`);
}
console.log(
  `\nWrote ${Object.keys(SLOTS).length} placeholders + ${layerCount} cosmetic layers to ${outDir}`,
);
