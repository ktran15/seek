import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PressButton } from '@/components/ui/PressButton';
import { useSession } from '@/features/auth/useSession';
import { friendIdsOf } from '@/features/friends/graph';
import { useMyFriendships, useProfilesById } from '@/features/friends/useFriends';
import { sendInvite } from '@/features/invites/sendInvite';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Friends list (spec §6, §7.10) — opened from the Profile header count.
 *
 * "Friends" here = ACCEPTED friendships. The data model is MUTUAL (one
 * accepted edge makes both users friends — there is no follower/following
 * asymmetry anywhere in the schema), so this list is exactly the set every
 * egocentric surface reads: the leaderboard, the H2H pool, feed scopes, and
 * the header count itself (same `friendIdsOf`, so list and count can't
 * disagree).
 */
export default function FriendsScreen() {
  const { session } = useSession();
  const myId = session?.user.id;
  const {
    data: friendships,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useMyFriendships(myId);

  const friendIds = useMemo(
    () => (myId && friendships ? friendIdsOf(friendships, myId) : []),
    [friendships, myId],
  );
  const { data: profiles } = useProfilesById(friendIds);
  const [inviting, setInviting] = useState(false);

  const friends = useMemo(
    () =>
      (profiles ?? [])
        .slice()
        .sort((a, b) =>
          (a.display_name ?? a.username ?? '').localeCompare(
            b.display_name ?? b.username ?? '',
          ),
        ),
    [profiles],
  );

  const invite = async () => {
    if (!myId) return;
    setInviting(true);
    try {
      await sendInvite(myId);
    } catch (e) {
      Alert.alert('Could not share', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setInviting(false);
    }
  };

  const loading = isLoading || (friendIds.length > 0 && profiles === undefined);

  return (
    <ErrorBoundary screen="Friends">
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.container}
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const name = item.display_name || item.username || 'Unknown user';
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${name}'s profile`}
              onPress={() => router.push(`/user/${item.id}`)}
              style={styles.row}
            >
              <View style={styles.avatar}>
                <Text style={[textStyles.headerS, styles.avatarLetter]}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.nameBlock}>
                <Text style={[textStyles.bodyEmphasis, styles.name]} numberOfLines={1}>
                  {name}
                </Text>
                {item.username && (
                  <Text style={[textStyles.caption, styles.username]} numberOfLines={1}>
                    @{item.username}
                  </Text>
                )}
              </View>
              <Text style={[textStyles.headerS, styles.chevron]}>›</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={colors.textSecondary} />
            ) : error ? (
              <>
                <Text style={[textStyles.headerL, styles.emptyTitle]}>
                  Couldn’t load your friends
                </Text>
                <Text style={[textStyles.body, styles.emptyCopy]}>
                  Check your connection and try again.
                </Text>
                <PressButton
                  label={isRefetching ? 'Retrying…' : 'Retry'}
                  onPress={() => void refetch()}
                  disabled={isRefetching}
                  style={styles.emptyButton}
                />
              </>
            ) : (
              <>
                <Text style={[textStyles.headerL, styles.emptyTitle]}>
                  No friends yet — invite someone!
                </Text>
                <Text style={[textStyles.body, styles.emptyCopy]}>
                  Seek runs on rivalry: your leaderboard, head-to-heads, and
                  votes are all between you and your friends.
                </Text>
                <PressButton
                  label={inviting ? 'Opening…' : 'Invite a friend'}
                  onPress={() => void invite()}
                  disabled={inviting}
                  style={styles.emptyButton}
                />
              </>
            )}
          </View>
        }
      />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.xs,
    flexGrow: 1,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.textPrimary,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
  },
  username: {
    color: colors.textSecondary,
  },
  chevron: {
    color: colors.textSecondary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyCopy: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.xs,
    alignSelf: 'stretch',
  },
});
