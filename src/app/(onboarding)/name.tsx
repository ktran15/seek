import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { FormTextInput } from '@/components/ui/FormTextInput';
import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding — NAME YOUR BEAVER (spec §5 step 4, §10.6).
 *
 * The field NEVER defaults to or suggests "Bucky" — that is the rival's name
 * (§7.9); proposing it would read as naming your pet after your opponent. The
 * suggestion chips below are deliberately Bucky-free. (A player who insists on
 * typing it isn't blocked — we simply never propose it.)
 */
const SUGGESTIONS = ['Chomp', 'Maple', 'Pebble', 'Tank', 'Willow'] as const;

export default function NameStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);

  const [name, setName] = useState(profile?.beaver_name ?? '');
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= config.beaver.maxNameLength;

  const save = async () => {
    if (!valid) {
      Alert.alert('Name your beaver', 'Give your beaver a name to continue.');
      return;
    }
    setBusy(true);
    try {
      await updateProfile({ beaver_name: trimmed });
      goToNextStep('name');
    } catch (e) {
      Alert.alert(
        'Could not save the name',
        e instanceof Error ? e.message : 'Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScreen
      step="name"
      title="Name your beaver"
      ctaLabel="THAT'S THE ONE"
      onCta={save}
      ctaDisabled={busy || !valid}
    >
      <View style={styles.stage}>
        <BeaverPreview config={profile?.avatar_config} happiness={80} size={150} showCaption={false} />
        {trimmed.length > 0 && (
          <Text style={[textStyles.headerL, styles.nameEcho]}>{trimmed}</Text>
        )}
      </View>

      <FormTextInput
        label="Beaver name"
        value={name}
        onChangeText={setName}
        placeholder="Give them a name"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={config.beaver.maxNameLength}
      />

      <Text style={[textStyles.caption, styles.hint]}>Need a hand?</Text>
      <View style={styles.chips}>
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            accessibilityRole="button"
            accessibilityLabel={`Use the name ${suggestion}`}
            onPress={() => setName(suggestion)}
            style={styles.chip}
          >
            <Text style={[textStyles.bodySmall, styles.chipText]}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingBottom: spacing.xs,
  },
  nameEcho: {
    color: colors.primary,
    textAlign: 'center',
  },
  hint: {
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  chipText: {
    color: colors.textPrimary,
  },
});
