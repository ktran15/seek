import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import {
  BODY_COLORS,
  BODY_SEXES,
  bodyColorOf,
  bodySexOf,
  type BodyColor,
  type BodySex,
} from '@/features/beaver/catalog';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding — CUSTOMIZE YOUR BEAVER (spec §5 step 5, §10.1).
 *
 * Sex × color = the 6 distinct bodies. That is ALL a new player picks: they
 * START PLAIN (§10.1b) — no free cosmetics; hats/tails/gloves/eyes are earned
 * from crates. The copy says so plainly rather than teasing gear they can't
 * have yet.
 */
export default function CustomizeStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);

  const [sex, setSex] = useState<BodySex>(bodySexOf(profile?.avatar_config));
  const [color, setColor] = useState<BodyColor>(bodyColorOf(profile?.avatar_config));
  const [busy, setBusy] = useState(false);

  const draft = { bodySex: sex, bodyColor: color };

  const save = async () => {
    setBusy(true);
    try {
      // Start plain: no `equipped` map is written (spec §10.1b).
      await updateProfile({ avatar_config: draft });
      goToNextStep('customize');
    } catch (e) {
      Alert.alert(
        'Could not save your beaver',
        e instanceof Error ? e.message : 'Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScreen
      step="customize"
      title={
        profile?.beaver_name ? `Style ${profile.beaver_name}` : 'Customize your beaver'
      }
      ctaLabel="LOOKS GOOD"
      onCta={save}
      ctaDisabled={busy}
    >
      <View style={styles.stage}>
        <BeaverPreview config={draft} happiness={80} size={170} />
      </View>

      <Text style={[textStyles.headerS, styles.pickerLabel]}>Beaver</Text>
      <View style={styles.row}>
        {BODY_SEXES.map((option) => {
          const selected = option.id === sex;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => setSex(option.id)}
              style={[styles.sexCard, selected && styles.sexCardActive]}
            >
              <Text
                style={[
                  textStyles.bodyEmphasis,
                  selected ? styles.sexLabelActive : styles.sexLabel,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[textStyles.headerS, styles.pickerLabel]}>Colour</Text>
      <View style={styles.row}>
        {BODY_COLORS.map((option) => {
          const selected = option.id === color;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => setColor(option.id)}
              style={[styles.swatchCell, selected && styles.swatchCellActive]}
            >
              <View style={[styles.swatch, { backgroundColor: option.swatch }]}>
                {selected && (
                  <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
                )}
              </View>
              <Text style={[textStyles.caption, styles.swatchLabel]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[textStyles.caption, styles.note]}>
        Hats, tails, gloves and shades come from crates — earn them by climbing.
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  pickerLabel: {
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sexCard: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sexCardActive: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.primary,
  },
  sexLabel: {
    color: colors.textSecondary,
  },
  sexLabelActive: {
    color: colors.textPrimary,
  },
  swatchCell: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchCellActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    color: colors.textPrimary,
  },
  note: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
