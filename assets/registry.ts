/**
 * Central asset registry (spec §4.2, LOCKED pattern): every non-token visual
 * loads from a named slot here. Screens reference slot names ONLY — never
 * inline paths — so replacing the file behind a slot updates the app with
 * zero code change (real art lands in M12).
 *
 * Slots point at `./art/` once real M12 art is accepted (intake via
 * `scripts/process-art.js`; crate recolors via `scripts/recolor-crates.js`);
 * remaining slots are labeled solid-color placeholders from
 * `node scripts/generate-placeholders.js`.
 *
 * Avatar cosmetic art (`boots/*`, `hats/*`, … per spec §14.3) is added when
 * the cosmetics catalog exists (M7/M8): cosmetics reference registry slots via
 * `cosmetics.asset_slot_name`, and those slots join this registry then.
 */
import type { ImageSourcePropType } from 'react-native';

export const assetRegistry = {
  // Brand
  appLogo: require('./art/app-logo.png'),
  /** Tight-trimmed transparent wordmark for inline UI (auth screen) —
   *  derived from the logo master by scripts/make-icons.js. */
  appLogoWordmark: require('./art/app-logo-wordmark.png'),
  /** Wide banner lockup (letters own the height) for the top bar. */
  appLogoWide: require('./art/app-logo-wide.png'),
  loadingScreen: require('./art/loading-screen.png'),

  // Mascot — frozen beaver canonical (Rig Bible §7); cheer/defeat states are
  // reference-conditioned generations against this base (M12 batch pass)
  mascotAvatar: require('./art/mascot-avatar.png'),
  mascotCheer: require('./art/mascot-cheer.png'),
  mascotDefeat: require('./art/mascot-defeat.png'),

  // Mountain world
  mountainBackground: require('./art/mountain-background.png'),
  trail: require('./art/trail.png'),
  flagStart: require('./art/flag-start.png'),
  flagPlanted: require('./art/flag-planted.png'),
  summitState: require('./art/summit-state.png'),

  // Avatar base — frozen hiker canonical (Rig Bible §4): the immutable fit
  // reference every cosmetic layer is generated against. Never regenerate.
  hikerBase: require('./art/hiker-base.png'),

  // Avatar body per skin tone (catalog skin1–skin5): shape-identical recolors
  // of the frozen base (Rig Bible §4.3; scripts/recolor-avatar.js skin).
  bodySkin1: require('./art/body-skin1.png'),
  bodySkin2: require('./art/body-skin2.png'),
  bodySkin3: require('./art/body-skin3.png'),
  bodySkin4: require('./art/body-skin4.png'),
  bodySkin5: require('./art/body-skin5.png'),

  // Cosmetic layers — 8 slots × 4 rarities, slot names seeded in the M7
  // cosmetics catalog (`asset_slot_name`). Placeholder = translucent
  // rarity-colored box at the slot's LOCKED-ON-BASE anchor zone on the 1024²
  // master canvas; the M12 batch pass swaps each file for isolated layer art.
  cosBootsCommon: require('./placeholders/cos-boots-common.png'),
  cosBootsRare: require('./placeholders/cos-boots-rare.png'),
  cosBootsEpic: require('./placeholders/cos-boots-epic.png'),
  cosBootsLegendary: require('./placeholders/cos-boots-legendary.png'),
  cosPantsCommon: require('./placeholders/cos-pants-common.png'),
  cosPantsRare: require('./placeholders/cos-pants-rare.png'),
  cosPantsEpic: require('./placeholders/cos-pants-epic.png'),
  cosPantsLegendary: require('./placeholders/cos-pants-legendary.png'),
  cosBackpackCommon: require('./placeholders/cos-backpack-common.png'),
  cosBackpackRare: require('./placeholders/cos-backpack-rare.png'),
  cosBackpackEpic: require('./placeholders/cos-backpack-epic.png'),
  cosBackpackLegendary: require('./placeholders/cos-backpack-legendary.png'),
  cosHatsCommon: require('./art/cos-hats-common.png'),
  cosHatsRare: require('./art/cos-hats-rare.png'),
  cosHatsEpic: require('./art/cos-hats-epic.png'),
  cosHatsLegendary: require('./art/cos-hats-legendary.png'),
  cosSunglassesCommon: require('./placeholders/cos-sunglasses-common.png'),
  cosSunglassesRare: require('./placeholders/cos-sunglasses-rare.png'),
  cosSunglassesEpic: require('./placeholders/cos-sunglasses-epic.png'),
  cosSunglassesLegendary: require('./placeholders/cos-sunglasses-legendary.png'),
  cosShirtsCommon: require('./placeholders/cos-shirts-common.png'),
  cosShirtsRare: require('./placeholders/cos-shirts-rare.png'),
  cosShirtsEpic: require('./placeholders/cos-shirts-epic.png'),
  cosShirtsLegendary: require('./placeholders/cos-shirts-legendary.png'),
  cosJacketCommon: require('./placeholders/cos-jacket-common.png'),
  cosJacketRare: require('./placeholders/cos-jacket-rare.png'),
  cosJacketEpic: require('./placeholders/cos-jacket-epic.png'),
  cosJacketLegendary: require('./placeholders/cos-jacket-legendary.png'),
  cosPetCommon: require('./placeholders/cos-pet-common.png'),
  cosPetRare: require('./placeholders/cos-pet-rare.png'),
  cosPetEpic: require('./placeholders/cos-pet-epic.png'),
  cosPetLegendary: require('./placeholders/cos-pet-legendary.png'),

  // Crates — one design, five recolors (spec §9.3)
  crateWooden: require('./art/crate-wooden.png'),
  crateBlue: require('./art/crate-blue.png'),
  crateRed: require('./art/crate-red.png'),
  crateYellow: require('./art/crate-yellow.png'),
  crateGold: require('./art/crate-gold.png'),

  // Badges (v1 catalog, spec §6)
  badgeSummitReached: require('./art/badge-summit-reached.png'),
  badgeFirstWin: require('./art/badge-first-win.png'),
  badgeVoteWinner: require('./art/badge-vote-winner.png'),
  badgePerfectWeek: require('./art/badge-perfect-week.png'),
} satisfies Record<string, ImageSourcePropType>;

export type AssetSlot = keyof typeof assetRegistry;

/** Preferred accessor — keeps call sites slot-name-based and typo-safe. */
export function getAsset(slot: AssetSlot): ImageSourcePropType {
  return assetRegistry[slot];
}

/**
 * Lookup for slot names that arrive as data, not code — the cosmetics
 * catalog's `asset_slot_name`, base-variant names built from avatar_config
 * ids (`baseEyes2`, `baseHair4Hc1`, …). Returns null for a slot with no
 * registered art yet (the compositor skips that layer) — a catalog row or
 * stale config can never crash the render.
 */
export function getAssetOrNull(slot: string): ImageSourcePropType | null {
  return slot in assetRegistry ? assetRegistry[slot as AssetSlot] : null;
}
