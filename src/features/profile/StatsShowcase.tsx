import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { getAsset } from '@/assets/registry';
import { currentBetaDay, dayState, type DayState } from '@/lib/betaCalendar';
import { colors, elevation, radii, spacing, textStyles } from '@/theme';
import { durations, easings } from '@/theme/motion';

import type { BadgeStatus } from './badges';
import { pickStandout } from './standout';

/**
 * "Trail Log" stats showcase (founder-approved direction): hero climb card
 * with a 7-bar mini mountain, an auto-picked "Peak so far" standout strip,
 * a 2×2 scoreboard grid, and the badge shelf — one achievements moment
 * instead of a settings list. Earthy at rest, energetic at the numbers
 * (aesthetic §1). Shared verbatim by the self view and the read-only
 * other-user view; every animation collapses to its final state under
 * Reduce Motion.
 */

/** Ascending bar profile — the climb, summit last. Fractions of BAR_MAX. */
const BAR_PROFILE = [0.34, 0.44, 0.54, 0.66, 0.78, 0.9, 1] as const;
const BAR_MAX = 72;
const BAR_STAGGER_MS = 70;

/** Count-up for stat numbers; renders the target instantly when not animating. */
function useCountUp(target: number, animate: boolean): number {
  const [value, setValue] = useState(animate ? 0 : target);
  useEffect(() => {
    if (!animate) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durations.celebrate);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);
  return value;
}

const BAR_COLORS: Record<DayState, string> = {
  completed: colors.primary,
  current: colors.celebration,
  locked: colors.surfaceSecondary,
  missed: colors.surfaceSecondary,
};

function TrailBar({
  height,
  state,
  delay,
  animate,
}: {
  height: number;
  state: DayState;
  delay: number;
  animate: boolean;
}) {
  const grow = useSharedValue(animate ? 0 : 1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (animate) {
      grow.value = withDelay(
        delay,
        withTiming(1, {
          duration: 450,
          easing: Easing.bezier(...easings.standard),
        }),
      );
      if (state === 'current') {
        // Soft beacon on today's stop — the one live thing on the card.
        pulse.value = withRepeat(withTiming(0.55, { duration: 900 }), -1, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, delay, state]);

  const style = useAnimatedStyle(() => ({
    height: height * grow.value,
    opacity: pulse.value * (state === 'missed' ? 0.45 : 1),
  }));

  return (
    <View style={[styles.barTrack, { height }]}>
      <Animated.View
        style={[styles.bar, { backgroundColor: BAR_COLORS[state] }, style]}
      />
    </View>
  );
}

function StatCard({
  icon,
  chipColor,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  chipColor: string;
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.statCard, elevation.card]}>
      <View style={[styles.statChip, { backgroundColor: chipColor }]}>
        <Ionicons name={icon} size={18} color={colors.textOnPrimary} />
      </View>
      <Text style={[textStyles.headerL, styles.statNumber]}>{value}</Text>
      <Text style={[textStyles.caption, styles.statLabel]}>{label}</Text>
    </View>
  );
}

export interface StatsShowcaseProps {
  /** Beta days with a submitted attempt (drives hero number + bars). */
  submittedDays: ReadonlySet<number>;
  lengthDays: number;
  record: { wins: number; losses: number } | undefined;
  votesWon: number;
  coinsEarned: number | undefined;
  badges: BadgeStatus[];
}

export function StatsShowcase({
  submittedDays,
  lengthDays,
  record,
  votesWon,
  coinsEarned,
  badges,
}: StatsShowcaseProps) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;
  const today = currentBetaDay();

  const stopsClimbed = submittedDays.size;
  const heroValue = useCountUp(stopsClimbed, animate);
  const votesValue = useCountUp(votesWon, animate);
  const completedValue = useCountUp(stopsClimbed, animate);
  const coinsValue = useCountUp(coinsEarned ?? 0, animate);

  const standout = pickStandout({
    wins: record?.wins ?? 0,
    losses: record?.losses ?? 0,
    votesWon,
    coinsEarned: coinsEarned ?? 0,
    stopsClimbed,
  });
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <View style={styles.container}>
      {/* Hero — THE CLIMB */}
      <View style={[styles.heroCard, elevation.card]}>
        <View style={styles.heroLeft}>
          <Text style={[textStyles.caption, styles.kicker]}>THE CLIMB</Text>
          <Text style={[textStyles.heroXL, styles.heroNumber]}>{heroValue}</Text>
          <Text style={[textStyles.bodySmall, styles.heroCaption]}>
            of {lengthDays} stops climbed
          </Text>
        </View>
        <View
          style={styles.barsRow}
          accessibilityLabel={`${stopsClimbed} of ${lengthDays} stops climbed`}
        >
          {BAR_PROFILE.slice(0, lengthDays).map((fraction, i) => {
            const day = i + 1;
            return (
              <TrailBar
                key={day}
                height={Math.round(fraction * BAR_MAX)}
                state={dayState(day, today, submittedDays)}
                delay={i * BAR_STAGGER_MS}
                animate={animate}
              />
            );
          })}
        </View>
      </View>

      {/* Peak so far — the energetic beat; honest fresh-start line otherwise */}
      {standout ? (
        <View style={[styles.standoutCard, elevation.card]}>
          <Ionicons name="sparkles" size={22} color={colors.textPrimary} />
          <View style={styles.standoutText}>
            <Text style={[textStyles.headerS, styles.standoutTitle]}>
              {standout.title}
            </Text>
            <Text style={[textStyles.bodySmall, styles.standoutDetail]}>
              {standout.detail}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.standoutCard, styles.standoutFresh]}>
          <Ionicons name="trail-sign-outline" size={22} color={colors.textSecondary} />
          <View style={styles.standoutText}>
            <Text style={[textStyles.headerS, styles.standoutFreshTitle]}>
              First stop awaits
            </Text>
            <Text style={[textStyles.bodySmall, styles.standoutFreshDetail]}>
              Today’s challenge is the way up.
            </Text>
          </View>
        </View>
      )}

      {/* Scoreboard grid */}
      <View style={styles.gridRow}>
        <StatCard
          icon="flash"
          chipColor={colors.primaryPressed}
          value={record ? `${record.wins}–${record.losses}` : '—'}
          label="H2H record (W–L)"
        />
        <StatCard
          icon="trophy"
          chipColor={colors.info}
          value={String(votesValue)}
          label="Votes won"
        />
      </View>
      <View style={styles.gridRow}>
        <StatCard
          icon="flag"
          chipColor={colors.surfaceNature}
          value={String(completedValue)}
          label="Challenges completed"
        />
        <StatCard
          icon="cash"
          chipColor={colors.celebration}
          value={coinsEarned === undefined ? '—' : String(coinsValue)}
          label="Coins earned"
        />
      </View>

      {/* Badge shelf */}
      <View style={[styles.shelfCard, elevation.card]}>
        <View style={styles.shelfHeader}>
          <Text style={[textStyles.headerS, styles.shelfTitle]}>Badges</Text>
          <Text style={[textStyles.caption, styles.shelfCount]}>
            {earnedCount} of {badges.length} earned
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {badges.map((badge) => (
            <View key={badge.id} style={styles.badgeCell}>
              <Image
                source={getAsset(badge.slot)}
                style={[styles.badgeArt, !badge.earned && styles.badgeLocked]}
                resizeMode="contain"
                accessibilityLabel={`${badge.name}${badge.earned ? '' : ' (locked)'}`}
              />
              <Text
                style={[textStyles.caption, styles.badgeLabel]}
                numberOfLines={2}
              >
                {badge.name}
              </Text>
              {!badge.earned && (
                <Text style={[textStyles.caption, styles.badgeHint]}>
                  {badge.hint}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  heroLeft: {
    gap: spacing.xxs,
  },
  kicker: {
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  heroNumber: {
    color: colors.primary,
  },
  heroCaption: {
    color: colors.textSecondary,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  barTrack: {
    width: 13,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: radii.sm / 2,
  },
  standoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.celebration,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  standoutFresh: {
    backgroundColor: colors.surface,
  },
  standoutText: {
    flex: 1,
    gap: 1,
  },
  standoutTitle: {
    color: colors.textPrimary,
  },
  standoutDetail: {
    color: colors.textPrimary,
  },
  standoutFreshTitle: {
    color: colors.textPrimary,
  },
  standoutFreshDetail: {
    color: colors.textSecondary,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  statChip: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    color: colors.textPrimary,
  },
  statLabel: {
    color: colors.textSecondary,
  },
  shelfCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  shelfTitle: {
    color: colors.textPrimary,
  },
  shelfCount: {
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badgeCell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  badgeArt: {
    width: 56,
    height: 56,
  },
  badgeLocked: {
    opacity: 0.22,
  },
  badgeLabel: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badgeHint: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
