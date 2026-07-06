import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

interface SessionState {
  session: Session | null;
  /** True until the persisted session (if any) has been restored. */
  isLoading: boolean;
}

/** Auth session, kept live via onAuthStateChange. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setState({ session: data.session, isLoading: false });
      })
      .catch(() => {
        if (mounted) setState({ session: null, isLoading: false });
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setState({ session, isLoading: false });
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
