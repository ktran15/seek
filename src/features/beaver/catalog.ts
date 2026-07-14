/**
 * Beaver base-body catalog (spec §10.1, LOCKED): the player picks a SEX and a
 * COLOR — 2 canonical bodies × 3 colors = 6 distinct bodies. Male and female
 * are genuinely different designs (NOT recolors of each other); the 3 colors
 * ARE shape-identical recolors within each body (rig bible §4).
 *
 * Users START PLAIN (§10.1b): no starter cosmetic is granted — hats/tails/
 * gloves/eyes come from crates only.
 */
import type { AvatarConfig } from '@/lib/database.types';

import type { HappinessState } from './happiness';

export type BodySex = 'male' | 'female';
export type BodyColor = 'brown' | 'white' | 'black';

export interface BodySexOption {
  id: BodySex;
  label: string;
}

export interface BodyColorOption {
  id: BodyColor;
  label: string;
  /** Swatch color for the picker (approximates the real body art). */
  swatch: string;
}

export const BODY_SEXES: readonly BodySexOption[] = [
  { id: 'male', label: 'Boy' },
  { id: 'female', label: 'Girl' },
] as const;

export const BODY_COLORS: readonly BodyColorOption[] = [
  { id: 'brown', label: 'Brown', swatch: '#8C5A2B' },
  { id: 'white', label: 'White', swatch: '#E8DCCB' },
  { id: 'black', label: 'Black', swatch: '#3B3229' },
] as const;

/** What a brand-new beaver looks like before the player chooses. */
export const DEFAULT_BODY: { bodySex: BodySex; bodyColor: BodyColor } = {
  bodySex: 'male',
  bodyColor: 'brown',
};

export function bodySexOf(config: AvatarConfig | null | undefined): BodySex {
  const id = config?.bodySex;
  return BODY_SEXES.some((o) => o.id === id)
    ? (id as BodySex)
    : DEFAULT_BODY.bodySex;
}

export function bodyColorOf(config: AvatarConfig | null | undefined): BodyColor {
  const id = config?.bodyColor;
  return BODY_COLORS.some((o) => o.id === id)
    ? (id as BodyColor)
    : DEFAULT_BODY.bodyColor;
}

export function colorOption(id: BodyColor): BodyColorOption {
  return (
    BODY_COLORS.find((o) => o.id === id) ?? (BODY_COLORS[0] as BodyColorOption)
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Registry slot for one body image: sex × color × Happiness state (30 total,
 * spec §14.3). Real art drops into these slots and the app picks it up with
 * ZERO code change; until then `getAssetOrNull` returns null for these names
 * and BeaverPreview falls back to the placeholder body (see BeaverPreview).
 *
 *   beaverMaleBrownContent, beaverFemaleBlackNeglected, …
 */
export function beaverBodySlot(
  sex: BodySex,
  color: BodyColor,
  state: HappinessState,
): string {
  return `beaver${cap(sex)}${cap(color)}${cap(state)}`;
}
