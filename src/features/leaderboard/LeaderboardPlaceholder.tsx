import { FlatList, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';

const SKELETON_ROWS = [1, 2, 3, 4, 5];
const MOCK_YOU_RANK = 2;

/** Egocentric weekly leaderboard skeleton — real board + payouts land in M9. */
export function LeaderboardPlaceholder() {
  return (
    <FlatList
      data={SKELETON_ROWS}
      keyExtractor={(rank) => `row-${rank}`}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[textStyles.headerL, styles.title]}>This week</Text>
          <Text style={[textStyles.caption, styles.note]}>
            You + your friends, ranked by points. Real board lands in M9.
          </Text>
        </View>
      }
      ListFooterComponent={
        <Text style={[textStyles.caption, styles.payout]}>
          Weekly payout: coin tiers + a gold crate for 1st (3+ friends to
          qualify).
        </Text>
      }
      renderItem={({ item: rank }) => {
        const you = rank === MOCK_YOU_RANK;
        return (
          <View style={[styles.row, you && styles.rowYou]}>
            <Text style={[textStyles.headerL, you ? styles.rankYou : styles.rank]}>
              {rank}
            </Text>
            <View style={styles.avatar} />
            {you ? (
              <Text style={[textStyles.headerS, styles.youLabel]}>You</Text>
            ) : (
              <View style={styles.nameBar} />
            )}
            <View style={styles.pointsBar} />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xxl,
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
    width: 28,
  },
  rankYou: {
    color: colors.info,
    width: 28,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
  },
  youLabel: {
    flex: 1,
    color: colors.textPrimary,
  },
  nameBar: {
    flex: 1,
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  pointsBar: {
    width: 48,
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.celebration,
  },
  payout: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
