/**
 * M12 throttled Gemini generation runner (spec §14.1: build/admin-time only;
 * the key lives in gitignored .env as GEMINI_API_KEY and never ships).
 *
 * Executes batches from scripts/art-manifest.js against the nano banana
 * image model, reference-conditioned per the Rig Bible §6. Raw outputs land
 * in assets/art/inbox/ (gitignored) for the intake pass (process-art.js /
 * layer extraction) — this script never touches registry assets.
 *
 * HARD rate limits (founder-set, free tier):
 * - max 10 API calls per minute: after every 10 calls the runner sleeps 60s;
 * - max 250 calls per day: attempts are counted in scripts/.gen-quota.json
 *   (gitignored, per calendar date) and the runner REFUSES to exceed the
 *   cap — every attempt counts, including failures and retries.
 * - resume-safe: items whose output file already exists are skipped
 *   (--force regenerates), so re-runs only spend quota on missing items.
 *
 * Usage:
 *   node scripts/generate-art.js <batch|item-id> [more...] [--force]
 *   node scripts/generate-art.js --list          # show batches + quota
 */
const fs = require('fs');
const path = require('path');

const { BATCHES } = require('./art-manifest');

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const CALLS_PER_BURST = 10;
const BURST_WAIT_MS = 60_000;
const DAILY_CAP = 250;
const QUOTA_FILE = path.join(__dirname, '.gen-quota.json');
const INBOX = 'assets/art/inbox';

function apiKey() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env not found — put GEMINI_API_KEY=... there (gitignored).');
  }
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('GEMINI_API_KEY='));
  const key = line?.slice('GEMINI_API_KEY='.length).trim();
  if (!key || key === 'PASTE_YOUR_KEY_HERE') {
    throw new Error('GEMINI_API_KEY missing/placeholder in .env.');
  }
  return key;
}

const today = () => new Date().toISOString().slice(0, 10);

function loadQuota() {
  try {
    const q = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf8'));
    if (q.date === today()) return q;
  } catch {
    /* first run / new day */
  }
  return { date: today(), used: 0 };
}

function spendQuota(quota) {
  quota.used++;
  fs.writeFileSync(QUOTA_FILE, JSON.stringify(quota));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(key, item) {
  const parts = [{ text: item.prompt }];
  for (const ref of item.refs) {
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: fs.readFileSync(ref).toString('base64'),
      },
    });
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '1:1' },
      },
    }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${bodyText.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const body = JSON.parse(bodyText);
  const image = body.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data,
  );
  if (!image) {
    const text = body.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
    throw new Error(`no image in response${text ? ` (model said: ${text.slice(0, 200)})` : ''}`);
  }
  return Buffer.from(image.inlineData.data, 'base64');
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--force');
  const force = process.argv.includes('--force');
  const quota = loadQuota();

  if (args.length === 0 || args.includes('--list')) {
    console.log(`batches: ${Object.keys(BATCHES).join(', ')}`);
    for (const [name, items] of Object.entries(BATCHES)) {
      console.log(`  ${name}: ${items.map((i) => i.id).join(', ')}`);
    }
    console.log(`quota today (${quota.date}): ${quota.used}/${DAILY_CAP} used`);
    return;
  }

  const allItems = Object.values(BATCHES).flat();
  const items = [];
  for (const arg of args) {
    if (BATCHES[arg]) items.push(...BATCHES[arg]);
    else {
      const item = allItems.find((i) => i.id === arg);
      if (!item) throw new Error(`unknown batch/item: ${arg}`);
      items.push(item);
    }
  }

  fs.mkdirSync(INBOX, { recursive: true });
  const key = apiKey();
  let callsThisBurst = 0;
  let ok = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of items) {
    if (!force && fs.existsSync(item.out)) {
      console.log(`- ${item.id}: exists, skipped (use --force to regenerate)`);
      skipped++;
      continue;
    }

    // One retry on transient statuses; BOTH attempts obey burst + daily caps.
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (quota.used >= DAILY_CAP) {
        console.error(
          `DAILY CAP: ${quota.used}/${DAILY_CAP} calls used for ${quota.date} — stopping. Re-run tomorrow (resume skips finished items).`,
        );
        report(ok, failed, skipped, quota);
        return;
      }
      if (callsThisBurst >= CALLS_PER_BURST) {
        console.log(`  …burst of ${CALLS_PER_BURST} reached, waiting 60s`);
        await sleep(BURST_WAIT_MS);
        callsThisBurst = 0;
      }
      callsThisBurst++;
      spendQuota(quota);
      try {
        const png = await callGemini(key, item);
        fs.writeFileSync(item.out, png);
        console.log(`✓ ${item.id} -> ${item.out} (${(png.length / 1024) | 0}kB, call ${quota.used}/${DAILY_CAP})`);
        ok++;
        break;
      } catch (e) {
        const transient = e.status === 429 || e.status === 500 || e.status === 503;
        console.error(`✗ ${item.id} attempt ${attempt}: ${e.message}`);
        if (transient && attempt === 1) {
          console.log('  transient — waiting 65s before the one retry');
          await sleep(65_000);
          callsThisBurst = 0;
        } else {
          failed++;
          break;
        }
      }
    }
  }
  report(ok, failed, skipped, quota);
}

function report(ok, failed, skipped, quota) {
  console.log(
    `done: ${ok} generated, ${failed} failed, ${skipped} skipped | quota ${quota.used}/${DAILY_CAP} (${quota.date})`,
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
