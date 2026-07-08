import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Apple-required account deletion (spec §12): the delete-account Edge
 * Function purges media and cascades the DB graph off the verified JWT,
 * then the local session is cleared (the auth user no longer exists, so
 * only a local sign-out makes sense). The root guard routes to Auth.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      const payload = data as { deleted?: boolean; error?: string };
      if (payload.error || !payload.deleted) {
        throw new Error(payload.error ?? 'Account deletion failed. Try again.');
      }
      await supabase.auth.signOut({ scope: 'local' });
    },
  });
}
