import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FormTextInput } from '@/components/ui/FormTextInput';
import { PressButton } from '@/components/ui/PressButton';
import { useSession } from '@/features/auth/useSession';
import { deriveAttemptState } from '@/features/challenge/attemptMachine';
import { DifficultySelect } from '@/features/challenge/DifficultySelect';
import { PostSubmitSequence } from '@/features/challenge/PostSubmitSequence';
import {
  useBeginAttempt,
  useChallengeByDay,
  useMySubmissions,
  useSubmitAttempt,
  type Challenge,
  type Difficulty,
  type Submission,
} from '@/features/challenge/useChallenge';
import { CameraCapture } from '@/features/capture/CameraCapture';
import { uploadProofs } from '@/features/capture/mediaUpload';
import { MultiPhotoCapture } from '@/features/capture/MultiPhotoCapture';
import { ScreenshotCount } from '@/features/capture/ScreenshotCount';
import { currentBetaDay } from '@/lib/betaCalendar';
import { colors, radii, spacing, textStyles } from '@/theme';

type Step =
  | 'reveal'
  | 'difficulty'
  | 'capture'
  | 'review'
  | 'uploading'
  | 'uploadFailed'
  | 'done';

interface CaptureData {
  uris: string[];
  seconds?: number;
  guesses?: number;
  solved?: boolean;
  count?: number;
}

const MODE_LABELS = {
  SP: 'Solo — pass or fail, your friends are the referees',
  H2H: 'Head-to-head — the app picks your rival and the winner',
  CV: 'Community vote — your friends pick the best',
} as const;

/** Does this challenge/difficulty end in a self-reported pass/fail? */
function needsPassFail(challenge: Challenge, difficulty: Difficulty | null): boolean {
  if (challenge.has_difficulty) return difficulty !== 'hard';
  return challenge.victor_rule === 'pass_fail';
}

/** Day-4 Hard needs a made-count input after the 30s clip (spec §7.2). */
function needsMadeCount(challenge: Challenge, difficulty: Difficulty | null): boolean {
  return challenge.has_difficulty && difficulty === 'hard';
}

export default function ChallengeFlowScreen() {
  const { day: dayParam } = useLocalSearchParams<{ day: string }>();
  const day = Number(dayParam);

  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const userId = session?.user.id;
  const challenge = useChallengeByDay(day);
  const { data: submissions } = useMySubmissions(userId);
  const begin = useBeginAttempt(userId);
  const submitAttempt = useSubmitAttempt(userId);

  const [step, setStep] = useState<Step>('reveal');
  const [attempt, setAttempt] = useState<Submission | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [capture, setCapture] = useState<CaptureData | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [madeCount, setMadeCount] = useState('');

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

  if (attemptState === 'submitted' && step !== 'done') {
    return (
      <View style={styles.center}>
        <Text style={[textStyles.headerL, styles.title]}>Done for today</Text>
        <Text style={[textStyles.body, styles.copy]}>
          You used your one attempt — flag planted.
        </Text>
        <PressButton label="BACK" variant="info" onPress={() => router.back()} />
      </View>
    );
  }

  const onBegin = (chosen?: Difficulty) => {
    begin.mutate(
      { challenge, betaDay: day, difficulty: chosen },
      {
        onSuccess: (row) => {
          setAttempt(row);
          setDifficulty(chosen ?? null);
          setStep('capture');
        },
        onError: (e) =>
          Alert.alert('Could not start', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  };

  const onCaptured = (data: CaptureData) => {
    setCapture(data);
    setStep('review');
  };

  const submit = async () => {
    if (!userId || !attempt || !capture) return;

    let finalPassed: boolean | undefined;
    let score: number | undefined;

    if (challenge.capture_type === 'timer_video') {
      score = capture.seconds;
      finalPassed = true;
    } else if (challenge.capture_type === 'screenshot_plus_count') {
      score = capture.guesses;
      finalPassed = capture.solved;
    } else if (challenge.capture_type === 'multi_photo_count') {
      score = capture.count;
      finalPassed = true;
    } else if (needsMadeCount(challenge, difficulty)) {
      const made = Number(madeCount);
      if (!Number.isInteger(made) || made < 0 || made > 99) {
        Alert.alert('Made count', 'Enter how many you made (0–99).');
        return;
      }
      score = made;
      finalPassed = true;
    } else if (needsPassFail(challenge, difficulty)) {
      if (passed === null) {
        Alert.alert('One more thing', 'Did you make it? Pick yes or no.');
        return;
      }
      finalPassed = passed;
    } else {
      finalPassed = true; // CV photo (day 3): submitting = entered
    }

    setStep('uploading');
    try {
      const paths = await uploadProofs(userId, challenge.id, capture.uris);
      await submitAttempt.mutateAsync({
        submissionId: attempt.id,
        passed: finalPassed,
        score,
        mediaPaths: paths,
      });
      setStep('done');
    } catch (e) {
      // Media stays local; the attempt is NOT burned (spec §7.4).
      console.error('[submit]', e);
      setStep('uploadFailed');
    }
  };

  return (
    <ErrorBoundary screen="Challenge Flow">
      {step === 'capture' &&
      (challenge.capture_type === 'timer_video' ||
        challenge.capture_type === 'camera_photo' ||
        challenge.capture_type === 'camera_video') ? (
        <CameraCapture
          kind={challenge.capture_type === 'camera_photo' ? 'photo' : 'video'}
          capSeconds={
            needsPassFail(challenge, difficulty)
              ? null // day-4 E/M + day-7 have no shot clock
              : challenge.recording_cap_seconds
          }
          clockDirection={
            challenge.capture_type === 'timer_video'
              ? 'up'
              : needsMadeCount(challenge, difficulty)
                ? 'down'
                : challenge.capture_type === 'camera_video'
                  ? 'up'
                  : null
          }
          onCaptured={(result) =>
            onCaptured({ uris: [result.uri], seconds: result.seconds })
          }
          onCancel={() => setStep('reveal')}
        />
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + spacing.sm,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
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
            <DifficultySelect busy={begin.isPending} onSelect={onBegin} />
          )}

          {step === 'capture' && challenge.capture_type === 'screenshot_plus_count' && (
            <ScreenshotCount onCaptured={(r) => onCaptured({ uris: [r.uri], guesses: r.guesses, solved: r.solved })} onCancel={() => setStep('reveal')} />
          )}
          {step === 'capture' && challenge.capture_type === 'multi_photo_count' && (
            <MultiPhotoCapture onCaptured={(r) => onCaptured({ uris: r.uris, count: r.count })} onCancel={() => setStep('reveal')} />
          )}

          {step === 'review' && capture && (
            <>
              <Text style={[textStyles.headerL, styles.title]}>
                Lock it in
              </Text>
              <View style={styles.card}>
                <Text style={[textStyles.body, styles.explainer]}>
                  {challenge.capture_type === 'timer_video' &&
                    `Your time: ${capture.seconds}s (lower wins the head-to-head).`}
                  {challenge.capture_type === 'screenshot_plus_count' &&
                    (capture.solved
                      ? `Solved in ${capture.guesses} — fewer guesses wins.`
                      : 'X — climbs the mountain, loses the head-to-head to any solve.')}
                  {challenge.capture_type === 'multi_photo_count' &&
                    `${capture.count} selfies — higher count wins.`}
                  {(challenge.capture_type === 'camera_photo' ||
                    challenge.capture_type === 'camera_video') &&
                    `Proof captured (${capture.uris.length} file${capture.uris.length === 1 ? '' : 's'}).`}
                </Text>
              </View>

              {needsMadeCount(challenge, difficulty) && (
                <FormTextInput
                  label="How many did you make?"
                  value={madeCount}
                  onChangeText={setMadeCount}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              )}

              {needsPassFail(challenge, difficulty) && (
                <View style={styles.passFailRow}>
                  <PressButton
                    label={passed === true ? '✓ MADE IT' : 'MADE IT'}
                    onPress={() => setPassed(true)}
                    style={styles.passFailButton}
                  />
                  <PressButton
                    label={passed === false ? '✓ MISSED' : 'MISSED'}
                    variant="info"
                    onPress={() => setPassed(false)}
                    style={styles.passFailButton}
                  />
                </View>
              )}

              <PressButton label="SUBMIT — THIS IS THE ONE" onPress={submit} />
              <Text style={[textStyles.caption, styles.hint]}>
                Submitting is final: one attempt, one submission.
              </Text>
            </>
          )}

          {step === 'uploading' && (
            <View style={styles.center}>
              <Text style={[textStyles.headerL, styles.title]}>Uploading proof…</Text>
              <Text style={[textStyles.bodySmall, styles.copy]}>
                Hold tight — don’t close the app.
              </Text>
            </View>
          )}

          {step === 'uploadFailed' && (
            <>
              <Text style={[textStyles.headerL, styles.title]}>
                Upload hiccup — attempt safe
              </Text>
              <Text style={[textStyles.body, styles.copy]}>
                Your proof is saved on this phone and your attempt is NOT
                burned. Check your connection and retry.
              </Text>
              <PressButton label="RETRY UPLOAD" onPress={submit} />
            </>
          )}

          {step === 'done' && (
            <PostSubmitSequence day={day} onDone={() => router.back()} />
          )}
        </ScrollView>
      )}
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
  passFailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  passFailButton: {
    flex: 1,
  },
  hint: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
