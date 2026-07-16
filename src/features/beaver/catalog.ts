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
 * Registry slot name for the body layer: `beaverBody{Sex}{Color}{State}` (Rig
 * Bible §10 — the body is selected by sex × color × Happiness state), e.g.
 * `beaverBodyFemaleBlackThriving`. Defaults to the `content` pose (the frozen
 * base) when no state is given — that's what onboarding shows (a new beaver
 * starts at 70 = Content). Resolved via getAssetOrNull, so it renders real art
 * with zero code change once it lands, and a placeholder until then.
 */
export function beaverBodySlotName(
  config: AvatarConfig | undefined,
  state: HappinessState = 'content',
): string {
  return `beaverBody${cap(beaverSex(config))}${cap(beaverBodyColor(config))}${cap(state)}`;
}
