import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface VotePost {
  submission_id: string;
  user_id: string;
  username: string;
  display_name: string;
  media_url: string | null;
  submitted_at: string | null;
}

export interface VoteFeed {
  window: { beta_day: number; open: boolean; closes_at: string };
  my_vote: string | null;
  posts: VotePost[];
}

const voteKeys = {
  feed: ['vote-feed'] as const,
};

/** Friends' day-3 posts + my current vote, via the vote-feed Edge Function. */
export function useVoteFeed(enabled: boolean) {
  return useQuery({
    queryKey: voteKeys.feed,
    enabled,
    // Signed URLs last an hour; refetch keeps the countdown + posts fresh.
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<VoteFeed> => {
      const { data, error } = await supabase.functions.invoke('vote-feed');
      if (error) throw error;
      return data as VoteFeed;
    },
  });
}

/** Cast (or change) the one day-3 vote — server-validated RPC (spec §7.7). */
export function useCastVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.rpc('cast_vote', {
        target_submission_id: submissionId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voteKeys.feed });
    },
  });
}
