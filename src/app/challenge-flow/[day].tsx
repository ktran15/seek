import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PressButton } from '@/components/ui/PressButton';
import { deriveAttemptState } from '@/features/challenge/attemptMachine';
import { DifficultySelect } from '@/features/challenge/DifficultySelect';
import {
  useBeginAttempt,
  useChallengeByDay,
  useMySubmissions,
  type Difficulty,
  type Submission,
} from '@/features/challenge/useChallenge';
import { useSession } from '@/features/auth/useSession';
import { currentBetaDay } from '@/lib/betaCalendar';
import { colors, radii, spacing, textStyles } from '@/theme';

type Step = 'reveal' | 'difficulty' | 'capture';

const MODE_LABELS = {
  SP: 'Solo — pass or fail, your friends are the referees',
  H2H: 'Head-to-head — the app picks your rival and the winner',
  CV: 'Community vote — your friends pick the best',
} as const;

export default function ChallengeFlowScreen() {
  const { day: dayParam } = useLocalSearchParams<{ day: string }>();
  const day = Number(dayParam);

  const { session } = useSession();
  const userId = session?.user.id;
  const challenge = useChallengeByDay(day);
  const { data: submissions } = useMySubmissions(userId);
  const begin = useBeginAttempt(userId);

  const [step, setStep] = useState<Step>('reveal');
  const [attempt, setAttempt] = useState<Submission | null>(null);

  const today = currentBetaDay();
  const existing = submissions?.find((s) => s.beta_day === day) ?? null;
  const attemptState = deriveAttemptState(existing, true);

  if (!challenge) {
    return (
      <View style={styles.center}>
        <Text style={[textStyles.body, styles.copy]}>Loading challenge…</Text>
      </View>
    );
  }

  // Availability guard (spec §8): only today's challenge is playable.
  if (day !== today) {
    return (
      <View style={styles.center}>
        <Text style={[textStyles.headerL, styles.title]}>
          {day > today ? 'Locked' : 'Missed'}
        </Text>
        <Text style={[textStyles.body, styles.copy]}>
          {day > today
            ? 'This challenge unlocks on its day.'
            : 'This day has passed — no makeups. Catch today’s instead.'}
        </Text>
        <PressButton label="BACK" variant="info" onPress={() => router.back()} />
      </View>
    );
  }

  if (attemptState === 'submitted') {
    return (
      <View style={styles.center}>
        <Text style={[textStyles.headerL, styles.title]}>Done for today</Text>
        <Text style={[textStyles.body, styles.copy]}>
          You used your one attempt — flag planted. See how friends did in the
          feed.
        </Text>
        <PressButton label="BACK" variant="info" onPress={() => router.back()} />
      </View>
    );
  }

  const onBegin = (difficulty?: Difficulty) => {
    begin.mutate(
      { challenge, betaDay: day, difficulty },
      {
        onSuccess: (row) => {
          setAttempt(row);
          setStep('capture');
        },
        onError: (e) =>
          Alert.alert(
            'Could not start',
            e instanceof Error ? e.message : 'Try again.',
          ),
      },
    );
  };

  return (
    <ErrorBoundary screen="Challenge Flow">
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {step === 'reveal' && (
          <>
            <Text style={[textStyles.caption, styles.dayLabel]}>
              DAY {day} CHALLENGE
            </Text>
            <Text style={[textStyles.hero, styles.title]}>{challenge.title}</Text>
            <View style={styles.card}>
              <Text style={[textStyles.body, styles.explainer]}>
                {challenge.explainer}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={[textStyles.bodySmall, styles.modeLine]}>
                {challenge.has_difficulty
                  ? 'Easy & Medium are solo. Hard is head-to-head.'
                  : MODE_LABELS[challenge.mode]}
              </Text>
            </View>
            <View style={[styles.card, styles.warnCard]}>
              <Text style={[textStyles.headerS, styles.warnText]}>
                ⚠️ You get ONE attempt
              </Text>
              <Text style={[textStyles.bodySmall, styles.warnCopy]}>
                Reveal costs nothing — prep as long as you like. But once you
                tap Begin and capture starts, this is it.
              </Text>
            </View>
            <PressButton
              label={challenge.has_difficulty ? 'CHOOSE DIFFICULTY' : 'BEGIN'}
              disabled={begin.isPending}
              onPress={() =>
                challenge.has_difficulty ? setStep('difficulty') : onBegin()
              }
            />
          </>
        )}

        {step === 'difficulty' && (
          <DifficultySelect
            busy={begin.isPending}
            onSelect={(difficulty) => onBegin(difficulty)}
          />
        )}

        {step === 'capture' && (
          <View style={styles.card}>
            <Text style={[textStyles.headerS, styles.title]}>
              Capture — lands next sub-step
            </Text>
            <Text style={[textStyles.bodySmall, styles.copy]}>
              Your attempt is safely in progress
              {attempt?.difficulty ? ` (${attempt.difficulty})` : ''}. Leaving
              now does NOT burn it — you can come back and begin again.
            </Text>
            <PressButton label="EXIT (ATTEMPT KEPT)" variant="info" onPress={() => router.back()} />
          </View>
        )}
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dayLabel: {
    color: colors.accent,
    letterSpacing: 1,
  },
  title: {
    color: colors.textPrimary,
  },
  copy: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  explainer: {
    color: colors.textPrimary,
  },
  modeLine: {
    color: colors.info,
  },
  warnCard: {
    backgroundColor: colors.surfaceSecondary,
  },
  warnText: {
    color: colors.textPrimary,
  },
  warnCopy: {
    color: colors.textPrimary,
  },
});
