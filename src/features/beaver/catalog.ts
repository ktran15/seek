/**
 * Player-beaver base catalog (spec §10.1; §18 decisions 2026-07-16).
 *
 * The base body is the ONLY thing chosen at onboarding: sex (male/female) ×
 * body color (brown/white/black) = 6 distinct bodies. The female body is a
 * distinct design, not a recolor of the male (Rig Bible §4) — but both share
 * one registration envelope, so a body is identified by (sex × color) and
 * cosmetics (earned from crates, never here) fit all six.
 *
 * Ids are stable and stored in `profiles.avatar_config`. Real body art is
 * founder-supplied later and drops into `beaverBody{Sex}{Color}` registry
 * slots; until then BeaverPreview draws a placeholder.
 */
import type { AvatarConfig, BeaverBodyColor, BeaverSex } from '@/lib/database.types';

import type { HappinessState } from './happiness';

export interface SexOption {
  id: BeaverSex;
  label: string;
}

export interface BodyColorOption {
  id: BeaverBodyColor;
  label: string;
  /** Display swatch for the picker + placeholder render (fur tone). */
  swatch: string;
}

export const BEAVER_SEXES: SexOption[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

export const BEAVER_BODY_COLORS: BodyColorOption[] = [
  { id: 'brown', label: 'Brown', swatch: '#8B5E3C' },
  { id: 'white', label: 'White', swatch: '#EFE2D0' },
  { id: 'black', label: 'Black', swatch: '#3A2E28' },
];

/** Default selection for a brand-new beaver (male + brown). */
export const DEFAULT_BEAVER: { sex: BeaverSex; bodyColor: BeaverBodyColor } = {
  sex: 'male',
  bodyColor: 'brown',
};

export function beaverSex(config: AvatarConfig | undefined): BeaverSex {
  return config?.sex ?? DEFAULT_BEAVER.sex;
}

export function beaverBodyColor(config: AvatarConfig | undefined): BeaverBodyColor {
  return config?.bodyColor ?? DEFAULT_BEAVER.bodyColor;
}

export function sexLabel(id: BeaverSex): string {
  return (BEAVER_SEXES.find((s) => s.id === id) ?? BEAVER_SEXES[0]).label;
}

export function bodyColorOption(id: BeaverBodyColor): BodyColorOption {
  return BEAVER_BODY_COLORS.find((c) => c.id === id) ?? BEAVER_BODY_COLORS[0];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * States whose final art is ONE shared design per color (no per-sex variant):
 * okay + neglected render the same file for male and female (founder art
 * decision, 2026-07-19). The other three states have distinct per-sex art.
 */
export const GENDER_AGNOSTIC_STATES: ReadonlySet<HappinessState> = new Set([
  'okay',
  'neglected',
]);

/**
 * Registry slot name for the body layer (Rig Bible §10, updated to the final
 * 2026-07-19 art):
 *   - thriving / content / unhappy → sex × color: `beaverBody{Sex}{Color}{State}`
 *     (e.g. `beaverBodyFemaleBlackThriving`)
 *   - okay / neglected → color only:  `beaverBody{Color}{State}`
 *     (e.g. `beaverBodyBrownOkay`) — both sexes share the art.
 * Defaults to the `content` pose when no state is given (a new beaver starts
 * at 70 = Content). Resolved via getAssetOrNull, so a missing slot renders the
 * placeholder instead of crashing.
 */
export function beaverBodySlotName(
  config: AvatarConfig | undefined,
  state: HappinessState = 'content',
): string {
  const color = cap(beaverBodyColor(config));
  if (GENDER_AGNOSTIC_STATES.has(state)) {
    return `beaverBody${color}${cap(state)}`;
  }
  return `beaverBody${cap(beaverSex(config))}${color}${cap(state)}`;
}

/**
 * Fallback chain for the body layer, most-specific first: the requested
 * state's slot, then the `content` pose (the frozen base every beaver has),
 * then thriving. The renderer walks this and draws the first slot with
 * registered art — so a missing color/state combination degrades to a real
 * body in a neighbouring pose, never a crash or a blank.
 */
export function beaverBodySlotChain(
  config: AvatarConfig | undefined,
  state: HappinessState = 'content',
): string[] {
  const chain = [beaverBodySlotName(config, state)];
  for (const fallback of ['content', 'thriving'] as const) {
    const slot = beaverBodySlotName(config, fallback);
    if (!chain.includes(slot)) chain.push(slot);
  }
  return chain;
}
