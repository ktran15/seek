/**
 * Happiness → visual state (spec §10.3, LOCKED bands). Pure and unit-tested:
 * this is the "invisible when wrong" mapping the whole care loop renders from.
 *
 * Happiness itself is server-authoritative (decay −10/day when the day is
 * missed, +20 on completion, +15 per snack, clamped 0–100). The client only
 * ever READS it and picks a state.
 */

export type HappinessState =
  | 'thriving'
  | 'content'
  | 'okay'
  | 'unhappy'
  | 'neglected';

export interface HappinessStateDef {
  id: HappinessState;
  label: string;
  /** Inclusive lower bound of the band. */
  min: number;
  /** Inclusive upper bound of the band. */
  max: number;
  /** Short, warm, never guilt-tripping (aesthetic §6). */
  blurb: string;
}

/** LOCKED bands (spec §10.3). Ordered best → worst. */
export const HAPPINESS_STATES: readonly HappinessStateDef[] = [
  {
    id: 'thriving',
    label: 'Thriving',
    min: 81,
    max: 100,
    blurb: 'Bouncing off the walls. Keep it up!',
  },
  {
    id: 'content',
    label: 'Content',
    min: 61,
    max: 80,
    blurb: 'Happy and steady.',
  },
  {
    id: 'okay',
    label: 'Okay',
    min: 41,
    max: 60,
    blurb: 'A little low on energy.',
  },
  {
    id: 'unhappy',
    label: 'Unhappy',
    min: 21,
    max: 40,
    blurb: 'Missing you. Today’s challenge would help.',
  },
  {
    id: 'neglected',
    label: 'Neglected',
    min: 0,
    max: 20,
    blurb: 'Could really use some company.',
  },
] as const;

/** Clamp any incoming number into the valid 0–100 Happiness range. */
export function clampHappiness(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * The state for a Happiness value. Out-of-range/garbage input clamps rather
 * than throwing — a bad value must never blank the user's beaver.
 */
export function happinessState(value: number): HappinessStateDef {
  const clamped = clampHappiness(value);
  const found = HAPPINESS_STATES.find(
    (s) => clamped >= s.min && clamped <= s.max,
  );
  // Bands cover 0–100 exhaustively; the fallback satisfies the type checker.
  return found ?? (HAPPINESS_STATES[HAPPINESS_STATES.length - 1] as HappinessStateDef);
}
