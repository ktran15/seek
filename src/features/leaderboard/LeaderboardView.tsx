import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { useFriendCount } from '@/features/friends/useFriends';
import { colors, radii, spacing, textStyles } from '@/theme';

import { useLeaderboard, type LeaderboardRow } from './useLeaderboard';

const { weeklyPayout, soloWeeklyPayout } = config.economy.coins;
const MIN_FRIENDS = config.economy.weeklyPayoutMinFriends;

function Row({ row }: { row: LeaderboardRow }) {
  const name = row.isMe ? 'You' : row.display_name || row.username;
  return (
    <View style={[styles.row, row.isMe && styles.rowYou]}>
      <Text style={[textStyles.headerL, row.isMe ? styles.rankYou : styles.rank]}>
        {row.rank ?? '–'}
      </Text>
      <View style={styles.avatar}>
        <Text style={[textStyles.headerS, styles.avatarLetter]}>
          {(name || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text
        style={[textStyles.headerS, row.isMe ? styles.nameYou : styles.name]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text style={[textStyles.headerS, styles.points]}>{row.points} pts</Text>
    </View>
  );
}

/**
 * Egocentric weekly leaderboard (spec §5, §9.2): you + your friends by
 * weekly points, with the payout ladder and your qualification state.
 */
export function LeaderboardView() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: rows, isLoading, error, refetch, isRefetching } = useLeaderboard(userId);
  const friendCount = useFriendCount(userId);
  const qualified = friendCount >= MIN_FRIENDS;

  return (
    <FlatList
      data={rows ?? []}
      keyExtractor={(row) => row.user_id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={colors.textSecondary}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[textStyles.headerL, styles.title]}>This week</Text>
          <Text style={[textStyles.caption, styles.note]}>
            This week’s top hikers
          </Text>
        </View>
      }
      renderItem={({ item }) => <Row row={item} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={[textStyles.headerL, styles.title]}>
            {isLoading ? 'Loading…' : error ? 'Could not load the board' : 'No board yet'}
          </Text>
          {!isLoading && !error && (
            <Text style={[textStyles.body, styles.note]}>
              Complete a challenge to put points on the board.
            </Text>
          )}
        </View>
      }
      ListFooterComponent={
        <View style={styles.payoutCard}>
          <Text style={[textStyles.headerS, styles.payoutTitle]}>
            Weekly payout
          </Text>
          <Text style={[textStyles.bodySmall, styles.payoutLine]}>
            1st: {weeklyPayout.first} coins + GOLD crate · Top 3:{' '}
            {weeklyPayout.top3} · Top 10: {weeklyPayout.top10}
          </Text>
          {qualified ? (
            <Text style={[textStyles.caption, styles.qualifiedNote]}>
              You’re qualified ({friendCount} friends) — payouts land when the
              week closes.
            </Text>
          ) : (
            <Text style={[textStyles.caption, styles.note]}>
              Add {MIN_FRIENDS - friendCount} more friend
              {MIN_FRIENDS - friendCount === 1 ? '' : 's'} to qualify for tier
              payouts. Solo payout: {soloWeeklyPayout} coins if you complete a
              challenge this week.
            </Text>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  header: {
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
  },
  note: {
    color: colors.textSecondary,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
  },
  rowYou: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.info,
  },
  rank: {
    color: colors.textSecondary,
    width: 32,
  },
  rankYou: {
    color: colors.info,
    width: 32,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.textPrimary,
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
  },
  nameYou: {
    flex: 1,
    color: colors.textPrimary,
  },
  points: {
    color: colors.celebration,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  payoutCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  payoutTitle: {
    color: colors.textPrimary,
  },
  payoutLine: {
    color: colors.textPrimary,
  },
  qualifiedNote: {
    color: colors.textSecondary,
  },
});
