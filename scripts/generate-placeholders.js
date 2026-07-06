/**
 * Generates solid-color placeholder PNGs for every asset registry slot
 * (build-time tool; no dependencies). Real art replaces these files in M12 —
 * same filenames, zero code change (spec §4.2).
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

const outDir = path.join(__dirname, '..', 'assets', 'placeholders');
fs.mkdirSync(outDir, { recursive: true });
for (const [name, [color, w, h]] of Object.entries(SLOTS)) {
  fs.writeFileSync(path.join(outDir, `${name}.png`), makePng(w, h, color));
  console.log(`  ${name}.png (${w}x${h} ${color})`);
}
console.log(`\nWrote ${Object.keys(SLOTS).length} placeholders to ${outDir}`);
