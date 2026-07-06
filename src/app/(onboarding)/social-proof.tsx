import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, radii, spacing, textStyles } from '@/theme';

/** Onboarding step 2 (spec §5): why we're great / social proof. */
export default function SocialProofStep() {
  return (
    <OnboardingScreen
      step="social-proof"
      title="Built for doers"
      ctaLabel="CONTINUE"
      onCta={() => goToNextStep('social-proof')}
    >
      <Text style={[textStyles.body, styles.copy]}>
        No endless scrolling. No highlight reels. Just you, your friends, and
        one real thing to do every day.
      </Text>
      <View style={styles.card}>
        <Text style={[textStyles.headerL, styles.quote]}>
          “The only app that gets me off my phone.”
        </Text>
        <Text style={[textStyles.caption, styles.attribution]}>
          — an early Seeker
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={[textStyles.headerL, styles.quote]}>
          “My friends and I finally have a reason to compete again.”
        </Text>
        <Text style={[textStyles.caption, styles.attribution]}>
          — beta tester #7
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  quote: {
    color: colors.textPrimary,
  },
  attribution: {
    color: colors.textSecondary,
  },
});
