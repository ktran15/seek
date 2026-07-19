import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';

import type { Difficulty } from './useChallenge';

interface Option {
  difficulty: Difficulty;
  title: string;
  task: string;
  modeLine: string;
  h2h: boolean;
}

/**
 * Day-4 difficulty select (spec §7.2, LOCKED): the choice picks the task AND
 * the mode. Hard is the ONLY head-to-head path — intended risk-for-reward
 * asymmetry; do not balance it away.
 */
const OPTIONS: Option[] = [
  {
    difficulty: 'easy',
    title: 'Easy',
    task: 'Throw a paper ball into a trash can',
    modeLine: 'Solo · pass/fail · safe climb',
    h2h: false,
  },
  {
    difficulty: 'medium',
    title: 'Medium',
    task: 'Make a free throw',
    modeLine: 'Solo · pass/fail · safe climb',
    h2h: false,
  },
  {
    difficulty: 'hard',
    title: 'Hard',
    task: '3-pointers — 30 seconds, most makes',
    modeLine: 'UNLOCKS HEAD-TO-HEAD · bonus coins + blue crate if you win',
    h2h: true,
  },
];

interface DifficultySelectProps {
  busy: boolean;
  onSelect: (difficulty: Difficulty) => void;
}

export function DifficultySelect({ busy, onSelect }: DifficultySelectProps) {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.headerL, styles.title]}>Pick your line</Text>
      <Text style={[textStyles.bodySmall, styles.subtitle]}>
        Your choice sets the task AND the stakes. Hard is the only door to
        today’s head-to-head.
      </Text>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.difficulty}
          accessibilityRole="button"
          accessibilityLabel={`${option.title}: ${option.task}`}
          disabled={busy}
          onPress={() => onSelect(option.difficulty)}
          style={[styles.card, option.h2h && styles.cardHard]}
        >
          <Text
            style={[
              textStyles.headerL,
              option.h2h ? styles.titleHard : styles.cardTitle,
            ]}
          >
            {option.title}
          </Text>
          <Text style={[textStyles.body, styles.task]}>{option.task}</Text>
          <Text
            style={[
              textStyles.caption,
              option.h2h ? styles.modeHard : styles.mode,
            ]}
          >
            {option.h2h ? (
              <>
                <Ionicons name="flame" size={12} color={colors.accent} />{' '}
              </>
            ) : null}
            {option.modeLine}
          </Text>
        </Pressable>
      ))}
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
  subtitle: {
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  cardHard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  titleHard: {
    color: colors.primaryPressed,
  },
  task: {
    color: colors.textPrimary,
  },
  mode: {
    color: colors.textSecondary,
  },
  modeHard: {
    color: colors.accent,
  },
});
