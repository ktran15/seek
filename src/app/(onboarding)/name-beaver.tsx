import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { getAsset } from '@/assets/registry';
import { useSession } from '@/features/auth/useSession';
import { OnboardingField } from '@/features/onboarding/components/OnboardingField';
import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { obColors, obText } from '@/features/onboarding/theme';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';

/**
 * "Name your beaver" (prototype screen 7) — sets `profiles.beaver_name`
 * (distinct from the username/handle). Starts empty with a neutral prompt.
 */
export default function NameBeaverStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);

  const [name, setName] = useState(profile?.beaver_name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    setError(null);
    if (trimmed.length < 1 || trimmed.length > 20) {
      setError('Pick a name of 1–20 characters.');
      return;
    }

    setBusy(true);
    try {
      await updateProfile({ beaver_name: trimmed });
      goToNextStep('name-beaver');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScaffold
      step="name-beaver"
      title="Name your beaver"
      titleStyle={obText.title29}
      ctaLabel="Continue"
      onCta={submit}
      ctaDisabled={busy || name.trim().length === 0}
    >
      <View style={styles.stage}>
        <Image
          source={getAsset('onboardingBeaver')}
          style={styles.beaver}
          resizeMode="contain"
          accessibilityLabel="Your beaver"
        />
      </View>

      <Text style={[obText.body, styles.copy]}>
        What should we call your beaver? You can change it later.
      </Text>

      <View style={styles.field}>
        <OnboardingField
          label="Beaver name"
          value={name}
          onChangeText={setName}
          placeholder="Give your beaver a name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={20}
          errorText={error}
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stage: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaver: { height: 240, width: '100%' },
  copy: { color: obColors.textMuted, marginTop: 4 },
  field: { marginTop: 14 },
});
