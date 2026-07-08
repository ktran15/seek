import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useUpdateProfile } from '@/features/profile/useProfile';
import { colors, spacing, textStyles } from '@/theme';

/** Onboarding step 6 (spec §5): the hook. Completing flips the root guard home. */
export default function BeginStep() {
  const { session } = useSession();
  const updateProfile = useUpdateProfile(session?.user.id);
  const [busy, setBusy] = useState(false);

  const begin = async () => {
    setBusy(true);
    try {
      await updateProfile({ onboarding_completed_at: new Date().toISOString() });
      // Root guard now routes to the main app.
    } catch (e) {
      Alert.alert(
        'Almost there',
        e instanceof Error ? e.message : 'Could not finish setup. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScreen
      step="begin"
      title="The mountain is waiting"
      ctaLabel="BEGIN"
      onCta={begin}
      ctaDisabled={busy}
    >
      <Text style={[textStyles.body, styles.copy]}>
        Seven days. Seven challenges. One attempt each. Your first challenge is
        already up there.
      </Text>
      <Text style={[textStyles.caption, styles.guidelines]}>
        House rules: keep proof real, keep it kind.
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.textSecondary,
  },
  guidelines: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
