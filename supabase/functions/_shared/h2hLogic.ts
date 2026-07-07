/**
 * Pure H2H logic (spec §7.6, §7.1) — shared by the Edge Functions and the
 * jest suite. Self-contained on purpose: no imports, so the same file runs
 * under Deno (Edge) and Node (tests) unchanged.
 *
 * Interpretations surfaced to the founder (PROGRESS.md):
 * - Friend-match ties resolve to the earlier submission (extends the day-5
 *   LOCKED tie rule to all H2H days; a resolved match always has a winner).
 * - Ties against the mascot's fixed target go to the USER (spec §7.9 framing:
 *   friendly rival, never punishment).
 */

/** H2H victor rules (spec §7.1). CV/pass_fail never reach H2H resolution. */
export type H2HVictorRule =
  | 'lower_time'
  | 'fewer_guesses'
  | 'higher_count'
  | 'higher_made_count';

export interface H2HEntry {
  userId: string;
  /** seconds / guesses (7 = X) / made-count / selfie-count. */
  score: number | null;
  /** Day 2: false = X (loses to any solve). Other H2H days: true. */
  passed: boolean | null;
  /** ISO timestamp; earlier submission wins ties. */
  submittedAt: string;
}

/** Lower-is-better rules. */
function lowerWins(rule: H2HVictorRule): boolean {
  return rule === 'lower_time' || rule === 'fewer_guesses';
}

/** Day 2 (spec §7.1): an X loses to any solve. */
function isFail(rule: H2HVictorRule, entry: H2HEntry): boolean {
  return rule === 'fewer_guesses' && entry.passed === false;
}

/** Earlier submission wins; equal timestamps fall back to userId for
 *  determinism (server-authoritative resolution must never coin-flip). */
function tieBreak(a: H2HEntry, b: H2HEntry): H2HEntry {
  if (a.submittedAt !== b.submittedAt) {
    return a.submittedAt < b.submittedAt ? a : b;
  }
  return a.userId < b.userId ? a : b;
}

/** Resolve a friend-vs-friend match; returns the winner's userId. */
export function resolveFriendMatch(
  rule: H2HVictorRule,
  a: H2HEntry,
  b: H2HEntry,
): string {
  const aFail = isFail(rule, a);
  const bFail = isFail(rule, b);
  if (aFail !== bFail) return aFail ? b.userId : a.userId;

  const aScore = a.score;
  const bScore = b.score;
  // A missing score never beats a real one; both missing → tie-break.
  if (aScore === null || bScore === null) {
    if (aScore === bScore) return tieBreak(a, b).userId;
    return aScore === null ? b.userId : a.userId;
  }

  if (aScore === bScore) return tieBreak(a, b).userId;
  if (lowerWins(rule)) return aScore < bScore ? a.userId : b.userId;
  return aScore > bScore ? a.userId : b.userId;
}

/** Resolve user vs. the mascot's fixed target (spec §7.9); true = user won. */
export function resolveMascotMatch(
  rule: H2HVictorRule,
  entry: H2HEntry,
  targetScore: number,
): boolean {
  if (isFail(rule, entry)) return false; // an X never beats the mascot's solve
  if (entry.score === null) return false;
  return lowerWins(rule)
    ? entry.score <= targetScore
    : entry.score >= targetScore;
}

/**
 * Friend-cycling draw (spec §7.6 LOCKED): random un-faced accepted friend
 * this beta week; when the un-faced pool is empty, reset the cycle and draw
 * from all friends. Returns null only when there are no friends at all.
 * `random` is injectable for deterministic tests.
 */
export function pickOpponent(
  friendIds: readonly string[],
  facedIds: readonly string[],
  random: () => number = Math.random,
): string | null {
  if (friendIds.length === 0) return null;
  const faced = new Set(facedIds);
  const unfaced = friendIds.filter((id) => !faced.has(id));
  const pool = unfaced.length > 0 ? unfaced : [...friendIds];
  return pool[Math.floor(random() * pool.length)] ?? null;
}
