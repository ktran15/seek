import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FormTextInput } from '@/components/ui/FormTextInput';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { BaseBodyPicker } from '@/features/beaver/BaseBodyPicker';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { beaverBodyColor, beaverSex } from '@/features/beaver/catalog';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import type { BeaverBodyColor, BeaverSex } from '@/lib/database.types';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Settings → Edit beaver (spec §5, §10.1): change the base body (sex + color)
 * and rename the beaver, with the FULL current look previewed (equipped gear
 * stays on — only the base + name change on save). Happiness/streak are
 * server-authoritative and unaffected here.
 */
export default function EditBeaverScreen() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);

  const current = profile?.avatar_config ?? {};
  const [sex, setSex] = useState<BeaverSex>(beaverSex(current));
  const [bodyColor, setBodyColor] = useState<BeaverBodyColor>(
    beaverBodyColor(current),
  );
  const [beaverName, setBeaverName] = useState(profile?.beaver_name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = { ...current, sex, bodyColor };

  const save = async () => {
    const trimmed = beaverName.trim();
    setError(null);
    if (trimmed.length < 1 || trimmed.length > 20) {
      setError('Pick a name of 1–20 characters.');
      return;
    }
    setBusy(true);
    try {
      // Base + name only — the equipped cosmetics map rides along untouched.
      await updateProfile({ avatar_config: draft, beaver_name: trimmed });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ErrorBoundary screen="Edit Beaver">
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <View style={styles.previewCard}>
          <BeaverPreview
            config={draft}
            happiness={profile?.happiness ?? config.careLoop.startingHappiness}
          />
          <Text style={[textStyles.caption, styles.previewNote]}>
            Your equipped gear stays on — change it in Profile → Inventory.
          </Text>
        </View>

        <FormTextInput
          label="Beaver name"
          value={beaverName}
          onChangeText={setBeaverName}
          placeholder="Give your beaver a name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={20}
          errorText={error}
        />

        <BaseBodyPicker
          sex={sex}
          bodyColor={bodyColor}
          onSex={setSex}
          onColor={setBodyColor}
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
