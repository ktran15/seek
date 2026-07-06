import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';

import type { StyleOption, SwatchOption } from './catalog';

interface PickerRowProps<T> {
  label: string;
  options: T[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

/** Horizontal row of color swatches (skin tone, hair color). */
export function SwatchPicker({
  label,
  options,
  selectedId,
  onSelect,
}: PickerRowProps<SwatchOption>) {
  return (
    <View style={styles.row}>
      <Text style={[textStyles.headerS, styles.label]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.options}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityState={{ selected: option.id === selectedId }}
              onPress={() => onSelect(option.id)}
              style={[
                styles.swatch,
                { backgroundColor: option.color },
                option.id === selectedId && styles.selected,
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** Horizontal row of labeled chips (eyes, hair style). */
export function ChipPicker({
  label,
  options,
  selectedId,
  onSelect,
}: PickerRowProps<StyleOption>) {
  return (
    <View style={styles.row}>
      <Text style={[textStyles.headerS, styles.label]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.options}>
          {options.map((option) => {
            const selected = option.id === selectedId;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(option.id)}
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
      </ScrollView>
    </View>
  );
}

const SWATCH = 44; // ≥44pt targets (spec §2.1)

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textPrimary,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.primary,
  },
  chip: {
    minHeight: SWATCH,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
  },
});
