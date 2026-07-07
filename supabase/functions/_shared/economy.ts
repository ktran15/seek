/**
 * Economy math (spec §9) — pure and dependency-free, shared by the crate-open
 * and day-close Edge Functions and the jest suite. All numbers arrive as
 * arguments (TUNE: logic never depends on specific values, spec §9); the
 * callers read them from app_settings('economy').
 */

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CrateTier = 'wood' | 'blue' | 'red' | 'yellow' | 'gold';

export interface DropRates {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

/** Rarest-first fallback order when a rarity bucket has no cosmetics. */
const RARITY_ORDER: readonly Rarity[] = ['common', 'rare', 'epic', 'legendary'];

/** True when the tier's rates cover every rarity and sum to 1 (±1e-9). */
export function validateDropRates(rates: DropRates): boolean {
  const values = RARITY_ORDER.map((r) => rates[r]);
  if (values.some((v) => typeof v !== 'number' || v < 0)) return false;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) < 1e-9;
}

/**
 * Roll a rarity from the tier's drop table. `rng` returns [0, 1) —
 * injectable so tests are deterministic and the Edge Function uses a
 * crypto-seeded source (client can never influence the outcome, §9.4).
 */
export function rollRarity(rates: DropRates, rng: () => number): Rarity {
  const roll = rng();
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += rates[rarity];
    if (roll < cumulative) return rarity;
  }
  // Float underflow at the boundary (roll ≈ 1): the last bucket wins.
  return 'legendary';
}

/**
 * Pick a cosmetic of the rolled rarity, uniformly. If the catalog has no item
 * at that rarity, degrade to the next rarity DOWN (never up — a bad catalog
 * must not inflate drops); returns null only for an empty catalog.
 */
export function pickCosmetic<T extends { rarity: Rarity }>(
  catalog: readonly T[],
  rolled: Rarity,
  rng: () => number,
): T | null {
  const startIndex = RARITY_ORDER.indexOf(rolled);
  for (let i = startIndex; i >= 0; i--) {
    const bucket = catalog.filter((c) => c.rarity === RARITY_ORDER[i]);
    if (bucket.length > 0) {
      return bucket[Math.min(Math.floor(rng() * bucket.length), bucket.length - 1)] as T;
    }
  }
  return null;
}

export interface PlacementAmounts {
  first: number;
  second: number;
  third: number;
}

export interface PlacementReward {
  coins: number;
  points: number;
  crateTier: CrateTier;
}

/**
 * Vote placement → reward (spec §9.1/9.2/9.3): 1st earns the yellow "vote
 * win" crate; 2nd/3rd earn red "top-3" crates. Tie-sharing placements (M5)
 * each earn their placement's full reward.
 */
export function votePlacementReward(
  placement: 1 | 2 | 3,
  coins: PlacementAmounts,
  points: PlacementAmounts,
): PlacementReward {
  const key = placement === 1 ? 'first' : placement === 2 ? 'second' : 'third';
  return {
    coins: coins[key],
    points: points[key],
    crateTier: placement === 1 ? 'yellow' : 'red',
  };
}
