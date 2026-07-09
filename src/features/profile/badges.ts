import type { AssetSlot } from '@/assets/registry';

/**
 * Badge catalog + pure derivation (spec §6; M13). Badges are DERIVED from
 * data the client already reads under RLS — no new tables, no award writes,
 * nothing to double-award or backfill:
 *  - Summit Reached  → the final beta day's challenge was submitted
 *  - First Win       → at least one resolved H2H win
 *  - Vote Winner     → placed 1st in a community vote
 *  - Perfect Week    → every beta day submitted
 */

export type BadgeId = 'summitReached' | 'firstWin' | 'voteWinner' | 'perfectWeek';

export interface BadgeDef {
  id: BadgeId;
  name: string;
  slot: AssetSlot;
  /** Shown while locked — how to earn it. */
  hint: string;
}

export const BADGES: readonly BadgeDef[] = [
  {
    id: 'summitReached',
    name: 'Summit Reached',
    slot: 'badgeSummitReached',
    hint: 'Complete the final day',
  },
  {
    id: 'firstWin',
    name: 'First Win',
    slot: 'badgeFirstWin',
    hint: 'Win a head-to-head',
  },
  {
    id: 'voteWinner',
    name: 'Vote Winner',
    slot: 'badgeVoteWinner',
    hint: 'Take 1st in a community vote',
  },
  {
    id: 'perfectWeek',
    name: 'Perfect Week',
    slot: 'badgePerfectWeek',
    hint: 'Complete all 7 days',
  },
] as const;

export interface BadgeInputs {
  /** Beta days with a submitted attempt. */
  submittedDays: ReadonlySet<number>;
  /** Beta length (config.beta.lengthDays). */
  lengthDays: number;
  /** Resolved H2H wins (mascot wins count — a win is a win, spec §7.9). */
  h2hWins: number;
  /** Community-vote 1st placements. */
  voteFirsts: number;
}

export type BadgeStatus = BadgeDef & { earned: boolean };

export function deriveBadges(inputs: BadgeInputs): BadgeStatus[] {
  const { submittedDays, lengthDays, h2hWins, voteFirsts } = inputs;
  let allDays = lengthDays > 0;
  for (let day = 1; day <= lengthDays; day++) {
    if (!submittedDays.has(day)) {
      allDays = false;
      break;
    }
  }
  const earnedBy: Record<BadgeId, boolean> = {
    summitReached: lengthDays > 0 && submittedDays.has(lengthDays),
    firstWin: h2hWins > 0,
    voteWinner: voteFirsts > 0,
    perfectWeek: allDays,
  };
  return BADGES.map((def) => ({ ...def, earned: earnedBy[def.id] }));
}
