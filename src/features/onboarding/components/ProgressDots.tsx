import { StyleSheet, View } from 'react-native';

import { ONBOARDING_STEPS, stepIndex, type OnboardingStep } from '../steps';
import { obColors } from '../theme';

/** The prototype's progress indicator: one 6×6 pill per onboarding step; the
 *  active step stretches to 18px and turns orange. */
export function ProgressDots({ step }: { step: OnboardingStep }) {
  const current = stepIndex(step);
  return (
    <View
      style={styles.row}
      accessibilityLabel={`Step ${current + 1} of ${ONBOARDING_STEPS.length}`}
    >
      {ONBOARDING_STEPS.map((s, i) => (
        <View key={s} style={[styles.dot, i === current && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: obColors.neutral },
  active: { width: 18, backgroundColor: obColors.dotOrange },
});
