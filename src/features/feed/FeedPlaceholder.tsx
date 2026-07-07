import { FlatList, StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radii, spacing, textStyles } from '@/theme';

interface FeedPlaceholderProps {
  feedName: string;
}

const SKELETON_POSTS = [0, 1, 2];

/** Skeleton post cards — real posts from submissions land in M6. */
export function FeedPlaceholder({ feedName }: FeedPlaceholderProps) {
  return (
    <FlatList
      data={SKELETON_POSTS}
      keyExtractor={(item) => `${feedName}-${item}`}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={[textStyles.caption, styles.note]}>
          {feedName} feed — real posts land in M6.
        </Text>
      }
      renderItem={() => (
        <View style={[styles.card, elevation.card]}>
          <View style={styles.postHeader}>
            <View style={styles.avatar} />
            <View style={styles.nameBlock}>
              <View style={styles.nameBar} />
              <View style={styles.subBar} />
            </View>
          </View>
          <View style={styles.media} />
          <View style={styles.actionsRow}>
            <View style={styles.actionPill} />
            <View style={styles.actionPill} />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  note: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  nameBlock: {
    gap: spacing.xxs,
  },
  nameBar: {
    width: 120,
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  subBar: {
    width: 80,
    height: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  media: {
    height: 220,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceNature,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionPill: {
    width: 64,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSecondary,
  },
});
