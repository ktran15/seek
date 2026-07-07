import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PressButton } from '@/components/ui/PressButton';
import { useSession } from '@/features/auth/useSession';
import { AvatarPreview } from '@/features/avatar/AvatarPreview';
import {
  DEFAULT_AVATAR,
  EYES,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
} from '@/features/avatar/catalog';
import { ChipPicker, SwatchPicker } from '@/features/avatar/OptionPickers';
import { useCosmeticsCatalog } from '@/features/economy/useEconomy';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Settings → Edit avatar base (spec §10): the same four base choices as
 * onboarding, with the FULL current look previewed (equipped cosmetics stay
 * on — only the base fields change on save).
 */
export default function EditAvatarScreen() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);
  const { data: catalog } = useCosmeticsCatalog();

  const current = profile?.avatar_config ?? {};
  const [skinTone, setSkinTone] = useState(current.skinTone ?? DEFAULT_AVATAR.skinTone);
  const [eyes, setEyes] = useState(current.eyes ?? DEFAULT_AVATAR.eyes);
  const [hair, setHair] = useState(current.hair ?? DEFAULT_AVATAR.hair);
  const [hairColor, setHairColor] = useState(
    current.hairColor ?? DEFAULT_AVATAR.hairColor,
  );
  const [busy, setBusy] = useState(false);

  const draft = { ...current, skinTone, eyes, hair, hairColor };

  const save = async () => {
    setBusy(true);
    try {
      // Base fields only — the equipped cosmetics map rides along untouched.
      await updateProfile({ avatar_config: draft });
      router.back();
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
    <ErrorBoundary screen="Edit Avatar">
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <View style={styles.previewCard}>
          <AvatarPreview config={draft} cosmetics={catalog ?? []} />
          <Text style={[textStyles.caption, styles.previewNote]}>
            Your equipped gear stays on — change it in Profile → Inventory.
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

        <View style={styles.footer}>
          <PressButton label="SAVE" onPress={() => void save()} disabled={busy} />
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
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
  footer: {
    marginTop: spacing.sm,
  },
});
