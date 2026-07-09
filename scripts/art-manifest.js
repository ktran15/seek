/**
 * M12 generation manifest — every Gemini image generation is declared here
 * (Rig Bible §6: reference-conditioned, ONE item per generation, consistent
 * prompt pattern). scripts/generate-art.js executes batches from this file.
 *
 * Recipe notes:
 * - Character items are generated WORN on the frozen canonical (not floating
 *   alone) so registration to the 1024² grid is inherited from the reference;
 *   intake then extracts the item layer inside its anchor zone.
 * - Gemini cannot emit alpha: every prompt asks for a plain solid white
 *   background, which the existing intake strip (scripts/process-art.js)
 *   removes.
 * - The shakedown scope (founder gate) is: base-bald + the two mascot states
 *   + the hats slot. Further batches are added HERE after the founder
 *   approves shakedown quality — prompts will be tuned to what we learn.
 */

// Aesthetic §5 descriptor — feed every generation (LOCKED direction).
const STYLE =
  'Stylized mobile-game asset art: bold confident dark outlines, cel-shading ' +
  'with flat planes of light and shadow (no smooth gradients), warm earthy ' +
  'palette (rich grounded greens, browns, creams — never pastel, never ' +
  'washed out), top-left key light, chunky tactile game-art craft in the ' +
  'Clash Royale / Brawl Stars family. Not flat-minimal, not realistic, not ' +
  '3D-rendered.';

const HIKER_REF = 'assets/art/canonical/avatar_body_canonical.png';
const MASCOT_REF = 'assets/art/canonical/mascot_beaver_canonical.png';
// Style anchors for standalone (non-character) art: the founder-approved
// crate (craft level) + mountain (world palette).
const CRATE_REF = 'assets/art/crate-wooden.png';
const MOUNTAIN_REF = 'assets/art/mountain-background.png';

/** Shared prefix for every hiker edit (Rig Bible §6 prompt pattern). */
const ON_HIKER =
  'Using the provided reference character exactly — identical body, pose, ' +
  'proportions, framing, scale, and art style — ';

const ON_MASCOT =
  'Using the provided reference character exactly — the same beaver: ' +
  'identical design, proportions, buck teeth, fur colors, outfit, art ' +
  'style, framing, and scale — ';

const TAIL =
  ` ${STYLE} Full character visible, centered in the exact same position ` +
  'as the reference, on a plain solid pure-white background, 1024x1024.';

/** A worn-cosmetic edit: the item drawn on the frozen base. */
function worn(id, itemDescription) {
  return {
    id,
    out: `assets/art/inbox/${id}.png`,
    refs: [HIKER_REF],
    prompt:
      `${ON_HIKER}dress it in ${itemDescription}. Change NOTHING else: same ` +
      'face, same hair, and the same base tee, shorts, and boots except ' +
      `where the new item naturally covers them.${TAIL}`,
  };
}

const BATCHES = {
  // The layering base for hairstyles smaller than the baked crew cut
  // (PROGRESS M12 decision): one clean de-haired body edit.
  base: [
    {
      id: 'body-bald',
      out: 'assets/art/inbox/body-bald.png',
      refs: [HIKER_REF],
      prompt:
        `${ON_HIKER}edit ONLY the hair: remove it entirely so the character ` +
        'is completely bald. Reconstruct the scalp cleanly with the same ' +
        'skin tone and cel shading; keep the face, ears, eyebrows, and ' +
        `everything else pixel-faithful to the reference.${TAIL}`,
    },
  ],

  // Mascot H2H states (Rig Bible §7; friendly rival, never punishing).
  mascot: [
    {
      id: 'mascot-cheer',
      out: 'assets/art/inbox/mascot-cheer.png',
      refs: [MASCOT_REF],
      prompt:
        `${ON_MASCOT}change ONLY the pose and expression to a triumphant ` +
        'cheer: both arms raised high, big joyful open grin with the buck ' +
        `teeth showing, bright eyes. Warm and friendly, never mocking.${TAIL}`,
    },
    {
      id: 'mascot-defeat',
      out: 'assets/art/inbox/mascot-defeat.png',
      refs: [MASCOT_REF],
      // First roll came back nearly identical to the neutral canonical —
      // the pose change must be spelled out limb by limb.
      prompt:
        `${ON_MASCOT}change ONLY the pose and expression to an exaggerated, ` +
        'comic defeat: head hung low and tilted, whole upper body slumped ' +
        'forward, both arms dangling limply, one big sigh — eyes closed, ' +
        'mouth a wobbly frown with the buck teeth still showing, a single ' +
        'large sweat drop by the head. Clearly just lost, but endearing and ' +
        `funny, never miserable.${TAIL}`,
    },
  ],

  // First cosmetic slot (shakedown): hats — catalog names from the M7 seed.
  // Rarity color language follows the aesthetic §2 ladder (common green,
  // rare blue, epic vermillon/chestnut, legendary gold).
  hats: [
    worn(
      'cos-hats-common',
      'a simple olive-green canvas bucket hat, worn level on the head',
    ),
    worn(
      'cos-hats-rare',
      'a knitted wool scout beanie in rich lake blue with a folded brim, worn snug on the head',
    ),
    worn(
      'cos-hats-epic',
      'a vermillon-red felt adventurer cap with a small chestnut leather band and one striking falcon feather tucked into it',
    ),
    worn(
      'cos-hats-legendary',
      'a gleaming golden crown whose points are shaped like little mountain peaks, cel-shaded metallic gold',
    ),
  ],
};

/** A standalone hero object in the established world style (aesthetic §5:
 *  full rich treatment — texture, cel-shading, outline, 3/4 form). */
function standalone(id, subject) {
  return {
    id,
    out: `assets/art/inbox/${id}.png`,
    refs: [CRATE_REF, MOUNTAIN_REF],
    prompt:
      `Matching the craft level, outline weight, cel-shading, and warm ` +
      `earthy palette of the two reference images exactly, draw ${subject} ` +
      `${STYLE} Single centered object filling most of the frame, on a ` +
      'plain solid pure-white background, 1024x1024.',
  };
}

/** Badge medallions read as a set: identical framing, distinct emblems. */
function badge(id, accent, emblem) {
  return standalone(
    id,
    `a circular embossed achievement badge medallion with a ${accent} rim ` +
      `and ribbon, its center emblem: ${emblem}. Chunky, tactile, ` +
      'prize-like — the same family as a hiking merit badge.',
  );
}

// Founder-directed 2026-07-09: generate the non-character art via the API
// as strong placeholders / possible finals (artist may replace in review).
BATCHES.world = [
  badge(
    'badge-summit-reached',
    'russian-green',
    'a snowy mountain summit with a small planted flag',
  ),
  badge(
    'badge-first-win',
    'bice-blue',
    'a single laurel wreath around a bold number 1',
  ),
  badge(
    'badge-vote-winner',
    'indian-yellow gold',
    'a raised trophy cup with a small heart',
  ),
  badge(
    'badge-perfect-week',
    'cadmium-orange',
    'a ring of seven small stars around one big star',
  ),
  standalone(
    'flag-start',
    'a small triangular trail pennant flag in bice blue on a simple wooden ' +
      'pole, planted at a slight angle in a tiny mound of earth',
  ),
  standalone(
    'flag-planted',
    'a triumphant triangular summit flag in cadmium orange on a wooden ' +
      'pole, planted at a slight angle, waving proudly',
  ),
  standalone(
    'trail',
    'a winding dirt hiking trail segment seen from above, tall vertical ' +
      'S-curve with small rocks and grass tufts along its edges',
  ),
  standalone(
    'summit-state',
    'a snowy mountain summit celebration emblem: the peak tip with a ' +
      'planted cadmium-orange flag and radiating sun rays behind it',
  ),
  standalone(
    'app-logo',
    'an app logo: the word "SEEK" in heavy carved-slab national-park-poster ' +
      'lettering, jungle green with a cadmium-orange mountain peak rising ' +
      'behind the letters',
  ),
  {
    // Founder 2026-07-09: the square-ish lockup reads too small at top-bar
    // height — a wide banner lockup where the letters own the height.
    id: 'app-logo-wide',
    out: 'assets/art/inbox/app-logo-wide.png',
    refs: [CRATE_REF, MOUNTAIN_REF],
    aspect: '16:9',
    prompt:
      'Matching the craft level, outline weight, cel-shading, and warm ' +
      'earthy palette of the two reference images exactly, draw an app ' +
      'wordmark in a WIDE horizontal banner layout: the word "SEEK" in ' +
      'heavy carved-slab national-park-poster lettering, jungle green, the ' +
      'four letters in one line spanning nearly the full width, with a ' +
      'small cadmium-orange mountain peak rising behind the letters. ' +
      `${STYLE} Wide rectangular composition on a plain solid pure-white ` +
      'background.',
  },
  {
    id: 'loading-screen',
    out: 'assets/art/inbox/loading-screen.png',
    refs: [CRATE_REF, MOUNTAIN_REF],
    prompt:
      'A full-frame mobile app loading screen: a warm cream sky over ' +
      'layered earthy green mountains with a winding trail climbing to a ' +
      'sunlit peak with a small orange flag, calm and inviting, generous ' +
      `empty cream space in the upper third. ${STYLE} Full-bleed scene, no ` +
      'text, no characters, 1024x1024.',
  },
];

module.exports = { STYLE, BATCHES };
