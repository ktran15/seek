import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type Difficulty = 'easy' | 'medium' | 'hard';

export const challengeKeys = {
  all: ['challenges'] as const,
  mySubmissions: (userId: string) => ['submissions', userId] as const,
};

/** The seeded 7-day catalog (content revealed client-side on entry only). */
export function useChallenges() {
  return useQuery({
    queryKey: challengeKeys.all,
    staleTime: Infinity, // seeded + locked for the beta
    queryFn: async (): Promise<Challenge[]> => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('beta_day');
      if (error) throw error;
      return data;
    },
  });
}

export function useChallengeByDay(day: number): Challenge | undefined {
  const { data } = useChallenges();
  return data?.find((c) => c.beta_day === day);
}

/** All of my submissions (mountain states + one-attempt locks). */
export function useMySubmissions(userId: string | undefined) {
  return useQuery({
    queryKey: challengeKeys.mySubmissions(userId ?? 'anonymous'),
    enabled: !!userId,
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase.from('submissions').select('*');
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Begin an attempt (spec §7.4): creates the in_progress row, or crash-safe
 * resets an existing one (media cleared, difficulty may be re-chosen —
 * the attempt is NOT burned). Fails loudly if already submitted.
 */
export function useBeginAttempt(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      challenge: Challenge;
      betaDay: number;
      difficulty?: Difficulty;
    }): Promise<Submission> => {
      if (!userId) throw new Error('Not signed in');

      const { data: existing, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('challenge_id', input.challenge.id)
        .maybeSingle();
      if (fetchError) throw fetchError;

      if (existing?.state === 'submitted') {
        throw new Error('You already used your one attempt for this challenge.');
      }

      if (existing) {
        // Crash-safe reset of the same attempt.
        const { data, error } = await supabase
          .from('submissions')
          .update({
            media_paths: [],
            ...(input.difficulty ? { difficulty: input.difficulty } : {}),
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          user_id: userId,
          challenge_id: input.challenge.id,
          beta_day: input.betaDay,
          ...(input.difficulty ? { difficulty: input.difficulty } : {}),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: challengeKeys.mySubmissions(userId ?? 'anonymous'),
      });
    },
  });
}

/** Submit the attempt: terminal (DB policy blocks any later update). */
export function useSubmitAttempt(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      submissionId: string;
      passed?: boolean;
      score?: number;
      mediaPaths: string[];
    }) => {
      const { error } = await supabase
        .from('submissions')
        .update({
          state: 'submitted',
          submitted_at: new Date().toISOString(),
          ...(input.passed !== undefined ? { passed: input.passed } : {}),
          ...(input.score !== undefined ? { score: input.score } : {}),
          media_paths: input.mediaPaths,
        })
        .eq('id', input.submissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: challengeKeys.mySubmissions(userId ?? 'anonymous'),
      });
    },
  });
}
