import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LeaderboardPlaceholder } from '@/features/leaderboard/LeaderboardPlaceholder';
import { MountainView } from '@/features/mountain/MountainView';
import { VoteCountdown } from '@/features/vote/VoteCountdown';
import { colors, radii, spacing, textStyles } from '@/theme';

const PAGES = ['Mountain', 'Leaderboard'] as const;

/** Challenge tab (spec §5): swipe between Mountain (default) and Leaderboard. */
export default function ChallengeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  return (
    <ErrorBoundary screen="Challenge">
      <View style={styles.container}>
        <VoteCountdown />
        <View style={styles.switcher}>
          {PAGES.map((page, index) => {
            const active = index === activeIndex;
            return (
              <Pressable
                key={page}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setActiveIndex(index);
                  pagerRef.current?.setPage(index);
                }}
                style={[styles.switchTab, active && styles.switchTabActive]}
              >
                <Text
                  style={[
                    textStyles.headerS,
                    active ? styles.switchLabelActive : styles.switchLabel,
                  ]}
                >
                  {page}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
        >
          <View key="mountain" style={styles.page}>
            <MountainView />
          </View>
          <View key="leaderboard" style={styles.page}>
            <LeaderboardPlaceholder />
          </View>
        </PagerView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  switcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  switchTab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  switchTabActive: {
    backgroundColor: colors.primary,
  },
  switchLabel: {
    color: colors.textSecondary,
  },
  switchLabelActive: {
    color: colors.textOnPrimary,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
