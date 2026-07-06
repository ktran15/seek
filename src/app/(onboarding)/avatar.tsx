import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { AvatarPreview } from '@/features/avatar/AvatarPreview';
import {
  BASE_EQUIPPED,
  DEFAULT_AVATAR,
  EYES,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
} from '@/features/avatar/catalog';
import { ChipPicker, SwatchPicker } from '@/features/avatar/OptionPickers';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

/** Onboarding step 4 (spec §5): avatar creation. Editable later in Profile (M8). */
export default function AvatarStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);

  const [skinTone, setSkinTone] = useState(
    profile?.avatar_config.skinTone ?? DEFAULT_AVATAR.skinTone,
  );
  const [eyes, setEyes] = useState(
    profile?.avatar_config.eyes ?? DEFAULT_AVATAR.eyes,
  );
  const [hair, setHair] = useState(
    profile?.avatar_config.hair ?? DEFAULT_AVATAR.hair,
  );
  const [hairColor, setHairColor] = useState(
    profile?.avatar_config.hairColor ?? DEFAULT_AVATAR.hairColor,
  );
  const [busy, setBusy] = useState(false);

  const draft = { skinTone, eyes, hair, hairColor };

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({
        avatar_config: { ...draft, equipped: BASE_EQUIPPED },
      });
      goToNextStep('avatar');
    } catch (e) {
      Alert.alert(
        'Could not save avatar',
        e instanceof Error ? e.message : 'Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScreen
      step="avatar"
      title="Build your hiker"
      ctaLabel="LOOKS GOOD"
      onCta={save}
      ctaDisabled={busy}
      onSkip={() => goToNextStep('avatar')}
      skipLabel="Skip — edit later in Profile"
    >
      <View style={styles.previewCard}>
        <AvatarPreview config={draft} />
        <Text style={[textStyles.caption, styles.previewNote]}>
          Base shirt, pants + backpack included. Earn more gear from crates.
        </Text>
      </View>

      <SwatchPicker
        label="Skin tone"
        options={SKIN_TONES}
        selectedId={skinTone}
        onSelect={setSkinTone}
      />
      <ChipPicker label="Eyes" options={EYES} selectedId={eyes} onSelect={setEyes} />
      <ChipPicker
        label="Hair"
        options={HAIR_STYLES}
        selectedId={hair}
        onSelect={setHair}
      />
      <SwatchPicker
        label="Hair color"
        options={HAIR_COLORS}
        selectedId={hairColor}
        onSelect={setHairColor}
      />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  previewNote: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
