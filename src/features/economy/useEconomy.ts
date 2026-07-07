import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/useProfile';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Crate = Database['public']['Tables']['crates']['Row'];
export type Cosmetic = Database['public']['Tables']['cosmetics']['Row'];
export type CrateTier = Crate['tier'];

export const economyKeys = {
  crates: (userId: string) => ['crates', userId] as const,
  cosmetics: (userId: string) => ['user-cosmetics', userId] as const,
  catalog: ['cosmetics-catalog'] as const,
  ledger: (userId: string) => ['coins-ledger', userId] as const,
  h2hRecord: (userId: string) => ['h2h-record', userId] as const,
};

/** The full seeded cosmetics catalog (32 rows, effectively static). */
export function useCosmeticsCatalog() {
  return useQuery({
    queryKey: economyKeys.catalog,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Cosmetic[]> => {
      const { data, error } = await supabase.from('cosmetics').select('*');
      if (error) throw error;
      return data;
    },
  });
}

/** My crates, unopened first, newest first (Inventory, spec §9.3). */
export function useMyCrates(userId: string | undefined) {
  return useQuery({
    queryKey: economyKeys.crates(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<Crate[]> => {
      const { data, error } = await supabase
        .from('crates')
        .select('*')
        .order('opened', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export interface OwnedCosmetic {
  id: string;
  cosmetic: Cosmetic;
}

/** My cosmetics with their catalog rows (Inventory list). */
export function useMyCosmetics(userId: string | undefined) {
  return useQuery({
    queryKey: economyKeys.cosmetics(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<OwnedCosmetic[]> => {
      const { data, error } = await supabase
        .from('user_cosmetics')
        .select('id, cosmetics(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as { id: string; cosmetics: Cosmetic }[]).map((row) => ({
        id: row.id,
        cosmetic: row.cosmetics,
      }));
    },
  });
}

/** Buy a crate (spec §9.5) — server-validated RPC; balance can't go negative. */
export function useBuyCrate(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tier: Exclude<CrateTier, 'gold'>) => {
      const { error } = await supabase.rpc('buy_crate', { tier_in: tier });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: economyKeys.crates(userId ?? 'anonymous'),
      });
      void queryClient.invalidateQueries({
        queryKey: profileKeys.own(userId ?? 'anonymous'),
      });
      void queryClient.invalidateQueries({
        queryKey: economyKeys.ledger(userId ?? 'anonymous'),
      });
    },
  });
}

export interface CrateOpenResult {
  outcome: 'awarded' | 'dupe';
  cosmetic: Pick<Cosmetic, 'id' | 'slot' | 'name' | 'rarity' | 'asset_slot_name'>;
  refund_coins: number | null;
}

/** Open a crate — the roll happens server-side (spec §9.4 LOCKED). */
export function useOpenCrate(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crateId: string): Promise<CrateOpenResult> => {
      const { data, error } = await supabase.functions.invoke('crate-open', {
        body: { crate_id: crateId },
      });
      if (error) throw error;
      const payload = data as CrateOpenResult & { error?: string };
      if (payload.error) throw new Error(payload.error);
      return payload;
    },
    onSuccess: () => {
      const uid = userId ?? 'anonymous';
      void queryClient.invalidateQueries({ queryKey: economyKeys.crates(uid) });
      void queryClient.invalidateQueries({ queryKey: economyKeys.cosmetics(uid) });
      void queryClient.invalidateQueries({ queryKey: profileKeys.own(uid) });
      void queryClient.invalidateQueries({ queryKey: economyKeys.ledger(uid) });
    },
  });
}

/** Lifetime coins earned (positive ledger entries) — Profile stat (spec §11). */
export function useCoinsEarned(userId: string | undefined) {
  return useQuery({
    queryKey: economyKeys.ledger(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.from('coins_ledger').select('delta');
      if (error) throw error;
      return data.reduce((sum, row) => sum + Math.max(0, row.delta), 0);
    },
  });
}

/** Resolved H2H record (W-L) — Profile stat (spec §11). */
export function useH2HRecord(userId: string | undefined) {
  return useQuery({
    queryKey: economyKeys.h2hRecord(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<{ wins: number; losses: number }> => {
      // One row per protagonist per day (spec §6): my record = my rows only
      // (the rival's copy of a duel would double-count it).
      const { data, error } = await supabase
        .from('h2h_matches')
        .select('winner_user_id, status')
        .eq('status', 'resolved')
        .eq('protagonist_id', userId as string);
      if (error) throw error;
      const wins = data.filter((m) => m.winner_user_id === userId).length;
      return { wins, losses: data.length - wins };
    },
  });
}
