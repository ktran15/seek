import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormTextInput } from '@/components/ui/FormTextInput';
import { useSession } from '@/features/auth/useSession';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding "Name your beaver" (spec §5 step 4, §10). Sets
 * `profiles.beaver_name` — distinct from the username/handle.
 *
 * Deliberately offers NO suggested/default name: "Bucky" is the rival NPC's
 * name (§7.9) and any prefilled example risks steering the player toward the
 * opponent's identity. The field starts empty with a neutral prompt.
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
    <OnboardingScreen
      step="name-beaver"
      title="Name your beaver"
      ctaLabel="CONTINUE"
      onCta={submit}
      ctaDisabled={busy || name.trim().length === 0}
    >
      <View style={styles.stage}>
        <BeaverPreview config={profile?.avatar_config} height={160} />
      </View>

      <Text style={[textStyles.body, styles.copy]}>
        What should we call your beaver? You can change it later.
      </Text>
      <FormTextInput
        label="Beaver name"
        value={name}
        onChangeText={setName}
        placeholder="Give your beaver a name"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={20}
        errorText={error}
      />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
  },
  copy: { color: colors.textSecondary },
});
