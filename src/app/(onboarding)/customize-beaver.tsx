import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import {
  BEAVER_BODY_COLORS,
  BEAVER_SEXES,
  beaverBodyColor,
  beaverSex,
} from '@/features/beaver/catalog';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import type { BeaverBodyColor, BeaverSex } from '@/lib/database.types';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding "Customize your beaver" (spec §5 step 5, §10.1). The ONLY base
 * choice: sex (male/female) × body color (brown/white/black) = 6 distinct
 * bodies. Start plain — no starter cosmetic is granted (§18); all gear is
 * earned from crates. Editable later in Settings → Edit beaver (M8).
 */
export default function CustomizeBeaverStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);

  const [sex, setSex] = useState<BeaverSex>(beaverSex(profile?.avatar_config));
  const [bodyColor, setBodyColor] = useState<BeaverBodyColor>(
    beaverBodyColor(profile?.avatar_config),
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      // Preserve any equipped cosmetics (none at onboarding) while setting the
      // base body; drop the legacy hiker fields.
      await updateProfile({
        avatar_config: {
          sex,
          bodyColor,
          equipped: profile?.avatar_config.equipped ?? {},
        },
      });
      goToNextStep('customize-beaver');
    } catch (e) {
      Alert.alert(
        'Could not save',
        e instanceof Error ? e.message : 'Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScreen
      step="customize-beaver"
      title="Make it yours"
      ctaLabel="LOOKS GOOD"
      onCta={save}
      ctaDisabled={busy}
    >
      <View style={styles.stage}>
        <BeaverPreview config={{ sex, bodyColor }} height={200} />
      </View>

      <Text style={[textStyles.headerS, styles.label]}>Body</Text>
      <View style={styles.chipRow}>
        {BEAVER_SEXES.map((option) => {
          const selected = option.id === sex;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSex(option.id)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text
                style={[
                  textStyles.bodyEmphasis,
                  selected ? styles.chipTextSelected : styles.chipText,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[textStyles.headerS, styles.label]}>Color</Text>
      <View style={styles.swatchRow}>
        {BEAVER_BODY_COLORS.map((option) => {
          const selected = option.id === bodyColor;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={`Color: ${option.label}`}
              accessibilityState={{ selected }}
              onPress={() => setBodyColor(option.id)}
              style={styles.swatchWrap}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: option.swatch },
                  selected && styles.swatchSelected,
                ]}
              />
              <Text style={[textStyles.caption, styles.swatchLabel]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[textStyles.caption, styles.note]}>
        Your beaver starts plain — earn hats, tails, gloves and more from crates.
      </Text>
    </OnboardingScreen>
  );
}

const SWATCH = 48; // ≥44pt target (spec §2.1)

const styles = StyleSheet.create({
  stage: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.lg,
  },
  label: { color: colors.textPrimary },
  chipRow: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.textPrimary },
  chipTextSelected: { color: colors.textOnPrimary },
  swatchRow: { flexDirection: 'row', gap: spacing.md },
  swatchWrap: { alignItems: 'center', gap: spacing.xxs },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: colors.primary },
  swatchLabel: { color: colors.textSecondary },
  note: { color: colors.textSecondary, textAlign: 'center' },
});
