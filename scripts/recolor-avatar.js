/**
 * M12 avatar recolors (Rig Bible §4.3: "skin-tone variants = shape-identical
 * recolors of the frozen body — only hue changes"): selects the part's
 * pixels by an HSL band (bold outlines and clothes fall outside it), then
 * replaces hue/saturation and scales lightness multiplicatively so the cel
 * shading survives on darker tones. Deterministic build-time tool; outputs
 * are verified visually before acceptance.
 *
 * Usage:
 *   node scripts/recolor-avatar.js skin
 *     assets/art/hiker-base.png -> assets/art/body-skin{1..5}.png
 *     (catalog SKIN_TONES; skin2 is the master's own tone and round-trips)
 *   node scripts/recolor-avatar.js hair <in.png> <out-prefix>
 *     isolated hair layer -> <out-prefix>-hc{1..5}.png (catalog HAIR_COLORS;
 *     the M12 batch pass runs this per hair style)
 */
const fs = require('fs');
const { PNG } = require('pngjs');

// Catalog swatches (src/features/avatar/catalog.ts) — ids are stable.
const SKIN_TONES = {
  skin1: '#F6D7BD',
  skin2: '#E8B98F',
  skin3: '#C68E62',
  skin4: '#96613C',
  skin5: '#5E3A22',
};
const HAIR_COLORS = {
  hc1: '#1E1B18',
  hc2: '#4A3222',
  hc3: '#8C5A2B',
  hc4: '#C98A3D',
  hc5: '#A44F3C',
};

// HSL band selecting the part's pixels on the source image. Skin: warm hue,
// mid-to-high lightness (no saturation ceiling — HSL saturation blows up on
// near-white highlights). Hair: same warm family, low lightness — meant for
// ISOLATED hair layers where nothing else competes.
const BANDS = {
  skin: { hue: [8, 34], sat: [0.15, 1], light: [0.5, 0.97] },
  hair: { hue: [5, 45], sat: [0.15, 1], light: [0.06, 0.55] },
};

// The base shirt is rust — the same warm hue family as skin, overlapping it
// in HSL where the shirt catches light. It can't be separated by color
// alone, but the style's dark outlines seal every garment: flood from
// unambiguous shirt-core pixels through warm mid-tones and the mask stops
// at the collar/sleeve outlines, never reaching real skin.
const SHIRT_SEED = { hue: [5, 25], sat: [0.4, 1], light: [0.28, 0.5] };
const SHIRT_GROW = { hue: [0, 40], sat: [0.25, 1], light: [0.25, 0.7] };

// Skin SHADOWS (under-chin/neck, under-sleeve wedges) sit BELOW the skin
// band's lightness floor (probe: the neck shadow's core is h16 s.5 l.45,
// deeper wedges to l.30) — with a plain band test they stayed the master's
// original tone, reading as an off-hue pale/greenish patch on dark recolors.
// Same cure as the shirt: flood from unambiguous skin through the shadow
// tones; the near-black outlines (l<.26) seal the region, and the shirt
// mask is passed as a hard wall so the warm rust shirt (inside this grow
// band) can never be reached even where an outline is soft.
//
// The widened grow applies ONLY between the face and the sock tops
// (SKIN_GROW_MIN_Y < y <= SKIN_GROW_MAX_Y): applied at head height it leaked
// into hair mid-tones, and at ankle height it swallowed the tan socks (their
// hue sits inside the band; only their pale lightness had kept them out).
// Everywhere outside the gate the grow band IS the strict band — behavior
// there is identical to the founder-approved originals; the extension only
// reaches the neck / arm / leg shadow wedges that discolored on dark tones.
const SKIN_GROW = { hue: [5, 34], sat: [0.15, 1], light: [0.26, 0.97] };
const SKIN_GROW_MIN_Y = 215; // below the chin (anchor chinY=232, with margin)
const SKIN_GROW_MAX_Y = 810; // above the sock tops (~y815)

/** Alpha-aware flood mask: seed pixels expand through grow-band neighbors;
 *  `walls` pixels (e.g. the shirt mask) are impassable and never included.
 *  `growBand` may be a function of y (per-row band). */
function floodMask(png, seedBand, growBand, walls) {
  const { width: w, height: h, data } = png;
  const bandAt = typeof growBand === 'function' ? growBand : () => growBand;
  const mask = new Uint8Array(w * h);
  const stack = [];
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] < 64 || (walls && walls[p])) continue;
    const hsl = rgbToHsl(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    if (inBand(hsl, seedBand)) { mask[p] = 1; stack.push(p); }
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    for (const q of [p - 1, p + 1, p - w, p + w]) {
      if (q < 0 || q >= w * h || mask[q]) continue;
      if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
      if (data[q * 4 + 3] < 64 || (walls && walls[q])) continue;
      const hsl = rgbToHsl(data[q * 4], data[q * 4 + 1], data[q * 4 + 2]);
      if (inBand(hsl, bandAt((q / w) | 0))) { mask[q] = 1; stack.push(q); }
    }
  }
  return mask;
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const rr = r / 255, gg = g / 255, bb = b / 255;
  let h;
  if (max === rr) h = 60 * (((gg - bb) / d) % 6);
  else if (max === gg) h = 60 * ((bb - rr) / d + 2);
  else h = 60 * ((rr - gg) / d + 4);
  return { h: (h + 360) % 360, s, l };
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

function hexToHsl(hex) {
  return rgbToHsl(
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  );
}

const inBand = (hsl, band) =>
  hsl.h >= band.hue[0] && hsl.h <= band.hue[1] &&
  hsl.s >= band.sat[0] && hsl.s <= band.sat[1] &&
  hsl.l >= band.light[0] && hsl.l <= band.light[1];

/** Median lightness of the selected pixels = the part's reference tone. */
function baseLightness(png, band) {
  const ls = [];
  const d = png.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 64) continue;
    const hsl = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (inBand(hsl, band)) ls.push(hsl.l);
  }
  if (ls.length === 0) throw new Error('no pixels matched the band — wrong input?');
  ls.sort((a, b) => a - b);
  return ls[Math.floor(ls.length / 2)];
}

function recolor(srcPath, outPath, band, targetHex, baseL, opts = {}) {
  const png = PNG.sync.read(fs.readFileSync(srcPath));
  const { exclude, include, yRange = [0, png.height] } = opts;
  const target = hexToHsl(targetHex);
  const d = png.data;
  const w = png.width;
  let touched = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const p = i / 4;
    const y = (p / w) | 0;
    if (y < yRange[0] || y > yRange[1]) continue;
    if (exclude && exclude[p]) continue;
    const hsl = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    // `include` (the flood mask) supersedes the band test — the mask already
    // encodes membership, and it reaches the sub-band shadow tones.
    if (include ? !include[p] : !inBand(hsl, band)) continue;
    const l = Math.max(0.02, Math.min(0.98, hsl.l * (target.l / baseL)));
    [d[i], d[i + 1], d[i + 2]] = hslToRgb(target.h, target.s, l);
    touched++;
  }
  fs.writeFileSync(outPath, PNG.sync.write(png));
  console.log(`  ${outPath} (${targetHex}, ${touched}px recolored)`);
}

const [mode, inArg, outArg] = process.argv.slice(2);
if (mode === 'skin') {
  const src = 'assets/art/hiker-base.png';
  const master = PNG.sync.read(fs.readFileSync(src));
  const baseL = baseLightness(master, BANDS.skin);
  const shirtMask = floodMask(master, SHIRT_SEED, SHIRT_GROW);
  // Skin mask: seed = the strict band (certain skin); grow = shadow tones
  // below the face, the strict band itself at head height (no change there);
  // shirt mask as walls. Catches the under-chin/neck shadow the band missed.
  const skinMask = floodMask(
    master,
    BANDS.skin,
    (y) => (y > SKIN_GROW_MIN_Y && y <= SKIN_GROW_MAX_Y ? SKIN_GROW : BANDS.skin),
    shirtMask,
  );
  // Skin exists only between the hair fringe and the sock tops — the y-cuts
  // keep hair highlights and boot leather out (anchor-zones: boots start 855).
  const opts = { exclude: shirtMask, include: skinMask, yRange: [96, 854] };
  console.log(`skin recolors from ${src} (base skin L=${baseL.toFixed(3)})`);
  for (const [id, hex] of Object.entries(SKIN_TONES)) {
    recolor(src, `assets/art/body-${id}.png`, BANDS.skin, hex, baseL, opts);
  }
} else if (mode === 'hair') {
  if (!inArg || !outArg) {
    console.error('usage: recolor-avatar.js hair <in.png> <out-prefix>');
    process.exit(1);
  }
  const baseL = baseLightness(PNG.sync.read(fs.readFileSync(inArg)), BANDS.hair);
  console.log(`hair recolors from ${inArg} (base hair L=${baseL.toFixed(3)})`);
  for (const [id, hex] of Object.entries(HAIR_COLORS)) {
    recolor(inArg, `${outArg}-${id}.png`, BANDS.hair, hex, baseL);
  }
} else {
  console.error('usage: recolor-avatar.js skin | hair <in.png> <out-prefix>');
  process.exit(1);
}
