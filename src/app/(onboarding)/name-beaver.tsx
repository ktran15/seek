import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import {
  BEAVER_BODY_COLORS,
  BEAVER_SEXES,
  beaverBodyColor,
  beaverSex,
} from '@/features/beaver/catalog';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingField } from '@/features/onboarding/components/OnboardingField';
import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { obColors, obRadii, obText } from '@/features/onboarding/theme';
import type { BeaverBodyColor, BeaverSex } from '@/lib/database.types';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';

/**
 * "Name your beaver" (prototype screen 7) — now also the base-body customiser
 * (founder-directed, 2026-07-22): the beaver window carries a Male/Female
 * selector + colour swatches (the beaver updates live), with the name field
 * below. Writes `profiles.beaver_name` + `avatar_config` (sex + bodyColor).
 * Starts plain — cosmetics are earned from crates (§18); editable later in
 * Settings → Edit beaver.
 */
export default function NameBeaverStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);

  const [sex, setSex] = useState<BeaverSex>(beaverSex(profile?.avatar_config));
  const [bodyColor, setBodyColor] = useState<BeaverBodyColor>(
    beaverBodyColor(profile?.avatar_config),
  );
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
      await updateProfile({
        beaver_name: trimmed,
        avatar_config: {
          sex,
          bodyColor,
          equipped: profile?.avatar_config.equipped ?? {},
        },
      });
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
      <View style={styles.window}>
        <BeaverPreview config={{ sex, bodyColor }} height={172} />

        <GenderSlider value={sex} onChange={setSex} />
        <ColorSwatches value={bodyColor} onChange={setBodyColor} />
      </View>

      <Text style={[obText.body, styles.copy]}>
        Make it yours, then give it a name — you can change both later.
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

/** Two-position sliding selector (the "slider") for Male / Female. */
function GenderSlider({
  value,
  onChange,
}: {
  value: BeaverSex;
  onChange: (s: BeaverSex) => void;
}) {
  return (
    <View style={styles.track}>
      {BEAVER_SEXES.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={[styles.segment, selected && styles.segmentOn]}
          >
            <Text style={[obText.rowLabel, selected ? styles.segTextOn : styles.segText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Body-colour swatches (brown / white / black). */
function ColorSwatches({
  value,
  onChange,
}: {
  value: BeaverBodyColor;
  onChange: (c: BeaverBodyColor) => void;
}) {
  return (
    <View style={styles.swatchRow}>
      {BEAVER_BODY_COLORS.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityLabel={`Colour: ${option.label}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={styles.swatchWrap}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: option.swatch },
                selected && styles.swatchOn,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    marginTop: 8,
    backgroundColor: obColors.surface,
    borderWidth: 1,
    borderColor: obColors.border,
    borderRadius: obRadii.cardLg,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 14,
  },
  // Gender slider
  track: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: obColors.input,
    borderWidth: 1,
    borderColor: obColors.border,
    borderRadius: obRadii.pill,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: obRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: { backgroundColor: obColors.primary },
  segText: { color: obColors.textMuted },
  segTextOn: { color: obColors.onPrimary },
  // Colour swatches
  swatchRow: { flexDirection: 'row', gap: 16 },
  swatchWrap: { padding: 3 },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchOn: { borderColor: obColors.primary },
  copy: { color: obColors.textMuted, marginTop: 16 },
  field: { marginTop: 14 },
});
