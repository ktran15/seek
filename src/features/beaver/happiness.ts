/**
 * Beaver Happiness — visual-state selection (spec §10.3). Pure and
 * unit-tested: the band → state mapping is invisible-when-wrong (the wrong
 * pose renders) per §2.1.
 *
 * Happiness is a 0–100 int stored on `profiles.happiness` (server-authoritative;
 * decay/restore settled server-side, §10.4). This module is the CLIENT's
 * read-only view: given a value, which of the 5 states does the beaver show,
 * and how do we label the meter. The server never selects a state — it only
 * stores the number — so these bands live only here (no cross-runtime drift).
 */

export type HappinessState =
  | 'thriving'
  | 'content'
  | 'okay'
  | 'unhappy'
  | 'neglected';

export interface HappinessStateInfo {
  id: HappinessState;
  label: string;
  /** Inclusive lower bound of the band on 0–100 (§10.3). */
  min: number;
  /** Short mood line for the meter / accessibility. */
  blurb: string;
}

/**
 * The 5 states, high→low (spec §10.3 bands, LOCKED):
 * Thriving 81–100 · Content 61–80 · Okay 41–60 · Unhappy 21–40 · Neglected 0–20.
 */
export const HAPPINESS_STATES: readonly HappinessStateInfo[] = [
  { id: 'thriving', label: 'Thriving', min: 81, blurb: 'Over the moon!' },
  { id: 'content', label: 'Content', min: 61, blurb: 'Happy and settled.' },
  { id: 'okay', label: 'Okay', min: 41, blurb: 'Doing alright.' },
  { id: 'unhappy', label: 'Unhappy', min: 21, blurb: 'Missing you.' },
  { id: 'neglected', label: 'Neglected', min: 0, blurb: 'Come back soon.' },
];

export const HAPPINESS_MIN = 0;
export const HAPPINESS_MAX = 100;

/** Clamp + round any number into a valid Happiness value (0–100). */
export function clampHappiness(value: number): number {
  if (Number.isNaN(value)) return HAPPINESS_MIN;
  // Math.max/min clamp ±Infinity naturally; guard only NaN above.
  return Math.max(HAPPINESS_MIN, Math.min(HAPPINESS_MAX, Math.round(value)));
}

/** The visual state for a Happiness value (spec §10.3). */
export function happinessState(happiness: number): HappinessStateInfo {
  const h = clampHappiness(happiness);
  // Bands are ordered high→low; the first whose floor we clear is the state.
  return (
    HAPPINESS_STATES.find((s) => h >= s.min) ??
    HAPPINESS_STATES[HAPPINESS_STATES.length - 1]
  );
}
