import { useLocalSearchParams } from 'expo-router';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProfileView } from '@/features/profile/ProfileView';

/**
 * Another user's profile (founder-directed, 2026-07-10): the full Profile
 * screen in read-only mode — avatar, names, public §11 stats + badges, and a
 * friend-request control. Reached from feed posts and friends-list rows.
 * Blocked pairs get the screen's "Profile unavailable" state (the block-aware
 * stats RPC returns nothing); feeds never surface them in the first place.
 */
export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = typeof id === 'string' ? id : undefined;

  return (
    <ErrorBoundary screen="UserProfile">
      <ProfileView viewUserId={userId} />
    </ErrorBoundary>
  );
}
