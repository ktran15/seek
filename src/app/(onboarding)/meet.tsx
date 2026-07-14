import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding — MEET YOUR BEAVER (spec §5 step 3, §10).
 *
 * Replaces the old text-wall "How Seek works" screen. The beaver IS the pitch:
 * one hero image, one line, three icon beats. No paragraphs.
 */
const BEATS = [
  { icon: 'flag' as const, text: 'One challenge a day' },
  { icon: 'flash' as const, text: 'One real attempt' },
  { icon: 'heart' as const, text: 'Keep your beaver happy' },
];

export default function MeetStep() {
  return (
    <OnboardingScreen
      step="meet"
      title="Meet your beaver"
      ctaLabel="LOVE IT"
      onCta={() => goToNextStep('meet')}
    >
      <View style={styles.stage}>
        <BeaverPreview config={null} happiness={90} size={190} showCaption={false} />
      </View>

      <Text style={[textStyles.bodyEmphasis, styles.lede]}>
        This little guy is yours. Show up every day and he thrives.
      </Text>

      <View style={styles.beats}>
        {BEATS.map((beat) => (
          <View key={beat.text} style={styles.beat}>
            <View style={styles.beatIcon}>
              <Ionicons name={beat.icon} size={20} color={colors.textOnPrimary} />
            </View>
            <Text style={[textStyles.bodySmall, styles.beatText]}>{beat.text}</Text>
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  lede: {
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  beats: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  beat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.sm,
  },
  beatIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beatText: {
    flex: 1,
    color: colors.textPrimary,
  },
});
