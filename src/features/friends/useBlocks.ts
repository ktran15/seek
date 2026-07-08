import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** One entry in Settings → Blocked users (spec §12). */
export interface BlockedUser {
  blockId: string;
  userId: string;
  username: string | null;
  displayName: string | null;
  blockedAt: string;
}

export const blockKeys = {
  mine: (userId: string) => ['blocks', userId] as const,
};

/** The viewer's block list with profile names (RLS returns own blocks only). */
export function useBlockedUsers(userId: string | undefined) {
  return useQuery({
    queryKey: blockKeys.mine(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<BlockedUser[]> => {
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('id, blocked_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (blocks.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', blocks.map((b) => b.blocked_id));
      if (profilesError) throw profilesError;
      const profileById = new Map(profiles.map((p) => [p.id, p]));

      return blocks.map((b) => {
        const profile = profileById.get(b.blocked_id);
        return {
          blockId: b.id,
          userId: b.blocked_id,
          username: profile?.username ?? null,
          displayName: profile?.display_name ?? null,
          blockedAt: b.created_at,
        };
      });
    },
  });
}

/** Remove a block — the pair reappears in feeds/suggestions/pairing (§6). */
export function useUnblockUser(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('blocks').delete().eq('id', blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Everything egocentric can change when a block lifts (mirror of
      // useBlockUser's invalidations).
      void queryClient.invalidateQueries({ queryKey: blockKeys.mine(userId ?? 'anonymous') });
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      void queryClient.invalidateQueries({ queryKey: ['friendships'] });
      void queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] });
    },
  });
}
