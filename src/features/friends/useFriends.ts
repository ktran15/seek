import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { friendIdsOf, type FriendshipEdge } from './graph';

export interface FriendshipRow extends FriendshipEdge {
  id: string;
  created_at: string;
  responded_at: string | null;
}

export interface ProfileSummary {
  id: string;
  username: string | null;
  display_name: string | null;
}

export const friendKeys = {
  mine: (userId: string) => ['friendships', userId] as const,
  search: (term: string) => ['profile-search', term] as const,
  profiles: (ids: string[]) => ['profiles-by-id', ...ids] as const,
};

/** All my friendship edges (RLS returns only rows I participate in). */
export function useMyFriendships(userId: string | undefined) {
  return useQuery({
    queryKey: friendKeys.mine(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<FriendshipRow[]> => {
      const { data, error } = await supabase.from('friendships').select('*');
      if (error) throw error;
      return data;
    },
  });
}

/** Accepted-friend count for the profile header. */
export function useFriendCount(userId: string | undefined): number {
  const { data } = useMyFriendships(userId);
  if (!userId || !data) return 0;
  return friendIdsOf(data, userId).length;
}

/** Username prefix search via the block-aware SQL function. */
export function useSearchProfiles(term: string) {
  const trimmed = term.trim().toLowerCase();
  return useQuery({
    queryKey: friendKeys.search(trimmed),
    enabled: trimmed.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_profiles', {
        term: trimmed,
      });
      if (error) throw error;
      return data;
    },
  });
}

/** Fetch profile summaries for a set of user ids (e.g. pending requesters). */
export function useProfilesById(ids: string[]) {
  return useQuery({
    queryKey: friendKeys.profiles([...ids].sort()),
    enabled: ids.length > 0,
    queryFn: async (): Promise<ProfileSummary[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', ids);
      if (error) throw error;
      return data;
    },
  });
}

export function useSendFriendRequest(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (addresseeId: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: userId, addressee_id: addresseeId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: friendKeys.mine(userId ?? 'anonymous'),
      });
    },
  });
}

export function useRespondToRequest(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      friendshipId: string;
      response: 'accepted' | 'declined';
    }) => {
      const { error } = await supabase
        .from('friendships')
        .update({
          status: input.response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', input.friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: friendKeys.mine(userId ?? 'anonymous'),
      });
    },
  });
}
