import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';

import { clampHappiness, happinessState, HAPPINESS_MAX } from './happiness';

/**
 * The beaver's Happiness meter (spec §11, §10.3). A calm celebrate-yellow fill
 * whose length tracks the 0–100 value, labeled with the current state. Purely
 * informational — Happiness never gates anything (§10.3).
 */
export function HappinessMeter({
  happiness,
  showValue = true,
}: {
  happiness: number;
  showValue?: boolean;
}) {
  const value = clampHappiness(happiness);
  const state = happinessState(value);
  const pct = `${(value / HAPPINESS_MAX) * 100}%` as const;

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`Happiness: ${state.label}, ${value} of ${HAPPINESS_MAX}`}
    >
      <View style={styles.labelRow}>
        <Text style={[textStyles.caption, styles.state]}>
          <Ionicons name="heart" size={12} color={colors.primaryPressed} />{' '}
          {state.label}
        </Text>
        {showValue ? (
          <Text style={[textStyles.caption, styles.value]}>
            {value}/{HAPPINESS_MAX}
          </Text>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: pct }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: spacing.xxs },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  state: { color: colors.textPrimary },
  value: { color: colors.textSecondary },
  track: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.celebration,
  },
});
