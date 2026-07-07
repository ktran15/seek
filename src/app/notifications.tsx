import { useEffect } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import {
  useMyFriendships,
  useProfilesById,
  useRespondToRequest,
} from '@/features/friends/useFriends';
import {
  useMarkNotificationsRead,
  useMyNotifications,
  type AppNotification,
} from '@/features/h2h/useH2H';
import { colors, radii, spacing, textStyles } from '@/theme';

const PLACEMENT_LABELS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };

/** Friendly one-liner for a result notification (H2H / vote, spec §13). */
function describeNotification(n: AppNotification): string {
  const day = typeof n.payload.beta_day === 'number' ? n.payload.beta_day : '?';
  if (n.type === 'h2h_result') {
    const won = n.payload.won === true;
    const vsMascot = n.payload.vs_mascot === true;
    const rival = vsMascot ? config.mascot.name : 'your rival';
    return won
      ? `Day ${day} head-to-head: you beat ${rival}! 🎉`
      : `Day ${day} head-to-head: ${rival} took this one.`;
  }
  if (n.type === 'vote_result') {
    const votes = typeof n.payload.votes === 'number' ? n.payload.votes : 0;
    const placement =
      typeof n.payload.placement === 'number'
        ? PLACEMENT_LABELS[n.payload.placement]
        : null;
    return placement
      ? `Community vote: you placed ${placement} with ${votes} vote${votes === 1 ? '' : 's'}! 🏆`
      : `Community vote: ${votes} vote${votes === 1 ? '' : 's'} — outside the top 3.`;
  }
  if (n.type === 'weekly_result') {
    const coins = typeof n.payload.coins === 'number' ? n.payload.coins : 0;
    if (n.payload.solo === true) {
      return `Week complete: +${coins} coins solo payout. Add friends to compete for the big purses!`;
    }
    const rank = typeof n.payload.rank === 'number' ? n.payload.rank : null;
    const rankLabel =
      rank !== null ? (PLACEMENT_LABELS[rank] ?? `#${rank}`) : 'ranked';
    return n.payload.gold_crate === true
      ? `Weekly leaderboard: ${rankLabel} place! +${coins} coins and a GOLD crate 👑`
      : `Weekly leaderboard: you finished ${rankLabel} — +${coins} coins.`;
  }
  return 'Something happened on the mountain.';
}

/**
 * Notifications (spec §11): incoming friend requests with accept/decline,
 * plus H2H and vote results (M5).
 */
export default function NotificationsScreen() {
  const { session } = useSession();
  const myId = session?.user.id;

  const { data: friendships, isLoading } = useMyFriendships(myId);
  const respond = useRespondToRequest(myId);
  const { data: results } = useMyNotifications(myId);
  const markRead = useMarkNotificationsRead(myId);

  const pending = (friendships ?? []).filter(
    (f) => f.status === 'pending' && f.addressee_id === myId,
  );
  const { data: requesters } = useProfilesById(pending.map((p) => p.requester_id));

  const unreadIds = (results ?? []).filter((n) => !n.read).map((n) => n.id);
  useEffect(() => {
    if (unreadIds.length > 0 && !markRead.isPending) {
      markRead.mutate(unreadIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadIds.join(',')]);

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
            {isLoading ? 'Loading…' : 'No pending requests.'}
          </Text>
        }
        ListFooterComponent={
          <View style={styles.resultsSection}>
            <Text style={[textStyles.headerS, styles.sectionTitle]}>Results</Text>
            {(results ?? []).length === 0 ? (
              <Text style={[textStyles.bodySmall, styles.empty]}>
                Head-to-head and vote results land here.
              </Text>
            ) : (
              (results ?? []).map((n) => (
                <View key={n.id} style={styles.resultRow}>
                  <Text style={[textStyles.bodySmall, styles.resultText]}>
                    {describeNotification(n)}
                  </Text>
                </View>
              ))
            )}
          </View>
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
  resultsSection: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  resultRow: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  resultText: {
    color: colors.textPrimary,
  },
});
