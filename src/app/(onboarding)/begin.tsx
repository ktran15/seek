import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { obColors, obText, sc } from '@/features/onboarding/theme';
import { useUpdateProfile } from '@/features/profile/useProfile';

/**
 * "The mountain is waiting." (prototype screen 10) — the hook. Completing flips
 * the root guard into the main app.
 */
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
    <OnboardingScaffold
      step="begin"
      hero="onboardingSummit"
      // Focus the crop high on the square so the flag + beaver + sun stay framed
      // and the heavy mountain foreground is what's trimmed (prototype's old
      // `object-position: center 38%`).
      heroFocusY={0.36}
      title="The mountain is waiting."
      titleStyle={obText.title28}
      subtitle="Seven days. Seven challenges. One attempt each. Your first challenge is already up there."
      ctaLabel="Begin"
      onCta={begin}
      ctaDisabled={busy}
    >
      <Text style={[obText.note, styles.note]}>
        House rules: keep proof real, keep it kind.
      </Text>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  note: { color: obColors.note, marginTop: sc(16) },
});
