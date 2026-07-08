import { useMutation } from '@tanstack/react-query';

import { clearLocalNotifications } from '@/features/push/useLocalNotificationSync';
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
      // Scheduled local notifications die with the account (the server-side
      // push_tokens rows already cascaded with the profile).
      await clearLocalNotifications();
      await supabase.auth.signOut({ scope: 'local' });
    },
  });
}
