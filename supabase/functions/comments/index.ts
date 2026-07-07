/**
 * comments — a post's comment thread (spec §11 + M6.1 founder feedback):
 * top-level comments and their one-level replies, commenter profiles, the
 * caller's likes, and server-minted signed URLs for image comments (the
 * comment-media bucket is owner-read only, spec §2.1).
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

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

    const { post_id: postId } = (await req.json().catch(() => ({}))) as {
      post_id?: string;
    };
    if (!postId) return json({ error: 'post_id required' }, 400);

    // The caller must be able to see the post (same rule as can_view_post).
    const { data: post } = await admin
      .from('feed_posts')
      .select('id, author_id, removed')
      .eq('id', postId)
      .maybeSingle();
    if (!post) return json({ error: 'Post not found' }, 404);
    if (post.author_id !== userId) {
      if (post.removed) return json({ error: 'Post not found' }, 404);
      const { data: blocked } = await admin.rpc('is_blocked_pair', {
        a: post.author_id,
        b: userId,
      });
      if (blocked) return json({ error: 'Post not found' }, 404);
    }

    const { data: rows, error: commentsError } = await admin
      .from('comments')
      .select('id, post_id, user_id, body, media_path, parent_comment_id, like_count, removed, created_at')
      .eq('post_id', postId)
      .eq('removed', false)
      .order('created_at', { ascending: true });
    if (commentsError) throw new Error(commentsError.message);
    const comments = rows ?? [];
    if (comments.length === 0) return json({ comments: [] });

    // Blocks between the caller and commenters hide those comments (spec §6).
    const { data: blocks } = await admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const blockedIds = new Set(
      (blocks ?? []).map((b) =>
        b.blocker_id === userId ? (b.blocked_id as string) : (b.blocker_id as string),
      ),
    );
    const visible = comments.filter((c) => !blockedIds.has(c.user_id as string));
    if (visible.length === 0) return json({ comments: [] });

    const commenterIds = [...new Set(visible.map((c) => c.user_id as string))];
    const [{ data: profiles }, { data: myLikes }] = await Promise.all([
      admin
        .from('profiles')
        .select('id, username, display_name, avatar_config')
        .in('id', commenterIds),
      admin
        .from('comment_reactions')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', visible.map((c) => c.id as string)),
    ]);
    const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));
    const likedIds = new Set((myLikes ?? []).map((r) => r.comment_id as string));

    const paths = visible
      .map((c) => c.media_path as string | null)
      .filter((p): p is string => !!p);
    const urlByPath = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await admin.storage
        .from('comment-media')
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl && !s.error) urlByPath.set(s.path, s.signedUrl);
      }
    }

    const shaped = visible.map((c) => {
      const profile = profileById.get(c.user_id as string);
      const mediaPath = c.media_path as string | null;
      return {
        id: c.id as string,
        post_id: c.post_id as string,
        user_id: c.user_id as string,
        username: (profile?.username as string | null) ?? '',
        display_name: (profile?.display_name as string | null) ?? '',
        body: c.body as string,
        media_url: mediaPath ? (urlByPath.get(mediaPath) ?? null) : null,
        parent_comment_id: c.parent_comment_id as string | null,
        like_count: c.like_count as number,
        viewer_liked: likedIds.has(c.id as string),
        created_at: c.created_at as string,
      };
    });

    return json({ comments: shaped });
  } catch (e) {
    console.error('[comments]', e);
    return json({ error: 'Comments failed' }, 500);
  }
});
