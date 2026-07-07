import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AvatarConfig } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type FeedScope = 'friends' | 'fof' | 'explore';

export interface FeedMedia {
  path: string;
  url: string | null;
}

export interface FeedPost {
  post_id: string;
  submission_id: string;
  beta_day: number;
  created_at: string;
  like_count: number;
  comment_count: number;
  viewer_liked: boolean;
  is_own: boolean;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_config: AvatarConfig | null;
  };
  challenge: {
    title: string;
    mode: 'SP' | 'H2H' | 'CV';
    capture_type: string;
  };
  score: number | null;
  passed: boolean | null;
  difficulty: string | null;
  media: FeedMedia[];
}

export type ReportReason =
  | 'inappropriate'
  | 'spam'
  | 'fake_proof'
  | 'harassment'
  | 'other';

export const feedKeys = {
  all: ['feed'] as const,
  scope: (scope: FeedScope) => ['feed', scope] as const,
  comments: (postId: string) => ['comments', postId] as const,
};

/** One Home feed via the feed Edge Function (signed media, block-aware). */
export function useFeed(scope: FeedScope, enabled = true) {
  return useQuery({
    queryKey: feedKeys.scope(scope),
    enabled,
    // Signed URLs last an hour; counts stay fresh via focus/interval refetch.
    staleTime: 60 * 1000,
    queryFn: async (): Promise<FeedPost[]> => {
      const { data, error } = await supabase.functions.invoke('feed', {
        body: { scope },
      });
      if (error) throw error;
      const payload = data as { posts?: FeedPost[]; error?: string };
      if (payload.error) throw new Error(payload.error);
      return payload.posts ?? [];
    },
  });
}

/** Flip a post's like in every cached feed scope (optimistic). */
function setLikeInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  liked: boolean,
) {
  queryClient.setQueriesData<FeedPost[]>({ queryKey: feedKeys.all }, (posts) =>
    posts?.map((p) =>
      p.post_id === postId && p.viewer_liked !== liked
        ? { ...p, viewer_liked: liked, like_count: Math.max(0, p.like_count + (liked ? 1 : -1)) }
        : p,
    ),
  );
}

/** Like/unlike toggle — optimistic across all three feeds, rolled back on error. */
export function useToggleLike(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { postId: string; liked: boolean }) => {
      if (!userId) throw new Error('Not signed in');
      if (input.liked) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('post_id', input.postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reactions')
          .insert({ post_id: input.postId, user_id: userId });
        // A double-tap race can insert twice; the unique(post_id,user_id)
        // violation means the like already stuck — not a failure.
        if (error && error.code !== '23505') throw error;
      }
    },
    onMutate: (input) => setLikeInCaches(queryClient, input.postId, !input.liked),
    onError: (_e, input) => setLikeInCaches(queryClient, input.postId, input.liked),
  });
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  removed: boolean;
  created_at: string;
}

/** Comments for one post, oldest first (RLS scopes to visible posts). */
export function useComments(postId: string) {
  return useQuery({
    queryKey: feedKeys.comments(postId),
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddComment(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { postId: string; body: string }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('comments')
        .insert({ post_id: input.postId, user_id: userId, body: input.body });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: feedKeys.comments(input.postId) });
      // comment_count on the cards comes from the counter trigger.
      void queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}

/** File a report (post, comment, or user) — lands in the reports table (§12). */
export function useReport(userId: string | undefined) {
  return useMutation({
    mutationFn: async (input: {
      reason: ReportReason;
      postId?: string;
      commentId?: string;
      reportedUserId?: string;
      details?: string;
    }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('reports').insert({
        reporter_id: userId,
        post_id: input.postId,
        comment_id: input.commentId,
        reported_user_id: input.reportedUserId,
        reason: input.reason,
        details: input.details,
      });
      if (error) throw error;
    },
  });
}

/** Block a user — scrubs them from feeds/suggestions/H2H/votes both ways (§6). */
export function useBlockUser(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: userId, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => {
      // Everything egocentric can change when a block lands.
      void queryClient.invalidateQueries({ queryKey: feedKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['friendships'] });
      void queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] });
    },
  });
}
