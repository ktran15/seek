import { StyleSheet, Text } from 'react-native';

import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, textStyles } from '@/theme';

/** Placeholder — real avatar creation lands in M1 sub-step 6. */
export default function AvatarStep() {
  return (
    <OnboardingScreen
      step="avatar"
      title="Build your hiker"
      ctaLabel="CONTINUE"
      onCta={() => goToNextStep('avatar')}
    >
      <Text style={[textStyles.body, styles.copy]}>
        Avatar creation lands in the next sub-step.
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  copy: { color: colors.textSecondary },
});
