/**
 * Weekly leaderboard + payout math (spec §9.1, §9.2) — pure and
 * dependency-free, shared by the weekly-payout Edge Function and the jest
 * suite. All amounts arrive as arguments (TUNE — logic never depends on
 * specific values); callers read them from app_settings('economy').
 *
 * Egocentric ranking (spec §7.10, §9.2): a user ranks within their OWN
 * circle — their weekly points against their friends'. Ties share the
 * higher placement (competition ranking: 1 + count strictly greater), the
 * same rule as the community-vote tally.
 *
 * Interpretation surfaced to the founder (PROGRESS.md): zero points never
 * ranks — mirroring "zero votes never places" (M5), so an inactive circle
 * can't all "win 1st".
 */

export interface WeeklyPayoutAmounts {
  /** Rank 1. */
  first: number;
  /** Ranks 2–3. */
  top3: number;
  /** Ranks 4–10. */
  top10: number;
}

/** Egocentric weekly rank, or null when the user earned zero points. */
export function weeklyRank(
  myPoints: number,
  friendPoints: readonly number[],
): number | null {
  if (myPoints < 1) return null;
  return 1 + friendPoints.filter((p) => p > myPoints).length;
}

export interface WeeklyReward {
  coins: number;
  /** Gold crate — weekly prize for 1st, qualified only (spec §9.3). */
  goldCrate: boolean;
}

/**
 * Payout for a QUALIFIED user's rank (≥3 accepted friends — the caller
 * checks qualification). Null = ranked below the paying tiers (or unranked).
 */
export function weeklyTierPayout(
  rank: number | null,
  amounts: WeeklyPayoutAmounts,
): WeeklyReward | null {
  if (rank === null) return null;
  if (rank === 1) return { coins: amounts.first, goldCrate: true };
  if (rank <= 3) return { coins: amounts.top3, goldCrate: false };
  if (rank <= 10) return { coins: amounts.top10, goldCrate: false };
  return null;
}

/**
 * Payout decision for one user (spec §9.2 LOCKED): qualified users earn
 * tier payouts by egocentric rank; unqualified users who completed ≥1
 * challenge earn the flat solo payout — closing the "friendless auto-1st"
 * exploit.
 */
export function weeklyPayout(input: {
  qualified: boolean;
  myPoints: number;
  friendPoints: readonly number[];
  completedAny: boolean;
  amounts: WeeklyPayoutAmounts;
  soloAmount: number;
}): (WeeklyReward & { rank: number | null; solo: boolean }) | null {
  if (input.qualified) {
    const rank = weeklyRank(input.myPoints, input.friendPoints);
    const reward = weeklyTierPayout(rank, input.amounts);
    return reward ? { ...reward, rank, solo: false } : null;
  }
  if (input.completedAny) {
    return { coins: input.soloAmount, goldCrate: false, rank: null, solo: true };
  }
  return null;
}
