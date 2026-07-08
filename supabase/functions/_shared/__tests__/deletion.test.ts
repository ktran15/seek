import {
  batchPaths,
  CASCADE_PLAN,
  USER_MEDIA_BUCKETS,
  userStoragePrefix,
} from '../deletion';

/**
 * The complete inventory of user-data tables shipped in migrations M1–M10.
 * A new user-data table MUST be added BOTH here and to CASCADE_PLAN (with
 * its migration declaring the matching FK behavior) — one without the other
 * fails this suite. Config/catalog tables (app_settings, challenges,
 * cosmetics) hold no user data and are intentionally absent.
 */
const USER_DATA_TABLES = [
  'profiles',
  'friendships',
  'blocks',
  'invites',
  'submissions',
  'feed_posts',
  'reactions',
  'comments',
  'comment_reactions',
  'reports',
  'h2h_matches',
  'h2h_history',
  'votes',
  'notifications',
  'coins_ledger',
  'points_ledger',
  'crates',
  'user_cosmetics',
  'push_tokens',
].sort();

describe('CASCADE_PLAN coverage', () => {
  it('covers every user-data table — no silent survivors', () => {
    expect(Object.keys(CASCADE_PLAN).sort()).toEqual(USER_DATA_TABLES);
  });

  it('every table has at least one user column with a valid disposition', () => {
    for (const [table, plan] of Object.entries(CASCADE_PLAN)) {
      const columns = Object.entries(plan.userColumns);
      expect({ table, count: columns.length }).toEqual({
        table,
        count: expect.any(Number),
      });
      expect(columns.length).toBeGreaterThan(0);
      for (const [, disposition] of columns) {
        expect(['cascade', 'set_null']).toContain(disposition);
      }
    }
  });

  it('the user’s OWN rows always cascade (set_null is only for survivors’ rows)', () => {
    // Ownership columns — the column that makes a row "this user's data".
    const ownerColumn: Record<string, string> = {
      profiles: 'id',
      friendships: 'requester_id',
      blocks: 'blocker_id',
      invites: 'inviter_id',
      submissions: 'user_id',
      feed_posts: 'author_id',
      reactions: 'user_id',
      comments: 'user_id',
      comment_reactions: 'user_id',
      reports: 'reporter_id',
      h2h_matches: 'protagonist_id',
      h2h_history: 'user_id',
      votes: 'voter_id',
      notifications: 'user_id',
      coins_ledger: 'user_id',
      points_ledger: 'user_id',
      crates: 'user_id',
      user_cosmetics: 'user_id',
      push_tokens: 'user_id',
    };
    for (const [table, column] of Object.entries(ownerColumn)) {
      expect({ table, disposition: CASCADE_PLAN[table]?.userColumns[column] }).toEqual({
        table,
        disposition: 'cascade',
      });
    }
  });

  it('survivors keep their H2H matches with the deleted user anonymized (founder-approved)', () => {
    expect(CASCADE_PLAN.h2h_matches?.userColumns).toEqual({
      protagonist_id: 'cascade',
      opponent_id: 'set_null',
      winner_user_id: 'set_null',
    });
  });

  it('an inviter keeps their invite when the redeemer deletes their account', () => {
    expect(CASCADE_PLAN.invites?.userColumns.redeemed_by).toBe('set_null');
  });
});

describe('storage purge plan', () => {
  it('purges exactly the two private media buckets', () => {
    expect([...USER_MEDIA_BUCKETS].sort()).toEqual(['comment-media', 'proofs']);
  });

  it('the purge prefix is the owner folder (matching upload paths + storage RLS)', () => {
    expect(userStoragePrefix('abc-123')).toBe('abc-123');
  });
});

describe('batchPaths', () => {
  it('chunks to the batch size and keeps order', () => {
    const paths = ['a', 'b', 'c', 'd', 'e'];
    expect(batchPaths(paths, 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('handles empty input and exact multiples', () => {
    expect(batchPaths([], 100)).toEqual([]);
    expect(batchPaths(['a', 'b'], 2)).toEqual([['a', 'b']]);
  });

  it('rejects a nonsense batch size', () => {
    expect(() => batchPaths(['a'], 0)).toThrow();
  });
});
