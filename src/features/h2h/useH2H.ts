import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type AppNotification = Database['public']['Tables']['notifications']['Row'];

export const h2hKeys = {
  notifications: (userId: string) => ['notifications', userId] as const,
};

/**
 * Ask the server to pair (and resolve) after an H2H-day submission
 * (spec §7.6). Failures are safe to swallow: day-close sweeps and pairs
 * anything the client missed.
 */
export async function requestPairing(betaDay: number): Promise<void> {
  const { error } = await supabase.functions.invoke('h2h-pair', {
    body: { beta_day: betaDay },
  });
  if (error) throw error;
}

/** My notification rows (H2H + vote results land here from M5). */
export function useMyNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: h2hKeys.notifications(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

/** Mark every unread notification read (called when the screen is viewed). */
export function useMarkNotificationsRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: h2hKeys.notifications(userId ?? 'anonymous'),
      });
    },
  });
}
