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

async function insertOrThrow(db: Db, table: string, row: Record<string, unknown>) {
  const { error } = await db.from(table).insert(row);
  if (error) throw new Error(error.message);
}

/**
 * Insert the coins-ledger row that gates an award and return whether THIS call
 * won it. The coins_ledger(ref_id, reason) unique index (M13 hardening) makes
 * this the idempotence boundary: a concurrent duplicate hits 23505 (unique
 * violation) and returns false, so points/crate never double-award — replacing
 * the old read-then-insert check that could race between the read and write.
 */
async function claimCoins(db: Db, row: Record<string, unknown>): Promise<boolean> {
  const { error } = await db.from('coins_ledger').insert(row);
  if (!error) return true;
  if ((error as { code?: string }).code === '23505') return false;
  throw new Error(error.message);
}

/** H2H win: +coins, +points, blue crate (spec §9.1–9.3). */
export async function awardH2HWin(
  db: Db,
  winnerUserId: string,
  matchId: string,
): Promise<void> {
  const eco = await getEconomy(db);
  const claimed = await claimCoins(db, {
    user_id: winnerUserId,
    delta: eco.coins.h2hWin,
    reason: 'h2h_win',
    ref_id: matchId,
  });
  if (!claimed) return; // another run already paid this match
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
  const eco = await getEconomy(db);
  const reward = votePlacementReward(
    placement,
    eco.coins.votePlacement,
    eco.points.votePlacement,
  );
  const claimed = await claimCoins(db, {
    user_id: posterId,
    delta: reward.coins,
    reason: 'vote_placement',
    ref_id: submissionId,
  });
  if (!claimed) return; // another run already paid this placement
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
