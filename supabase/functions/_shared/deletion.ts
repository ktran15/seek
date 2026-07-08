/**
 * Account-deletion cascade plan (spec §12) — pure and dependency-free,
 * shared by the delete-account Edge Function and the jest suite.
 *
 * The DB side of the cascade is executed by Postgres itself: profiles
 * references auth.users ON DELETE CASCADE, and every user-data table
 * references profiles with either CASCADE (the row is the user's own data)
 * or SET NULL (the row belongs to a SURVIVING user and is anonymized —
 * founder decision: a deleted opponent must not erase the survivor's match
 * history). Deleting the auth user therefore removes the entire graph.
 *
 * CASCADE_PLAN is the executable-spec mirror of those FK clauses. Its unit
 * test pins the full table inventory: adding a user-data table without
 * declaring how deletion handles it fails the suite — that's the tripwire
 * the spec's "unit-test the deletion cascade" asks for, since a silently
 * surviving row is invisible until an Apple review or a GDPR request.
 */

/** How a table's user-referencing column behaves when the profile row goes. */
export type UserColumnDisposition = 'cascade' | 'set_null';

export interface TableCascade {
  /** Every column referencing profiles(id) (or auth.users) in this table. */
  userColumns: Record<string, UserColumnDisposition>;
  /**
   * Set when rows can ALSO vanish through a parent row's cascade (e.g.
   * reactions on a deleted user's post die with feed_posts). Documentation
   * only — the direct user column above already guarantees the user's own
   * rows go.
   */
  alsoCascadesVia?: string;
}

/**
 * Mirrors the FK clauses in supabase/migrations/* — keep in lockstep. The
 * deletion.test.ts inventory check fails when a new user-data table appears
 * in a migration without a row here.
 */
export const CASCADE_PLAN: Record<string, TableCascade> = {
  profiles: { userColumns: { id: 'cascade' } },
  friendships: {
    userColumns: { requester_id: 'cascade', addressee_id: 'cascade' },
  },
  blocks: { userColumns: { blocker_id: 'cascade', blocked_id: 'cascade' } },
  invites: {
    // A redeemed invite belongs to the INVITER; the redeemer's departure
    // only anonymizes the redemption.
    userColumns: { inviter_id: 'cascade', redeemed_by: 'set_null' },
  },
  submissions: { userColumns: { user_id: 'cascade' } },
  feed_posts: {
    userColumns: { author_id: 'cascade' },
    alsoCascadesVia: 'submissions',
  },
  reactions: {
    userColumns: { user_id: 'cascade' },
    alsoCascadesVia: 'feed_posts',
  },
  comments: {
    userColumns: { user_id: 'cascade' },
    alsoCascadesVia: 'feed_posts',
  },
  comment_reactions: {
    userColumns: { user_id: 'cascade' },
    alsoCascadesVia: 'comments',
  },
  reports: {
    // reported_user cascades (a report ABOUT a deleted user is moot);
    // the report row itself belongs to the reporter.
    userColumns: { reporter_id: 'cascade', reported_user_id: 'cascade' },
  },
  h2h_matches: {
    // Founder decision (M10 plan review): survivors keep their matches —
    // a deleted opponent/winner is anonymized, never erased.
    userColumns: {
      protagonist_id: 'cascade',
      opponent_id: 'set_null',
      winner_user_id: 'set_null',
    },
    alsoCascadesVia: 'submissions',
  },
  h2h_history: {
    userColumns: { user_id: 'cascade', faced_user_id: 'cascade' },
  },
  votes: {
    userColumns: { voter_id: 'cascade' },
    alsoCascadesVia: 'submissions',
  },
  notifications: { userColumns: { user_id: 'cascade' } },
  coins_ledger: { userColumns: { user_id: 'cascade' } },
  points_ledger: { userColumns: { user_id: 'cascade' } },
  crates: { userColumns: { user_id: 'cascade' } },
  user_cosmetics: { userColumns: { user_id: 'cascade' } },
  push_tokens: { userColumns: { user_id: 'cascade' } },
};

/**
 * Buckets holding user media under an owner folder (`<uid>/…`). FK cascades
 * cannot touch storage — the Edge Function purges these explicitly BEFORE
 * deleting the auth user (so a retry still knows the uid).
 */
export const USER_MEDIA_BUCKETS = ['proofs', 'comment-media'] as const;

/** Owner-folder prefix for a user's objects in every media bucket. */
export function userStoragePrefix(userId: string): string {
  return userId;
}

/** storage.remove() takes path arrays — chunk to stay under API limits. */
export function batchPaths(paths: readonly string[], size = 100): string[][] {
  if (size < 1) throw new Error('batch size must be >= 1');
  const batches: string[][] = [];
  for (let i = 0; i < paths.length; i += size) {
    batches.push(paths.slice(i, i + size));
  }
  return batches;
}
