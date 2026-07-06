import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, radii, spacing, textStyles } from '@/theme';

/** Onboarding step 3 (spec §5): what Seek is — the do-together premise. */
export default function AboutStep() {
  return (
    <OnboardingScreen
      step="about"
      title="How Seek works"
      ctaLabel="CONTINUE"
      onCta={() => goToNextStep('about')}
    >
      <View style={styles.card}>
        <Text style={[textStyles.headerS, styles.step]}>1 · One challenge a day</Text>
        <Text style={[textStyles.body, styles.copy]}>
          Everyone gets the same one. It stays secret until you enter.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={[textStyles.headerS, styles.step]}>2 · One attempt</Text>
        <Text style={[textStyles.body, styles.copy]}>
          Do it for real, capture the proof, post it to your friends.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={[textStyles.headerS, styles.step]}>3 · Climb the mountain</Text>
        <Text style={[textStyles.body, styles.copy]}>
          Every completion moves you one stop up. Beat friends head-to-head for
          bonus loot.
        </Text>
      </View>
      <Text style={[textStyles.caption, styles.guideline]}>
        Community rule: keep proof real, keep it kind.
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  step: {
    color: colors.accent,
  },
  copy: {
    color: colors.textPrimary,
  },
  guideline: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
