/**
 * H2H pairing + resolution orchestration (spec §7.6) — shared by the
 * h2h-pair and day-close Edge Functions. Server-authoritative: runs on the
 * service-role client only; clients never write matches/history/notifications.
 *
 * Pure decision logic lives in h2hLogic.ts (unit-tested); this module is the
 * DB choreography around it.
 */
import {
  pickOpponent,
  resolveFriendMatch,
  type H2HEntry,
  type H2HVictorRule,
} from './h2hLogic.ts';

// Structural stand-in for SupabaseClient: the jsr: import only resolves under
// Deno, and the query-builder chain is impractical to type structurally, so
// this is the one sanctioned `any` in the server code (justification: spec
// §2.1 — the alternative is duplicating supabase-js types by hand).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = { from: (table: string) => any };

export interface ChallengeRow {
  id: string;
  beta_day: number;
  mode: 'SP' | 'H2H' | 'CV';
  has_difficulty: boolean;
  victor_rule: string | null;
}

interface SubmissionRow {
  id: string;
  user_id: string;
  score: number | null;
  passed: boolean | null;
  submitted_at: string | null;
  difficulty: string | null;
}

export type PairOutcome =
  | { status: 'not_submitted' }
  | { status: 'no_match' } // day-4 Easy/Medium: SP path, no H2H
  | { status: 'pending' }
  | { status: 'resolved'; winnerUserId: string };

function toEntry(sub: SubmissionRow): H2HEntry {
  return {
    userId: sub.user_id,
    score: sub.score,
    passed: sub.passed,
    submittedAt: sub.submitted_at ?? '9999-12-31T00:00:00Z',
  };
}

async function one<T>(query: Promise<{ data: T | null; error: { message: string } | null }>): Promise<T | null> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function many<T>(query: Promise<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Accepted, unblocked friend ids of `userId` (block = gone both directions). */
export async function friendIdsOf(db: Db, userId: string): Promise<string[]> {
  const friendships = await many<{ requester_id: string; addressee_id: string }>(
    db
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  );
  const blocks = await many<{ blocker_id: string; blocked_id: string }>(
    db
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
  );
  const blocked = new Set<string>();
  for (const b of blocks) {
    blocked.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
  }
  return friendships
    .map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id))
    .filter((id) => !blocked.has(id));
}

/**
 * Try to pair (and immediately resolve) the protagonist's H2H match for the
 * challenge. Creates the pending match row if missing; leaves it pending when
 * no eligible friend has submitted yet (mascot resolves it at day close).
 */
export async function attemptPair(
  db: Db,
  challenge: ChallengeRow,
  protagonistId: string,
): Promise<PairOutcome> {
  const mySub = await one<SubmissionRow>(
    db
      .from('submissions')
      .select('id, user_id, score, passed, submitted_at, difficulty')
      .eq('challenge_id', challenge.id)
      .eq('user_id', protagonistId)
      .eq('state', 'submitted')
      .maybeSingle(),
  );
  if (!mySub) return { status: 'not_submitted' };

  // Day 4 (spec §7.2 LOCKED): Hard is the only H2H path.
  const hardOnly = challenge.has_difficulty;
  if (hardOnly && mySub.difficulty !== 'hard') return { status: 'no_match' };

  let match = await one<{ id: string; status: string; winner_user_id: string | null }>(
    db
      .from('h2h_matches')
      .select('id, status, winner_user_id')
      .eq('protagonist_id', protagonistId)
      .eq('beta_day', challenge.beta_day)
      .maybeSingle(),
  );
  if (match?.status === 'resolved') {
    return { status: 'resolved', winnerUserId: match.winner_user_id ?? '' };
  }
  if (!match) {
    match = await one(
      db
        .from('h2h_matches')
        .insert({
          challenge_id: challenge.id,
          beta_day: challenge.beta_day,
          protagonist_id: protagonistId,
          protagonist_submission: mySub.id,
        })
        .select('id, status, winner_user_id')
        .single(),
    );
  }
  if (!match) throw new Error('Failed to create match row');

  const friends = await friendIdsOf(db, protagonistId);
  if (friends.length === 0) return { status: 'pending' };

  // Eligible pool: friends who submitted (same Hard bracket on day 4).
  let candidateQuery = db
    .from('submissions')
    .select('id, user_id, score, passed, submitted_at, difficulty')
    .eq('challenge_id', challenge.id)
    .eq('state', 'submitted')
    .in('user_id', friends);
  if (hardOnly) candidateQuery = candidateQuery.eq('difficulty', 'hard');
  const candidates = await many<SubmissionRow>(candidateQuery);
  if (candidates.length === 0) return { status: 'pending' };

  const faced = await many<{ faced_user_id: string }>(
    db
      .from('h2h_history')
      .select('faced_user_id')
      .eq('user_id', protagonistId)
      .eq('beta_week', 1),
  );

  const opponentId = pickOpponent(
    candidates.map((c) => c.user_id),
    faced.map((f) => f.faced_user_id),
  );
  if (!opponentId) return { status: 'pending' };
  const oppSub = candidates.find((c) => c.user_id === opponentId) as SubmissionRow;

  const winnerUserId = resolveFriendMatch(
    challenge.victor_rule as H2HVictorRule,
    toEntry(mySub),
    toEntry(oppSub),
  );

  const { error: updateError } = await db
    .from('h2h_matches')
    .update({
      opponent_id: opponentId,
      opponent_submission: oppSub.id,
      winner_user_id: winnerUserId,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', match.id)
    .eq('status', 'pending'); // idempotence: never re-resolve
  if (updateError) throw new Error(updateError.message);

  const { error: historyError } = await db.from('h2h_history').insert({
    user_id: protagonistId,
    faced_user_id: opponentId,
    beta_week: 1,
  });
  if (historyError) throw new Error(historyError.message);

  const { error: notifyError } = await db.from('notifications').insert([
    {
      user_id: protagonistId,
      type: 'h2h_result',
      payload: {
        beta_day: challenge.beta_day,
        match_id: match.id,
        won: winnerUserId === protagonistId,
        opponent_id: opponentId,
        vs_mascot: false,
      },
    },
    {
      user_id: opponentId,
      type: 'h2h_result',
      payload: {
        beta_day: challenge.beta_day,
        match_id: match.id,
        won: winnerUserId === opponentId,
        opponent_id: protagonistId,
        vs_mascot: false,
      },
    },
  ]);
  if (notifyError) throw new Error(notifyError.message);

  return { status: 'resolved', winnerUserId };
}
