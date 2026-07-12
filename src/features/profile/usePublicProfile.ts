import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface PublicProfileStats {
  /** Beta days with a submitted attempt (stops climbed = length). */
  submittedDays: number[];
  h2hWins: number;
  h2hLosses: number;
  votesWon: number;
  coinsEarned: number;
  /** Community-vote 1st placements (Vote Winner badge input). */
  voteFirsts: number;
}

/**
 * Another user's spec-§11 stat set via the block-aware SECURITY DEFINER RPC
 * (the stat tables themselves stay select-own under RLS). `null` data means
 * the profile is unavailable to this viewer — blocked pair or deleted
 * account — and the screen shows its unavailable state instead of numbers.
 */
export function usePublicProfileStats(targetId: string | undefined) {
  return useQuery({
    queryKey: ['public-profile-stats', targetId ?? 'none'],
    enabled: !!targetId,
    queryFn: async (): Promise<PublicProfileStats | null> => {
      const { data, error } = await supabase.rpc('get_public_profile_stats', {
        target: targetId as string,
      });
      if (error) throw error;
      const row = data[0];
      if (!row) return null;
      return {
        submittedDays: row.submitted_days,
        h2hWins: row.h2h_wins,
        h2hLosses: row.h2h_losses,
        votesWon: row.votes_won,
        coinsEarned: row.coins_earned,
        voteFirsts: row.vote_firsts,
      };
    },
  });
}
