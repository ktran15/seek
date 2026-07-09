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
      prompt:
        `${ON_MASCOT}change ONLY the pose and expression to a good-natured ` +
        'defeat: shoulders slumped, ears drooping, a sheepish "you got me" ' +
        `smile — endearing and comic, never miserable.${TAIL}`,
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

module.exports = { STYLE, BATCHES };
