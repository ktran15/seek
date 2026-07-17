/**
 * day-close — runs when a beta day ends on the global beta clock
 * (America/New_York; spec §7.6, §7.7). Scheduled via pg_cron (see
 * PROGRESS.md founder actions) and safely re-runnable:
 *
 * 1. H2H days: sweep — pair anyone still pairable, then resolve every
 *    remaining pending match against the mascot's fixed target (spec §7.9).
 * 2. Day 3: tally the community vote per poster's friend context with
 *    tie-sharing (spec §7.7) and notify every poster.
 *
 * Wins and placements pay coins/points/crates via _shared/awards.ts (M7),
 * ref-deduped so re-runs never double-pay.
 *
 * Invoked service-to-service: deploy with --no-verify-jwt; the caller must
 * present the service-role key, checked explicitly below.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { awardH2HWin, awardVotePlacement } from '../_shared/awards.ts';
import { betaDayInTimezone } from '../_shared/betaDay.ts';
import { countVotesByPoster, votePlacement } from '../_shared/cvTally.ts';
import { notifyAndPush } from '../_shared/notify.ts';
import { resolveMascotMatch, type H2HVictorRule } from '../_shared/h2hLogic.ts';
import { attemptPair, friendIdsOf, type ChallengeRow } from '../_shared/pairing.ts';
import { bearerToken, isServiceToken, serviceKeySet } from '../_shared/serviceAuth.ts';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const keys = serviceKeySet({
      serviceRoleKey: serviceKey,
      secretKeysJson: Deno.env.get('SUPABASE_SECRET_KEYS'),
    });
    if (!isServiceToken(bearerToken(req.headers.get('Authorization')), keys)) {
      return json({ error: 'Service calls only' }, 401);
    }
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

    const { data: betaSetting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'beta')
      .single();
    const beta = (betaSetting?.value ?? {}) as {
      start_date?: string;
      timezone?: string;
    };

    // Default: the day that just ended on the beta clock.
    const body = (await req.json().catch(() => ({}))) as { beta_day?: number };
    const betaDay =
      body.beta_day ??
      betaDayInTimezone(
        beta.start_date ?? '',
        beta.timezone ?? 'America/New_York',
      ) - 1;
    if (!Number.isInteger(betaDay) || betaDay < 1 || betaDay > 7) {
      return json({ skipped: true, reason: `No beta day to close (${betaDay})` });
    }

    const { data: challenge } = await admin
      .from('challenges')
      .select('id, beta_day, mode, has_difficulty, victor_rule')
      .eq('beta_day', betaDay)
      .single<ChallengeRow>();
    if (!challenge) return json({ error: 'Unknown challenge' }, 400);

    const report: Record<string, number> = {};

    if (challenge.mode === 'H2H' || challenge.has_difficulty) {
      report.mascot_resolved = await closeH2H(admin, challenge);
    }
    if (challenge.mode === 'CV') {
      report.vote_results = await closeVote(admin, challenge);
    }

    // Every day (all modes): settle each beaver's Happiness + streak for the
    // day that just closed (spec §10.4/§10.7). Idempotent per profile.
    report.care_settled = await settleCareLoop(admin, challenge);

    return json({ beta_day: betaDay, ...report });
  } catch (e) {
    console.error('[day-close]', e);
    return json({ error: 'Day close failed' }, 500);
  }
});

/** Pair the still-pairable, then mascot-resolve the rest (spec §7.6, §7.9). */
async function closeH2H(
  admin: ReturnType<typeof createClient>,
  challenge: ChallengeRow,
): Promise<number> {
  // Sweep every submitted player first: creates missing match rows (e.g. the
  // client crashed before calling h2h-pair) and pairs any late matchups.
  let subsQuery = admin
    .from('submissions')
    .select('user_id, difficulty')
    .eq('challenge_id', challenge.id)
    .eq('state', 'submitted');
  if (challenge.has_difficulty) subsQuery = subsQuery.eq('difficulty', 'hard');
  const { data: subs } = await subsQuery;
  for (const sub of subs ?? []) {
    await attemptPair(admin, challenge, sub.user_id as string);
  }

  const { data: mascotSetting } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'mascot')
    .single();
  const mascot = (mascotSetting?.value ?? {}) as {
    enabled?: boolean;
    targets?: Record<string, number>;
  };
  const target = mascot.targets?.[String(challenge.beta_day)];
  if (mascot.enabled === false || target === undefined) return 0;

  const { data: pending } = await admin
    .from('h2h_matches')
    .select('id, protagonist_id, protagonist_submission')
    .eq('beta_day', challenge.beta_day)
    .eq('status', 'pending');

  let resolved = 0;
  for (const match of pending ?? []) {
    const { data: sub } = await admin
      .from('submissions')
      .select('user_id, score, passed, submitted_at')
      .eq('id', match.protagonist_submission as string)
      .single();
    if (!sub) continue;

    const userWon = resolveMascotMatch(
      challenge.victor_rule as H2HVictorRule,
      {
        userId: sub.user_id as string,
        score: sub.score as number | null,
        passed: sub.passed as boolean | null,
        submittedAt: (sub.submitted_at as string | null) ?? '',
      },
      target,
    );

    // Claim the transition so a concurrent/re-run day-close that loses the
    // race skips the award + notify for this match (the update affects 0 rows).
    const { data: claimed, error } = await admin
      .from('h2h_matches')
      .update({
        vs_mascot: true,
        mascot_target_score: target,
        winner_user_id: userWon ? match.protagonist_id : null,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', match.id as string)
      .eq('status', 'pending')
      .select('id');
    if (error) throw new Error(error.message);
    if (!claimed || claimed.length === 0) continue;

    // Beating the mascot pays like any H2H win (M7; ref-deduped inside).
    if (userWon) {
      await awardH2HWin(admin, match.protagonist_id as string, match.id as string);
    }

    // Mascot matches notify only the user (spec §7.6); in-app row + push (M11).
    await notifyAndPush(admin, [
      {
        user_id: match.protagonist_id as string,
        type: 'h2h_result',
        payload: {
          beta_day: challenge.beta_day,
          match_id: match.id,
          won: userWon,
          opponent_id: null,
          vs_mascot: true,
        },
      },
    ]);
    resolved++;
  }
  return resolved;
}

/**
 * Settle the care loop for the closed day (spec §10.4/§10.7): each beaver
 * whose challenge was completed gains `completionRestore`, everyone else loses
 * `dailyDecay` (clamped 0–100); streak increments on completion, resets on a
 * miss. Runs for ALL profiles, not just submitters, because a missed day is
 * exactly the decay case.
 *
 * The settle itself is ONE set-based SQL statement (`settle_care_day`,
 * migration 20260716000003; math mirrored + jest-tested in
 * _shared/careLoop.ts): each row's happiness is computed from its CURRENT
 * value under the row lock, so a buy_snack landing mid-settle is never
 * clobbered, and the happiness_settled_day gate in the WHERE keeps re-runs
 * (and the concurrent-close race) idempotent per profile.
 */
async function settleCareLoop(
  admin: ReturnType<typeof createClient>,
  challenge: ChallengeRow,
): Promise<number> {
  const { data: careSetting } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'care_loop')
    .single();
  const care = (careSetting?.value ?? {}) as {
    dailyDecay?: number;
    completionRestore?: number;
  };
  const decay = care.dailyDecay ?? 10;
  const restore = care.completionRestore ?? 20;

  // Completed this day = a submitted proof (pass or fail, §10.4).
  const { data: subs } = await admin
    .from('submissions')
    .select('user_id')
    .eq('challenge_id', challenge.id)
    .eq('state', 'submitted');
  const completed = [...new Set((subs ?? []).map((s) => s.user_id as string))];

  const { data: settled, error } = await admin.rpc('settle_care_day', {
    day_in: challenge.beta_day,
    completed_ids: completed,
    decay_in: decay,
    restore_in: restore,
  });
  if (error) throw new Error(error.message);
  return (settled as number) ?? 0;
}

/** Tally the day-3 community vote and notify every poster (spec §7.7). */
async function closeVote(
  admin: ReturnType<typeof createClient>,
  challenge: ChallengeRow,
): Promise<number> {
  // Idempotence: one result set per beta day.
  const { count } = await admin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'vote_result')
    .contains('payload', { beta_day: challenge.beta_day });
  if ((count ?? 0) > 0) return 0;

  const { data: allPosts } = await admin
    .from('submissions')
    .select('id, user_id')
    .eq('challenge_id', challenge.id)
    .eq('state', 'submitted');
  if (!allPosts || allPosts.length === 0) return 0;

  // Admin-removed posts (spec §12) never tally, place, or get a result —
  // their votes count for nobody.
  const { data: removedRows } = await admin
    .from('feed_posts')
    .select('submission_id')
    .in('submission_id', allPosts.map((p) => p.id as string))
    .eq('removed', true);
  const removedIds = new Set(
    (removedRows ?? []).map((r) => r.submission_id as string),
  );
  const posts = allPosts.filter((p) => !removedIds.has(p.id as string));
  if (posts.length === 0) return 0;

  const { data: votes } = await admin
    .from('votes')
    .select('submission_id')
    .eq('beta_day', challenge.beta_day);

  const posterBySubmission = new Map(
    posts.map((p) => [p.id as string, p.user_id as string]),
  );
  const counts = countVotesByPoster(
    (votes ?? []).map((v) => ({ submissionId: v.submission_id as string })),
    posterBySubmission,
  );

  let notified = 0;
  for (const post of posts) {
    const posterId = post.user_id as string;
    const myVotes = counts.get(posterId) ?? 0;
    const friends = await friendIdsOf(admin, posterId);
    const friendVotes = friends.map((f) => counts.get(f) ?? 0);
    const placement = votePlacement(myVotes, friendVotes);

    // Placement purse: coins/points + red (top-3) or yellow (win) crate (M7).
    if (placement !== null) {
      await awardVotePlacement(admin, posterId, placement, post.id as string);
    }

    // In-app row + best-effort device push (M11, spec §13).
    await notifyAndPush(admin, [
      {
        user_id: posterId,
        type: 'vote_result',
        payload: {
          beta_day: challenge.beta_day,
          votes: myVotes,
          placement, // 1 | 2 | 3 | null
        },
      },
    ]);
    notified++;
  }
  return notified;
}
