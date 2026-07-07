import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';

export const FEEDS = ['Friends', 'Friends of friends', 'Explore'] as const;

interface FeedTabsProps {
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Segmented header for the three Home feeds (spec §5). */
export function FeedTabs({ activeIndex, onSelect }: FeedTabsProps) {
  return (
    <View style={styles.container}>
      {FEEDS.map((feed, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={feed}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(index)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text
              style={[
                textStyles.headerS,
                active ? styles.labelActive : styles.label,
              ]}
              numberOfLines={1}
            >
              {feed}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  labelActive: {
    color: colors.textOnPrimary,
    fontSize: 13,
  },
});
