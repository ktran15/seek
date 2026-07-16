/**
 * Beaver care-loop settle math (spec §10.4, §10.5, §10.7) — pure and
 * dependency-free, shared by the day-close and buy-snack server paths and the
 * jest suite. All amounts arrive as arguments (TUNE: logic never hard-codes
 * values, spec §10); the callers read them from app_settings('care_loop').
 *
 * Happiness is server-authoritative and clamped to 0–100. There is NO gameplay
 * penalty at any value (§10.3) — this only moves the number the client renders.
 */

export const HAPPINESS_MIN = 0;
export const HAPPINESS_MAX = 100;

/** Clamp + integer-round a Happiness value into 0–100. */
export function clampHappiness(value: number): number {
  if (Number.isNaN(value)) return HAPPINESS_MIN;
  // Math.max/min clamp ±Infinity naturally; guard only NaN above.
  return Math.max(HAPPINESS_MIN, Math.min(HAPPINESS_MAX, Math.round(value)));
}

/**
 * Settle one day's Happiness at day close (§10.4): completing adds `restore`
 * (default +20), not completing subtracts `decay` (default −10); additive and
 * clamped 0–100 (completing does not necessarily refill to 100).
 */
export function settleHappiness(
  current: number,
  opts: { completed: boolean; decay: number; restore: number },
): number {
  const delta = opts.completed ? opts.restore : -opts.decay;
  return clampHappiness(current + delta);
}

/**
 * Settle the streak at day close (§10.7): a completed day increments the run,
 * a missed day resets it to 0. Purely cosmetic/motivational — no thresholds.
 */
export function settleStreak(current: number, completed: boolean): number {
  if (!completed) return 0;
  return Math.max(0, Math.floor(current)) + 1;
}

// The snack restore (§10.5) is applied atomically with the coin deduction in
// the SQL `buy_snack` RPC (balance floor + Happiness in one transaction), not
// here — see 20260716000002_beaver_cosmetics_reschema_care_loop.sql.
