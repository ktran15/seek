import { useState } from 'react';
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
import { useBlockedUsers, useUnblockUser, type BlockedUser } from '@/features/friends/useBlocks';
import { colors, radii, spacing, textStyles } from '@/theme';

/** Settings → Blocked users (spec §12): the block list with unblock. */
export default function BlockedUsersScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: blocked, isLoading, error, refetch, isRefetching } = useBlockedUsers(userId);
  const unblock = useUnblockUser(userId);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const onUnblock = (entry: BlockedUser) => {
    const name = entry.displayName || entry.username || 'this user';
    Alert.alert(
      `Unblock ${name}?`,
      'You’ll see each other in feeds, suggestions, matchups, and votes again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => {
            setUnblockingId(entry.blockId);
            unblock.mutate(entry.blockId, {
              onError: () => Alert.alert('Unblock failed', 'Please try again.'),
              onSettled: () => setUnblockingId(null),
            });
          },
        },
      ],
    );
  };

  return (
    <ErrorBoundary screen="Blocked users">
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.container}
        data={blocked ?? []}
        keyExtractor={(entry) => entry.blockId}
        renderItem={({ item }) => {
          const name = item.displayName || item.username || 'Unknown user';
          return (
            <View style={styles.row}>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Unblock ${name}`}
                onPress={() => onUnblock(item)}
                disabled={unblockingId === item.blockId}
                style={styles.unblockButton}
              >
                {unblockingId === item.blockId ? (
                  <ActivityIndicator size="small" color={colors.info} />
                ) : (
                  <Text style={[textStyles.caption, styles.unblockLabel]}>UNBLOCK</Text>
                )}
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading ? (
              <ActivityIndicator color={colors.textSecondary} />
            ) : error ? (
              <>
                <Text style={[textStyles.headerL, styles.emptyTitle]}>
                  Couldn’t load your block list
                </Text>
                <Text style={[textStyles.body, styles.emptyCopy]}>
                  Check your connection and try again.
                </Text>
                <PressButton
                  label={isRefetching ? 'Retrying…' : 'Retry'}
                  onPress={() => void refetch()}
                  disabled={isRefetching}
                  style={styles.retryButton}
                />
              </>
            ) : (
              <>
                <Text style={[textStyles.headerL, styles.emptyTitle]}>
                  Nobody’s blocked
                </Text>
                <Text style={[textStyles.body, styles.emptyCopy]}>
                  Block from any post’s ⋯ menu.
                </Text>
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
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  unblockButton: {
    minHeight: 44,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.info,
    paddingHorizontal: spacing.sm,
  },
  unblockLabel: {
    color: colors.info,
    fontWeight: '800',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
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
  retryButton: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
});
