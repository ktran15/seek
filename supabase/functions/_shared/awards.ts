/**
 * Award choreography (spec §9) — service-role DB writes for H2H wins and
 * vote placements, shared by h2h-pair and day-close. Ref-deduped so re-runs
 * (day-close is re-runnable by design) never double-pay. Amounts come from
 * app_settings('economy'); the reward mapping is pure (economy.ts, tested).
 */
import { votePlacementReward, type PlacementAmounts } from './economy.ts';

// Same sanctioned structural stand-in as pairing.ts (spec §2.1 note there).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = { from: (table: string) => any };

interface EconomySettings {
  coins: { h2hWin: number; votePlacement: PlacementAmounts };
  points: { h2hWin: number; votePlacement: PlacementAmounts };
}

async function getEconomy(db: Db): Promise<EconomySettings> {
  const { data, error } = await db
    .from('app_settings')
    .select('value')
    .eq('key', 'economy')
    .single();
  if (error) throw new Error(error.message);
  return data.value as EconomySettings;
}

/** True when this ref already paid coins for this reason (idempotence). */
async function alreadyPaid(db: Db, refId: string, reason: string): Promise<boolean> {
  const { data, error } = await db
    .from('coins_ledger')
    .select('id')
    .eq('ref_id', refId)
    .eq('reason', reason)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

async function insertOrThrow(db: Db, table: string, row: Record<string, unknown>) {
  const { error } = await db.from(table).insert(row);
  if (error) throw new Error(error.message);
}

/** H2H win: +coins, +points, blue crate (spec §9.1–9.3). */
export async function awardH2HWin(
  db: Db,
  winnerUserId: string,
  matchId: string,
): Promise<void> {
  if (await alreadyPaid(db, matchId, 'h2h_win')) return;
  const eco = await getEconomy(db);
  await insertOrThrow(db, 'coins_ledger', {
    user_id: winnerUserId,
    delta: eco.coins.h2hWin,
    reason: 'h2h_win',
    ref_id: matchId,
  });
  await insertOrThrow(db, 'points_ledger', {
    user_id: winnerUserId,
    beta_week: 1,
    delta: eco.points.h2hWin,
    reason: 'h2h_win',
    ref_id: matchId,
  });
  await insertOrThrow(db, 'crates', {
    user_id: winnerUserId,
    tier: 'blue',
    source: 'h2h_win',
  });
}

/**
 * Vote placement: coins/points per placement; 1st earns the yellow vote-win
 * crate, 2nd/3rd the red top-3 crate. Tie-sharers each get the full reward
 * (M5 decision). Ref = the poster's day-3 submission.
 */
export async function awardVotePlacement(
  db: Db,
  posterId: string,
  placement: 1 | 2 | 3,
  submissionId: string,
): Promise<void> {
  if (await alreadyPaid(db, submissionId, 'vote_placement')) return;
  const eco = await getEconomy(db);
  const reward = votePlacementReward(
    placement,
    eco.coins.votePlacement,
    eco.points.votePlacement,
  );
  await insertOrThrow(db, 'coins_ledger', {
    user_id: posterId,
    delta: reward.coins,
    reason: 'vote_placement',
    ref_id: submissionId,
  });
  await insertOrThrow(db, 'points_ledger', {
    user_id: posterId,
    beta_week: 1,
    delta: reward.points,
    reason: 'vote_placement',
    ref_id: submissionId,
  });
  await insertOrThrow(db, 'crates', {
    user_id: posterId,
    tier: reward.crateTier,
    source: placement === 1 ? 'vote_win' : 'vote_top3',
  });
}
