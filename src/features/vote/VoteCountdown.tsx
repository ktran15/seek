import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { config } from '@/config';
import { betaDayInTimezone, dayCloseInstant } from '@/lib/globalClock';
import { colors, radii, spacing, textStyles } from '@/theme';

const CV_DAY = 3;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Persistent day-3 vote countdown (spec §7.7 LOCKED): pinned on the
 * Challenge screen for the whole global EST window; taps through to voting.
 * Renders nothing outside the window.
 */
export function VoteCountdown() {
  const [now, setNow] = useState(() => Date.now());

  const isVoteDay =
    betaDayInTimezone(config.beta.startDate, config.beta.timezone) === CV_DAY;

  useEffect(() => {
    if (!isVoteDay) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isVoteDay]);

  if (!isVoteDay) return null;

  const closesAt = dayCloseInstant(
    config.beta.startDate,
    config.beta.timezone,
    CV_DAY,
  ).getTime();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Community vote — open voting"
      onPress={() => router.push('/vote')}
      style={styles.banner}
    >
      <View style={styles.textBlock}>
        <Text style={[textStyles.headerS, styles.title]}>COMMUNITY VOTE</Text>
        <Text style={[textStyles.caption, styles.subtitle]}>
          Vote on your friends’ food — closes for everyone at once
        </Text>
      </View>
      <Text style={[textStyles.timerS, styles.clock]}>
        {formatRemaining(closesAt - now)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.card,
    backgroundColor: colors.info,
    minHeight: 56,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textOnDark,
    fontSize: 14,
  },
  subtitle: {
    color: colors.textOnDark,
    opacity: 0.85,
  },
  clock: {
    color: colors.textOnDark,
  },
});
