import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSession } from '@/features/auth/useSession';
import {
  useMyFriendships,
  useProfilesById,
  useRespondToRequest,
} from '@/features/friends/useFriends';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Notifications (spec §11): incoming friend requests with accept/decline.
 * Challenge/H2H/vote result notifications join this list in M5+.
 */
export default function NotificationsScreen() {
  const { session } = useSession();
  const myId = session?.user.id;

  const { data: friendships, isLoading } = useMyFriendships(myId);
  const respond = useRespondToRequest(myId);

  const pending = (friendships ?? []).filter(
    (f) => f.status === 'pending' && f.addressee_id === myId,
  );
  const { data: requesters } = useProfilesById(pending.map((p) => p.requester_id));

  const onRespond = (friendshipId: string, response: 'accepted' | 'declined') => {
    respond.mutate(
      { friendshipId, response },
      {
        onError: (e) =>
          Alert.alert('Could not respond', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  };

  return (
    <ErrorBoundary screen="Notifications">
      <FlatList
        style={styles.flex}
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[textStyles.headerS, styles.sectionTitle]}>
            Friend requests
          </Text>
        }
        ListEmptyComponent={
          <Text style={[textStyles.bodySmall, styles.empty]}>
            {isLoading
              ? 'Loading…'
              : 'No pending requests. Challenge results land here from M5.'}
          </Text>
        }
        renderItem={({ item }) => {
          const requester = requesters?.find((r) => r.id === item.requester_id);
          return (
            <View style={styles.row}>
              <View style={styles.nameBlock}>
                <Text style={[textStyles.bodyEmphasis, styles.name]}>
                  {requester?.display_name ?? requester?.username ?? 'Someone'}
                </Text>
                <Text style={[textStyles.caption, styles.username]}>
                  @{requester?.username ?? '…'} wants to be rivals
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Accept ${requester?.username ?? 'request'}`}
                disabled={respond.isPending}
                onPress={() => onRespond(item.id, 'accepted')}
                style={[styles.action, styles.accept]}
              >
                <Text style={[textStyles.caption, styles.acceptLabel]}>ACCEPT</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Decline ${requester?.username ?? 'request'}`}
                disabled={respond.isPending}
                onPress={() => onRespond(item.id, 'declined')}
                style={[styles.action, styles.decline]}
              >
                <Text style={[textStyles.caption, styles.declineLabel]}>DECLINE</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
  action: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
  },
  accept: {
    backgroundColor: colors.primary,
  },
  acceptLabel: {
    color: colors.textOnPrimary,
  },
  decline: {
    backgroundColor: colors.surfaceSecondary,
  },
  declineLabel: {
    color: colors.textPrimary,
  },
});
