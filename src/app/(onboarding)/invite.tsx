import { StyleSheet, Text } from 'react-native';

import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, textStyles } from '@/theme';

/** Placeholder — real invite flow (soft gate) lands in M1 sub-step 7. */
export default function InviteStep() {
  return (
    <OnboardingScreen
      step="invite"
      title="You need a rival"
      ctaLabel="CONTINUE"
      onCta={() => goToNextStep('invite')}
    >
      <Text style={[textStyles.body, styles.copy]}>
        Invite flow lands in the next sub-step.
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  copy: { color: colors.textSecondary },
});
