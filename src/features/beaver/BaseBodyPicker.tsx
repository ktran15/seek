import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BeaverBodyColor, BeaverSex } from '@/lib/database.types';
import { colors, radii, spacing, textStyles } from '@/theme';

import { BEAVER_BODY_COLORS, BEAVER_SEXES } from './catalog';

/**
 * The beaver base-body picker (spec §10.1): sex (male/female) + body color
 * (brown/white/black). Shared by onboarding "Customize your beaver" and
 * Settings → Edit beaver so the two can't drift.
 */
export function BaseBodyPicker({
  sex,
  bodyColor,
  onSex,
  onColor,
}: {
  sex: BeaverSex;
  bodyColor: BeaverBodyColor;
  onSex: (s: BeaverSex) => void;
  onColor: (c: BeaverBodyColor) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={[textStyles.headerS, styles.label]}>Body</Text>
      <View style={styles.chipRow}>
        {BEAVER_SEXES.map((option) => {
          const selected = option.id === sex;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSex(option.id)}
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
              onPress={() => onColor(option.id)}
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
    </View>
  );
}

const SWATCH = 48; // ≥44pt target (spec §2.1)

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: spacing.xs },
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
});
