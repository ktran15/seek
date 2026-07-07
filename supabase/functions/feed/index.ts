/**
 * feed — the three Home feeds (spec §5, §11): friends / friends-of-friends /
 * explore, block-aware, with server-minted signed URLs for EVERY media path
 * (the proofs bucket is owner-read only — cross-user visibility only ever
 * exists as signed URLs, spec §2.1).
 *
 * Scopes:
 *   friends — the caller + accepted friends, newest first.
 *   fof     — friends-of-friends (via the RLS-tested get_fof_profiles RPC,
 *             run AS the caller), newest first.
 *   explore — everyone (minus blocks), CURRENT beta day only, sorted
 *             like-count desc with recency tiebreak (spec §5).
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { betaDayInTimezone } from '../_shared/betaDay.ts';
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

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const PAGE_SIZE = 50;

type Scope = 'friends' | 'fof' | 'explore';

interface FeedPostRow {
  id: string;
  submission_id: string;
  author_id: string;
  beta_day: number;
  like_count: number;
  comment_count: number;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    if (authError || !userData.user) return json({ error: 'Not signed in' }, 401);
    const userId = userData.user.id;

    // Params arrive as a JSON body (functions.invoke POSTs) or query string.
    let body: { scope?: string; before?: string } = {};
    if (req.method === 'POST') {
      body = (await req.json().catch(() => ({}))) as typeof body;
    }
    const url = new URL(req.url);
    const scope = (body.scope ?? url.searchParams.get('scope') ?? 'friends') as Scope;
    if (!['friends', 'fof', 'explore'].includes(scope)) {
      return json({ error: 'Unknown scope' }, 400);
    }
    // Recency cursor for friends/fof paging (explore is a top-N, no cursor).
    const before = body.before ?? url.searchParams.get('before');

    let query = admin
      .from('feed_posts')
      .select('id, submission_id, author_id, beta_day, like_count, comment_count, created_at')
      .eq('removed', false)
      .limit(PAGE_SIZE);

    if (scope === 'friends') {
      const friends = await friendIdsOf(admin, userId);
      query = query
        .in('author_id', [userId, ...friends])
        .order('created_at', { ascending: false });
      if (before) query = query.lt('created_at', before);
    } else if (scope === 'fof') {
      // Run the graph RPC AS the caller so auth.uid() resolves (it already
      // excludes self, direct friends, and blocked pairs — unit-tested in M3).
      const asUser = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: fof, error: fofError } = await asUser.rpc('get_fof_profiles');
      if (fofError) throw new Error(fofError.message);
      const fofIds = ((fof ?? []) as { id: string }[]).map((p) => p.id);
      if (fofIds.length === 0) return json({ posts: [] });
      query = query.in('author_id', fofIds).order('created_at', { ascending: false });
      if (before) query = query.lt('created_at', before);
    } else {
      const { data: betaSetting } = await admin
        .from('app_settings')
        .select('value')
        .eq('key', 'beta')
        .single();
      const beta = (betaSetting?.value ?? {}) as { start_date?: string; timezone?: string };
      const today = betaDayInTimezone(
        beta.start_date ?? '',
        beta.timezone ?? 'America/New_York',
      );
      if (today < 1 || today > 7) return json({ posts: [] });

      const { data: blocks, error: blocksError } = await admin
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
      if (blocksError) throw new Error(blocksError.message);
      const blockedIds = (blocks ?? []).map((b) =>
        b.blocker_id === userId ? (b.blocked_id as string) : (b.blocker_id as string),
      );

      query = query
        .eq('beta_day', today)
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false });
      if (blockedIds.length > 0) {
        query = query.not('author_id', 'in', `(${blockedIds.join(',')})`);
      }
    }

    const { data: postRows, error: postsError } = await query;
    if (postsError) throw new Error(postsError.message);
    const posts = (postRows ?? []) as FeedPostRow[];
    if (posts.length === 0) return json({ posts: [] });

    const authorIds = [...new Set(posts.map((p) => p.author_id))];
    const submissionIds = posts.map((p) => p.submission_id);

    const [{ data: profiles }, { data: subs }, { data: challenges }, { data: myReactions }] =
      await Promise.all([
        admin
          .from('profiles')
          .select('id, username, display_name, avatar_config')
          .in('id', authorIds),
        admin
          .from('submissions')
          .select('id, challenge_id, score, passed, difficulty, media_paths')
          .in('id', submissionIds),
        admin.from('challenges').select('id, beta_day, title, mode, capture_type'),
        admin
          .from('reactions')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', posts.map((p) => p.id)),
      ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));
    const subById = new Map((subs ?? []).map((s) => [s.id as string, s]));
    const challengeById = new Map((challenges ?? []).map((c) => [c.id as string, c]));
    const likedPostIds = new Set((myReactions ?? []).map((r) => r.post_id as string));

    // Sign EVERY media path across the page in one batch.
    const allPaths = posts.flatMap(
      (p) => ((subById.get(p.submission_id)?.media_paths as string[] | null) ?? []),
    );
    const urlByPath = new Map<string, string>();
    if (allPaths.length > 0) {
      const { data: signed, error: signError } = await admin.storage
        .from('proofs')
        .createSignedUrls(allPaths, SIGNED_URL_TTL_SECONDS);
      if (signError) throw new Error(signError.message);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl && !s.error) urlByPath.set(s.path, s.signedUrl);
      }
    }

    const shaped = posts.map((p) => {
      const profile = profileById.get(p.author_id);
      const sub = subById.get(p.submission_id);
      const challenge = sub ? challengeById.get(sub.challenge_id as string) : undefined;
      const paths = ((sub?.media_paths as string[] | null) ?? []);
      return {
        post_id: p.id,
        submission_id: p.submission_id,
        beta_day: p.beta_day,
        created_at: p.created_at,
        like_count: p.like_count,
        comment_count: p.comment_count,
        viewer_liked: likedPostIds.has(p.id),
        is_own: p.author_id === userId,
        author: {
          id: p.author_id,
          username: (profile?.username as string | null) ?? '',
          display_name: (profile?.display_name as string | null) ?? '',
          avatar_config: profile?.avatar_config ?? null,
        },
        challenge: {
          title: (challenge?.title as string | null) ?? '',
          mode: (challenge?.mode as string | null) ?? 'SP',
          capture_type: (challenge?.capture_type as string | null) ?? 'camera_photo',
        },
        score: (sub?.score as number | null) ?? null,
        passed: (sub?.passed as boolean | null) ?? null,
        difficulty: (sub?.difficulty as string | null) ?? null,
        media: paths.map((path) => ({ path, url: urlByPath.get(path) ?? null })),
      };
    });

    return json({ posts: shaped });
  } catch (e) {
    console.error('[feed]', e);
    return json({ error: 'Feed failed' }, 500);
  }
});
