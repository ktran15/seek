/**
 * Community-vote tally logic (spec §7.7) — pure and dependency-free, shared
 * by the day-close Edge Function and the jest suite.
 *
 * Egocentric placement (spec §7.10): a poster places within their OWN friend
 * context — their vote total ranked against their friends' vote totals.
 * Ties share the higher placement (two tied 1st → both 1st, next is 3rd),
 * which is competition ranking: 1 + count(strictly greater).
 *
 * Interpretation surfaced to the founder (PROGRESS.md): zero votes never
 * places — otherwise a friend group where nobody voted would all "win 1st".
 */

/** Vote placement for one poster, or null if they placed outside the top 3. */
export function votePlacement(
  posterVotes: number,
  friendVotes: readonly number[],
): 1 | 2 | 3 | null {
  if (posterVotes < 1) return null;
  const rank = 1 + friendVotes.filter((v) => v > posterVotes).length;
  return rank <= 3 ? (rank as 1 | 2 | 3) : null;
}

/** Count votes per poster given (submissionId → posterId) and the vote rows. */
export function countVotesByPoster(
  votes: readonly { submissionId: string }[],
  posterBySubmission: ReadonlyMap<string, string>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const vote of votes) {
    const poster = posterBySubmission.get(vote.submissionId);
    if (!poster) continue;
    counts.set(poster, (counts.get(poster) ?? 0) + 1);
  }
  return counts;
}
