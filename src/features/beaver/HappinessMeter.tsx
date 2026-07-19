import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';

import {
  clampHappiness,
  happinessState,
  HAPPINESS_MAX,
  HAPPINESS_STATES,
} from './happiness';

/** Depth of the 3D bottom lip the track sits on (PressButton language). */
const LIP_DEPTH = 4;
const TRACK_HEIGHT = 24;

/** Fill bands left→right = worst→best (HAPPINESS_STATES is ordered high→low). */
const BANDS = [...HAPPINESS_STATES].reverse();
/** Each state owns an equal span of the 0–100 track (§10.3 bands). */
const BAND_SPAN = HAPPINESS_MAX / BANDS.length;

/**
 * The beaver's Happiness meter (spec §11, §10.3) as a designed game element:
 * a chunky 3D track (darker bottom lip, 16px corner language) whose fill is
 * five flat cel planes — one hue per care state, ember chestnut → radiant
 * gold — so the bar itself warms as Happiness climbs and the fill's leading
 * edge is always the CURRENT state's color. Earthy trough at rest, accent
 * energy in the fill (aesthetic §1). Purely informational — Happiness never
 * gates anything (§10.3).
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
  const stateColor = colors.happiness[state.id];

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`Happiness: ${state.label}, ${value} of ${HAPPINESS_MAX}`}
    >
      <View style={styles.labelRow}>
        <Ionicons name="heart" size={15} color={stateColor} />
        <Text style={[textStyles.headerS, styles.state]}>{state.label}</Text>
        {showValue ? (
          <Text style={[textStyles.caption, styles.value]}>
            {value}/{HAPPINESS_MAX}
          </Text>
        ) : null}
      </View>
      <View style={styles.barOuter}>
        <View style={styles.lip} />
        <View style={styles.trough}>
          {BANDS.map((band, i) => {
            // Points of this band the fill has earned (0–100 ⇒ % directly).
            const width = Math.max(
              0,
              Math.min(BAND_SPAN, value - i * BAND_SPAN),
            );
            if (width <= 0) return null;
            return (
              <View
                key={band.id}
                style={[
                  styles.band,
                  { width: `${width}%`, backgroundColor: colors.happiness[band.id] },
                ]}
              >
                <View style={styles.bandSheen} />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.xxs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  state: { color: colors.textPrimary },
  value: { color: colors.textSecondary },
  barOuter: {
    paddingBottom: LIP_DEPTH,
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: LIP_DEPTH,
    bottom: 0,
    borderRadius: radii.card,
    backgroundColor: colors.meterTroughLip,
  },
  trough: {
    height: TRACK_HEIGHT,
    flexDirection: 'row',
    borderRadius: radii.card,
    backgroundColor: colors.meterTrough,
    overflow: 'hidden',
  },
  band: { height: '100%' },
  // One flat highlight plane across the fill — cel shading, not a gradient.
  bandSheen: {
    position: 'absolute',
    top: 3,
    left: 0,
    right: 0,
    height: 7,
    backgroundColor: colors.sheen,
  },
});
