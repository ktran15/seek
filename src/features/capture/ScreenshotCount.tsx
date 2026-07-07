import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { PressButton } from '@/components/ui/PressButton';
import { colors, radii, spacing, textStyles } from '@/theme';

export interface ScreenshotResult {
  uri: string;
  /** 1–6 = solved in N guesses; 7 = X (failed) — X loses to any solve. */
  guesses: number;
  solved: boolean;
}

const GUESS_OPTIONS = ['1', '2', '3', '4', '5', '6', 'X'] as const;

/** Day 2 capture (spec §7.1): screenshot upload + guess selector. */
export function ScreenshotCount({
  onCaptured,
  onCancel,
}: {
  onCaptured: (result: ScreenshotResult) => void;
  onCancel: () => void;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (asset?.uri) setUri(asset.uri);
  };

  const confirm = () => {
    if (!uri || guessIndex === null) return;
    onCaptured({
      uri,
      guesses: guessIndex + 1, // X = index 6 → 7
      solved: guessIndex < 6,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[textStyles.headerL, styles.title]}>Your result</Text>

      {uri ? (
        <Image source={{ uri }} style={styles.preview} resizeMode="contain" />
      ) : (
        <Pressable accessibilityRole="button" onPress={pick} style={styles.pickBox}>
          <Text style={[textStyles.bodyEmphasis, styles.pickText]}>
            Upload your Wordle screenshot
          </Text>
        </Pressable>
      )}
      {uri && (
        <Pressable accessibilityRole="button" onPress={pick} style={styles.repick}>
          <Text style={[textStyles.bodySmall, styles.repickText]}>
            Choose a different screenshot
          </Text>
        </Pressable>
      )}

      <Text style={[textStyles.headerS, styles.guessLabel]}>
        Solved it in…
      </Text>
      <View style={styles.guessRow}>
        {GUESS_OPTIONS.map((label, index) => {
          const selected = guessIndex === index;
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={label === 'X' ? 'Did not solve' : `${label} guesses`}
              accessibilityState={{ selected }}
              onPress={() => setGuessIndex(index)}
              style={[
                styles.guessChip,
                selected && (label === 'X' ? styles.chipX : styles.chipSelected),
              ]}
            >
              <Text
                style={[
                  textStyles.headerS,
                  selected ? styles.chipTextSelected : styles.chipText,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[textStyles.caption, styles.hint]}>
        An X still climbs the mountain — it just loses the head-to-head to any
        solve.
      </Text>

      <PressButton
        label="CONFIRM"
        disabled={!uri || guessIndex === null}
        onPress={confirm}
      />
      <PressButton label="BACK" variant="info" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
  },
  pickBox: {
    height: 200,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceSecondary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickText: {
    color: colors.info,
  },
  preview: {
    height: 240,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  repick: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repickText: {
    color: colors.info,
  },
  guessLabel: {
    color: colors.textPrimary,
  },
  guessRow: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  guessChip: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipX: {
    backgroundColor: colors.danger,
  },
  chipText: {
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
  },
  hint: {
    color: colors.textSecondary,
  },
});
