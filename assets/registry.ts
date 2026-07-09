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
  appLogo: require('./placeholders/app-logo.png'),
  loadingScreen: require('./placeholders/loading-screen.png'),

  // Mascot — frozen beaver canonical (Rig Bible §7); cheer/defeat states are
  // reference-conditioned generations against this base (M12 batch pass)
  mascotAvatar: require('./art/mascot-avatar.png'),
  mascotCheer: require('./placeholders/mascot-cheer.png'),
  mascotDefeat: require('./placeholders/mascot-defeat.png'),

  // Mountain world
  mountainBackground: require('./art/mountain-background.png'),
  trail: require('./placeholders/trail.png'),
  flagStart: require('./placeholders/flag-start.png'),
  flagPlanted: require('./placeholders/flag-planted.png'),
  summitState: require('./placeholders/summit-state.png'),

  // Avatar base — frozen hiker canonical (Rig Bible §4): the immutable fit
  // reference every cosmetic layer is generated against. Never regenerate.
  hikerBase: require('./art/hiker-base.png'),

  // Crates — one design, five recolors (spec §9.3)
  crateWooden: require('./art/crate-wooden.png'),
  crateBlue: require('./art/crate-blue.png'),
  crateRed: require('./art/crate-red.png'),
  crateYellow: require('./art/crate-yellow.png'),
  crateGold: require('./art/crate-gold.png'),

  // Badges (v1 catalog, spec §6)
  badgeSummitReached: require('./placeholders/badge-summit-reached.png'),
  badgeFirstWin: require('./placeholders/badge-first-win.png'),
  badgeVoteWinner: require('./placeholders/badge-vote-winner.png'),
  badgePerfectWeek: require('./placeholders/badge-perfect-week.png'),
} satisfies Record<string, ImageSourcePropType>;

export type AssetSlot = keyof typeof assetRegistry;

/** Preferred accessor — keeps call sites slot-name-based and typo-safe. */
export function getAsset(slot: AssetSlot): ImageSourcePropType {
  return assetRegistry[slot];
}
