import { useQuery } from '@tanstack/react-query';

import {
  useChallenges,
  useMySubmissions,
  type Challenge,
  type Submission,
} from '@/features/challenge/useChallenge';
import { supabase } from '@/lib/supabase';

export interface ProofMedia {
  path: string;
  url: string;
  kind: 'image' | 'video';
}

export interface MyPost {
  submission: Submission;
  challenge: Challenge | undefined;
  media: ProofMedia[];
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

function mediaKind(path: string): 'image' | 'video' {
  return /\.(mp4|mov)$/i.test(path) ? 'video' : 'image';
}

/**
 * The signed-in user's own submitted proofs as feed posts (newest day first).
 * Early slice of the feed: friends' posts, likes, and comments land in M6 —
 * this covers "see your own post" from the M4 review.
 */
export function useMyPosts(userId: string | undefined) {
  const { data: submissions, isLoading: submissionsLoading } =
    useMySubmissions(userId);
  const { data: challenges } = useChallenges();

  const submitted = (submissions ?? [])
    .filter((s) => s.state === 'submitted')
    .sort((a, b) => b.beta_day - a.beta_day);

  const paths = submitted.flatMap((s) => s.media_paths);

  const { data: urlByPath, isLoading: urlsLoading } = useQuery({
    queryKey: ['proof-urls', userId, paths],
    enabled: paths.length > 0,
    // Refresh before the signed URLs expire.
    staleTime: (SIGNED_URL_TTL_SECONDS - 300) * 1000,
    queryFn: async (): Promise<Map<string, string>> => {
      const { data, error } = await supabase.storage
        .from('proofs')
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      const entries: [string, string][] = [];
      for (const d of data) {
        if (d.path && d.signedUrl && !d.error) entries.push([d.path, d.signedUrl]);
      }
      return new Map(entries);
    },
  });

  const posts: MyPost[] = submitted.map((submission) => ({
    submission,
    challenge: challenges?.find((c) => c.id === submission.challenge_id),
    media: submission.media_paths
      .map((path) => ({ path, url: urlByPath?.get(path) ?? '', kind: mediaKind(path) }))
      .filter((m) => m.url !== ''),
  }));

  return {
    posts,
    isLoading: submissionsLoading || (paths.length > 0 && urlsLoading),
  };
}
