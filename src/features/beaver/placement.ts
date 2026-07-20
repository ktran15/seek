/**
 * Per-item cosmetic/body placement (Rig Bible §5, rewritten 2026-07-16).
 *
 * `assets/art/beaver-placement.json` is authored in the Placement Studio
 * (tools/placement-studio) and is keyed by the TOOL's filename-derived keys
 * (`crown`, `blueHat`, `cropBrownM`, …), NOT by registry slot names — the
 * founder edits art by filename there. This module owns the slot-name →
 * placement-key mapping and resolves a slot to concrete draw values.
 *
 * Coordinate model (identical to the tool):
 *   - canvas: 1024×1024 composite grid; (0,0) offsets measure from its center
 *   - x/y: the item's CENTER offset from canvas center, in canvas px
 *   - w/h: the art's natural pixel size (drawn at w×h, then transformed)
 *   - scale/rotation: about the item's center; omitted in the JSON = 1 / 0°
 *   - z: stacking; omitted = the TOOL's keyword default for that key (NOT the
 *     rig slot default — e.g. `bow` matches no keyword and sat at z5 while the
 *     founder placed it, so it must resolve to 5 here too or stacking drifts
 *     from what was approved). Bodies always render at z1 (Rig Bible §3).
 *
 * Pure and unit-tested: a silently missing/misresolved placement renders wrong
 * with no error (§2.1 invisible-when-wrong). The completeness test pins every
 * mapped key to an existing JSON entry, so a renamed art file fails loudly.
 */
import placementData from '@/assets/art/beaver-placement.json';

/** Composite canvas size the offsets are authored against. */
export const PLACEMENT_CANVAS: number = placementData.canvas ?? 1024;

/** The body layer's z (Rig Bible §3: tails 0 → body 1 → gloves 2 → eyes 3 → hats 4). */
export const BODY_Z = 1;

interface RawPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
  scale?: number;
  rotation?: number;
  z?: number;
}

export interface ResolvedPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  rotation: number;
  z: number;
}

/**
 * Registry slot → placement-JSON key, for every slot that renders on the
 * composite grid. Explicit table (no pattern derivation): two body filenames
 * are irregular (`FUnhappyBlackCropped`, `BlackNeglectedCropped`) and the tool
 * keys are filename-derived, so patterns would silently miss them.
 */
export const PLACEMENT_KEYS: Readonly<Record<string, string>> = {
  // bodies — thriving (Crop{Color}{Sex}, the unmarked default pose)
  beaverBodyMaleBrownThriving: 'cropBrownM',
  beaverBodyFemaleBrownThriving: 'cropBrownF',
  beaverBodyMaleWhiteThriving: 'cropWhiteM',
  beaverBodyFemaleWhiteThriving: 'cropWhiteF',
  beaverBodyMaleBlackThriving: 'cropBlackM',
  beaverBodyFemaleBlackThriving: 'cropBlackF',
  // bodies — content
  beaverBodyMaleBrownContent: 'brownCroppedContentM',
  beaverBodyFemaleBrownContent: 'brownCroppedContentF',
  beaverBodyMaleWhiteContent: 'whiteCroppedContentM',
  beaverBodyFemaleWhiteContent: 'whiteCroppedContentF',
  beaverBodyMaleBlackContent: 'blackCroppedContentM',
  beaverBodyFemaleBlackContent: 'blackCroppedContentF',
  // bodies — okay (one shared design per color)
  beaverBodyBrownOkay: 'brownCroppedOkay',
  beaverBodyWhiteOkay: 'whiteCroppedOkay',
  beaverBodyBlackOkay: 'blackCroppedOkay',
  // bodies — unhappy (note the irregular black-female filename)
  beaverBodyMaleBrownUnhappy: 'brownMCroppedUnhappy',
  beaverBodyFemaleBrownUnhappy: 'brownFCroppedUnhappy',
  beaverBodyMaleWhiteUnhappy: 'whiteMCroppedUnhappy',
  beaverBodyFemaleWhiteUnhappy: 'whiteFCroppedUnhappy',
  beaverBodyMaleBlackUnhappy: 'blackMCroppedUnhappy',
  beaverBodyFemaleBlackUnhappy: 'fUnhappyBlackCropped',
  // bodies — neglected (one shared design per color; irregular black filename)
  beaverBodyBrownNeglected: 'brownCroppedNeglected',
  beaverBodyWhiteNeglected: 'whiteCroppedNeglected',
  beaverBodyBlackNeglected: 'blackNeglectedCropped',
  // cosmetics — hats
  cosHatsBeanie: 'whiteBeanie',
  cosHatsBaseballCap: 'blueHat',
  cosHatsBowHat: 'bow',
  cosHatsPropeller: 'propHat',
  cosHatsCrown: 'crown',
  // cosmetics — tails
  cosTailsRed: 'redTail',
  cosTailsCheckerboard: 'checker',
  cosTailsBow: 'bowTail',
  cosTailsRainbow: 'rainbowTail',
  cosTailsGold: 'goldTail',
  // cosmetics — gloves
  cosGlovesRedBoxing: 'redGloves',
  cosGlovesBlue: 'blueGloves',
  cosGlovesPinkMitts: 'pinkGloves',
  cosGlovesGoldenBoxing: 'goldenGloves',
  // cosmetics — eyes ("Eye Shadow" ships as the pink glasses art)
  cosEyesSunglasses: 'sunglasses',
  cosEyesEyePatch: 'eyePatch',
  cosEyesShadow: 'pinkGlasses',
  cosEyesSkiGoggles: 'skiGoggles',
  cosEyesGoldMonocle: 'monocle',
};

/**
 * The tool's z default for a placement key with no explicit z — an exact
 * replica of Placement Studio's keyword rules (tools/placement-studio,
 * `slotOf`/`defaultZ`). Kept in lockstep: this is how the founder SAW every
 * unset-z item stacked when they approved the layout.
 */
export function toolDefaultZ(placementKey: string): number {
  const k = placementKey.toLowerCase();
  if (k.includes('tail')) return 0;
  if (k.includes('glove') || k.includes('mitt')) return 2;
  if (
    k.includes('eye') ||
    k.includes('sunglass') ||
    k.includes('goggle') ||
    k.includes('monocle')
  ) {
    return 3;
  }
  if (
    k.includes('hat') ||
    k.includes('beanie') ||
    k.includes('cap') ||
    k.includes('crown')
  ) {
    return 4;
  }
  return 5; // unknown keys stacked topmost in the tool
}

const items: Record<string, RawPlacement> = placementData.items ?? {};

/**
 * Resolve a registry slot name to its authored placement, defaults filled in.
 * Returns null for a slot with no mapping or no JSON entry — the renderer
 * falls back (legacy full-canvas layer for cosmetics, placeholder for bodies)
 * instead of crashing (§2.1).
 */
export function getPlacement(slotName: string): ResolvedPlacement | null {
  const key = PLACEMENT_KEYS[slotName];
  const raw = key ? items[key] : undefined;
  if (!key || !raw) return null;
  const isBody = slotName.startsWith('beaverBody');
  return {
    x: raw.x,
    y: raw.y,
    w: raw.w,
    h: raw.h,
    scale: raw.scale ?? 1,
    rotation: raw.rotation ?? 0,
    // Bodies are always the z1 anchor layer; the tool never writes z for them.
    z: isBody ? BODY_Z : raw.z ?? toolDefaultZ(key),
  };
}
