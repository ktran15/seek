/**
 * Beaver care-loop settle math (spec §10.4, §10.5, §10.7) — pure and
 * dependency-free. At runtime the settle is the set-based SQL RPC
 * `settle_care_day()` (migration 20260716000003), which computes each row
 * from its CURRENT value under the row lock so a concurrent buy_snack() is
 * never clobbered. This module is that statement's jest-tested REFERENCE
 * implementation (invisible-when-wrong, §2.1) — if the SQL changes, change
 * `settleCareRow` to match, and vice versa.
 *
 * All amounts arrive as arguments (TUNE: logic never hard-codes values,
 * spec §10); the callers read them from app_settings('care_loop').
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

/** The care-loop columns of a profiles row that `settle_care_day()` touches. */
export interface CareRow {
  happiness: number;
  streak_count: number;
  /** Last beta day settled for this profile — the idempotency gate. */
  happiness_settled_day: number;
}

/**
 * The full per-row settle transform — mirrors the `settle_care_day()` UPDATE
 * exactly, including the `happiness_settled_day < day` gate: a row already
 * settled for `day` (or later) is returned UNCHANGED, which is what makes
 * re-runs and the concurrent-close race no-ops.
 *
 * Crucially the transform is a function of the row's state AT SETTLE TIME
 * (as the SQL reads the row under its lock), never of an earlier snapshot —
 * that property is what fixes the settle-vs-snack clobber race.
 */
export function settleCareRow(
  row: CareRow,
  opts: { day: number; completed: boolean; decay: number; restore: number },
): CareRow {
  if (row.happiness_settled_day >= opts.day) return row;
  return {
    happiness: settleHappiness(row.happiness, opts),
    streak_count: settleStreak(row.streak_count, opts.completed),
    happiness_settled_day: opts.day,
  };
}

// The snack restore (§10.5) is applied atomically with the coin deduction in
// the SQL `buy_snack` RPC (balance floor + Happiness in one transaction), not
// here — see 20260716000002_beaver_cosmetics_reschema_care_loop.sql.
