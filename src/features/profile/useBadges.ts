import { useQuery } from '@tanstack/react-query';

import { config } from '@/config';
import { useMySubmissions } from '@/features/challenge/useChallenge';
import { useH2HRecord } from '@/features/economy/useEconomy';
import { supabase } from '@/lib/supabase';

import { deriveBadges, type BadgeStatus } from './badges';

/** My 1st-place community-vote count (own vote_result rows under RLS). */
function useVoteFirsts(userId: string | undefined) {
  return useQuery({
    queryKey: ['vote-firsts', userId ?? 'anonymous'],
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('payload')
        .eq('type', 'vote_result');
      if (error) throw error;
      return data.filter(
        (n) => (n.payload as { placement?: unknown }).placement === 1,
      ).length;
    },
  });
}

/** Badge statuses derived live from existing data (badges.ts is the logic). */
export function useBadges(userId: string | undefined): BadgeStatus[] {
  const { data: submissions } = useMySubmissions(userId);
  const { data: h2hRecord } = useH2HRecord(userId);
  const { data: voteFirsts } = useVoteFirsts(userId);

  const submittedDays = new Set(
    (submissions ?? [])
      .filter((s) => s.state === 'submitted')
      .map((s) => s.beta_day),
  );

  return deriveBadges({
    submittedDays,
    lengthDays: config.beta.lengthDays,
    h2hWins: h2hRecord?.wins ?? 0,
    voteFirsts: voteFirsts ?? 0,
  });
}
