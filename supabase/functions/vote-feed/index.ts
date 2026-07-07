/**
 * vote-feed — the day-3 community-vote surface (spec §7.7): returns the
 * caller's FRIENDS' submitted day-3 posts with server-minted signed URLs
 * (the proofs bucket is owner-read only — friend visibility is signed
 * server-side, spec §2.1), plus the caller's current vote and window state.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { betaDayInTimezone, dayCloseInstant } from '../_shared/betaDay.ts';
import { friendIdsOf } from '../_shared/pairing.ts';

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

const CV_DAY = 3;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

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

    const { data: betaSetting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'beta')
      .single();
    const beta = (betaSetting?.value ?? {}) as {
      start_date?: string;
      timezone?: string;
    };
    const timezone = beta.timezone ?? 'America/New_York';
    const startDate = beta.start_date ?? '';
    const today = betaDayInTimezone(startDate, timezone);

    const window = {
      beta_day: CV_DAY,
      open: today === CV_DAY,
      closes_at: dayCloseInstant(startDate, timezone, CV_DAY).toISOString(),
    };

    const { data: challenge } = await admin
      .from('challenges')
      .select('id')
      .eq('beta_day', CV_DAY)
      .single();
    if (!challenge) return json({ error: 'Unknown challenge' }, 400);

    const { data: myVote } = await admin
      .from('votes')
      .select('submission_id')
      .eq('voter_id', userId)
      .eq('beta_day', CV_DAY)
      .maybeSingle();

    const friends = await friendIdsOf(admin, userId);
    if (friends.length === 0) {
      return json({ window, my_vote: myVote?.submission_id ?? null, posts: [] });
    }

    const { data: subs } = await admin
      .from('submissions')
      .select('id, user_id, media_paths, submitted_at')
      .eq('challenge_id', challenge.id)
      .eq('state', 'submitted')
      .in('user_id', friends);
    if (!subs || subs.length === 0) {
      return json({ window, my_vote: myVote?.submission_id ?? null, posts: [] });
    }

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, username, display_name')
      .in('id', subs.map((s) => s.user_id as string));
    const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));

    const firstPaths = subs
      .map((s) => ((s.media_paths as string[] | null) ?? [])[0])
      .filter((p): p is string => !!p);
    const { data: signed } = await admin.storage
      .from('proofs')
      .createSignedUrls(firstPaths, SIGNED_URL_TTL_SECONDS);
    const urlByPath = new Map(
      (signed ?? [])
        .filter((s) => s.path && s.signedUrl && !s.error)
        .map((s) => [s.path as string, s.signedUrl]),
    );

    const posts = subs
      .map((s) => {
        const profile = profileById.get(s.user_id as string);
        const path = ((s.media_paths as string[] | null) ?? [])[0];
        return {
          submission_id: s.id as string,
          user_id: s.user_id as string,
          username: (profile?.username as string | null) ?? '',
          display_name: (profile?.display_name as string | null) ?? '',
          media_url: path ? (urlByPath.get(path) ?? null) : null,
          submitted_at: s.submitted_at as string | null,
        };
      })
      .sort((a, b) => (a.submitted_at ?? '').localeCompare(b.submitted_at ?? ''));

    return json({ window, my_vote: myVote?.submission_id ?? null, posts });
  } catch (e) {
    console.error('[vote-feed]', e);
    return json({ error: 'Vote feed failed' }, 500);
  }
});
