/**
 * h2h-pair — called by the client right after an H2H-day submission
 * (spec §7.6): pairs the caller's match if an eligible friend already
 * submitted, otherwise leaves it pending; then sweeps the caller's friends'
 * pending matches, since this submission may be the one they were waiting on.
 *
 * Server-authoritative: all writes happen here on the service-role client.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { attemptPair, friendIdsOf, type ChallengeRow } from '../_shared/pairing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    if (authError || !userData.user) return json({ error: 'Not signed in' }, 401);
    const userId = userData.user.id;

    const { beta_day: betaDay } = (await req.json().catch(() => ({}))) as {
      beta_day?: number;
    };
    if (!betaDay || betaDay < 1 || betaDay > 7) {
      return json({ error: 'beta_day (1-7) required' }, 400);
    }

    const { data: challenge, error: challengeError } = await admin
      .from('challenges')
      .select('id, beta_day, mode, has_difficulty, victor_rule')
      .eq('beta_day', betaDay)
      .single<ChallengeRow>();
    if (challengeError || !challenge) return json({ error: 'Unknown challenge' }, 400);
    if (challenge.mode !== 'H2H' && !challenge.has_difficulty) {
      return json({ error: 'Not an H2H day' }, 400);
    }

    const outcome = await attemptPair(admin, challenge, userId);

    // Sweep: my submission may complete a friend's pending match (spec §7.6
    // "pair when one does"). Re-run pairing for friends left pending today.
    const friends = await friendIdsOf(admin, userId);
    if (friends.length > 0) {
      const { data: pendingRows } = await admin
        .from('h2h_matches')
        .select('protagonist_id')
        .eq('beta_day', betaDay)
        .eq('status', 'pending')
        .in('protagonist_id', friends);
      for (const row of pendingRows ?? []) {
        await attemptPair(admin, challenge, row.protagonist_id as string);
      }
    }

    return json({ outcome });
  } catch (e) {
    console.error('[h2h-pair]', e);
    return json({ error: 'Pairing failed' }, 500);
  }
});
