import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * The client-selectable columns of a profile. `coins` (balance) and
 * `joined_beta_day` are deliberately excluded — column privileges (M13 audit
 * M3, Option A) make them unreadable through the table; the owner's balance
 * comes from useMyCoins() instead. Fetch these explicitly, never `select('*')`.
 */
const PUBLIC_PROFILE_COLUMNS =
  'id, username, display_name, avatar_config, bio, onboarding_completed_at, created_at, beaver_name, happiness, streak_count';
export type PublicProfile = Pick<
  Profile,
  | 'id'
  | 'username'
  | 'display_name'
  | 'avatar_config'
  | 'bio'
  | 'onboarding_completed_at'
  | 'created_at'
  // Beaver identity + care loop (spec §10) — public: another user's profile
  // shows their beaver at its Happiness state, and 🔥streak sits by the name.
  | 'beaver_name'
  | 'happiness'
  | 'streak_count'
>;

export const profileKeys = {
  own: (userId: string) => ['profile', userId] as const,
  coins: (userId: string) => ['profile-coins', userId] as const,
};

async function fetchProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** A profile's public columns (self or any other user). No balance here. */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.own(userId ?? 'anonymous'),
    queryFn: () => fetchProfile(userId as string),
    enabled: !!userId,
  });
}

/**
 * The signed-in user's own coin balance via the owner-only my_coins() RPC
 * (M13 audit M3): the balance column is not client-readable off the profiles
 * row. Invalidated by the economy mutations (buy/open crate) so the Shop
 * pill stays live.
 */
export function useMyCoins(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.coins(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('my_coins');
      if (error) throw error;
      return data ?? 0;
    },
  });
}

/** Update own profile (only client-updatable columns) and refresh the cache. */
export function useUpdateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  return async (update: ProfileUpdate): Promise<void> => {
    if (!userId) throw new Error('Not signed in');
    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', userId);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: profileKeys.own(userId) });
  };
}

/** Onboarding is complete once a username is claimed and the flow finished. */
export function isOnboarded(
  profile: Pick<PublicProfile, 'username' | 'onboarding_completed_at'> | null | undefined,
): boolean {
  return !!profile?.username && !!profile?.onboarding_completed_at;
}
