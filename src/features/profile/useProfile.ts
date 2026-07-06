import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileKeys = {
  own: (userId: string) => ['profile', userId] as const,
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** The signed-in user's profile row (created by the signup trigger). */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.own(userId ?? 'anonymous'),
    queryFn: () => fetchProfile(userId as string),
    enabled: !!userId,
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
export function isOnboarded(profile: Profile | null | undefined): boolean {
  return !!profile?.username && !!profile?.onboarding_completed_at;
}
