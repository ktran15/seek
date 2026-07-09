/**
 * Brand asset derivation (founder-directed, pre-M13): turns the generated
 * "SEEK" logo master (assets/art/app-logo.png, 1024² transparent with
 * intake margins) into every place the brand mark appears:
 *
 *   assets/art/app-logo-wordmark.png   tight-trimmed transparent wordmark
 *                                      (for inline UI: top bar, auth) —
 *                                      registry slot `appLogoWordmark`
 *   assets/images/icon.png             app icon: wordmark on a cream box
 *   assets/images/splash-icon.png      Expo splash image (transparent)
 *   assets/images/android-icon-foreground.png  wordmark in the adaptive
 *                                      safe zone; background = cream
 *   assets/images/android-icon-background.png
 *
 * Deterministic — rerun after any logo change: node scripts/make-icons.js
 */
const fs = require('fs');
const { PNG } = require('pngjs');
const Jimp = require('jimp-compact');

const CREAM = 0xf5ece3ff;
const MASTER = 'assets/art/app-logo.png';

/** Trim to the alpha bbox plus a small breathing margin. */
function trim(png, pad = 12) {
  const { width: w, height: h, data } = png;
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 === -1) throw new Error('empty logo master');
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad);
  y1 = Math.min(h - 1, y1 + pad);
  const out = new PNG({ width: x1 - x0 + 1, height: y1 - y0 + 1 });
  PNG.bitblt(png, out, x0, y0, out.width, out.height, 0, 0);
  return out;
}

async function main() {
  const master = PNG.sync.read(fs.readFileSync(MASTER));
  const wordmarkPng = trim(master);
  fs.writeFileSync('assets/art/app-logo-wordmark.png', PNG.sync.write(wordmarkPng));
  console.log(
    `wordmark ${wordmarkPng.width}x${wordmarkPng.height} -> assets/art/app-logo-wordmark.png`,
  );

  const wordmark = await Jimp.read('assets/art/app-logo-wordmark.png');

  // App icon: cream box, wordmark centered at ~78% width.
  const icon = new Jimp(1024, 1024, CREAM);
  const iconMark = wordmark.clone().contain(800, 800);
  icon.composite(iconMark, (1024 - iconMark.getWidth()) / 2, (1024 - iconMark.getHeight()) / 2);
  await icon.writeAsync('assets/images/icon.png');
  console.log('app icon (cream box) -> assets/images/icon.png');

  // Splash image: transparent wordmark (the splash background color is the
  // cream from app.config.ts).
  const splash = wordmark.clone().contain(600, 400);
  await splash.writeAsync('assets/images/splash-icon.png');
  console.log('splash image -> assets/images/splash-icon.png');

  // Android adaptive icon: foreground keeps the mark inside the ~66% safe
  // zone; background is the plain cream box.
  const fg = new Jimp(1024, 1024, 0x00000000);
  const fgMark = wordmark.clone().contain(620, 620);
  fg.composite(fgMark, (1024 - fgMark.getWidth()) / 2, (1024 - fgMark.getHeight()) / 2);
  await fg.writeAsync('assets/images/android-icon-foreground.png');
  const bg = new Jimp(1024, 1024, CREAM);
  await bg.writeAsync('assets/images/android-icon-background.png');
  console.log('android adaptive fg/bg -> assets/images/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
