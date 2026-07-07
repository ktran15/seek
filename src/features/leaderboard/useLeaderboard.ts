import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

// Same rank math the weekly-payout Edge Function uses (spec §2.1: share
// logic client/server) — what the board shows is what the payout pays.
import { weeklyRank } from '../../../supabase/functions/_shared/weekly';

export interface LeaderboardRow {
  user_id: string;
  username: string;
  display_name: string;
  points: number;
  /** Competition rank; null = zero points (unranked, mirrors payout rules). */
  rank: number | null;
  isMe: boolean;
}

/**
 * Egocentric weekly board (spec §9.2): me + accepted friends, ranked by
 * summed weekly points via the block-aware get_weekly_leaderboard RPC.
 */
export function useLeaderboard(userId: string | undefined) {
  return useQuery({
    queryKey: ['weekly-leaderboard', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase.rpc('get_weekly_leaderboard');
      if (error) throw error;
      const points = data.map((r) => r.points);
      return data.map((row) => ({
        user_id: row.user_id,
        username: row.username ?? '',
        display_name: row.display_name ?? '',
        points: row.points,
        rank: weeklyRank(
          row.points,
          points.filter((_p, i) => data[i]?.user_id !== row.user_id),
        ),
        isMe: row.user_id === userId,
      }));
    },
  });
}
