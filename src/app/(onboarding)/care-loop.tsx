import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { useProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding — THE CARE LOOP (spec §5 step 6, §10.3–10.5).
 *
 * Graphic-driven, minimal text: the three moods are TAUGHT BY SHOWING three
 * real beavers at real Happiness values (the same BeaverPreview + state logic
 * the app uses), not described in a paragraph. Two rules, one snack note.
 *
 * Tone (aesthetic §6): warm and motivating, never guilt-tripping — low
 * Happiness costs the player NOTHING in gameplay (§10.3), and the copy says so.
 */
const MOODS = [
  { happiness: 95, caption: 'Show up' },
  { happiness: 50, caption: 'Skip a day' },
  { happiness: 10, caption: 'Go quiet' },
];

export default function CareLoopStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const beaver = profile?.beaver_name?.trim() || 'your beaver';

  return (
    <OnboardingScreen
      step="care-loop"
      title={`Keep ${beaver} happy`}
      ctaLabel="GOT IT"
      onCta={() => goToNextStep('care-loop')}
    >
      <View style={styles.moods}>
        {MOODS.map((mood) => (
          <View key={mood.caption} style={styles.mood}>
            <BeaverPreview
              config={profile?.avatar_config}
              happiness={mood.happiness}
              size={84}
              showCaption={false}
            />
            <Text style={[textStyles.caption, styles.moodCaption]}>
              {mood.caption}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.rules}>
        <View style={styles.rule}>
          <View style={[styles.badge, styles.badgeUp]}>
            <Ionicons name="arrow-up" size={18} color={colors.textOnPrimary} />
          </View>
          <Text style={[textStyles.bodyEmphasis, styles.ruleText]}>
            Finish the day’s challenge
          </Text>
          <Text style={[textStyles.headerS, styles.deltaUp]}>
            +{config.beaver.completionRestore}
          </Text>
        </View>

        <View style={styles.rule}>
          <View style={[styles.badge, styles.badgeDown]}>
            <Ionicons name="arrow-down" size={18} color={colors.textOnPrimary} />
          </View>
          <Text style={[textStyles.bodyEmphasis, styles.ruleText]}>Miss a day</Text>
          <Text style={[textStyles.headerS, styles.deltaDown]}>
            −{config.beaver.dailyDecay}
          </Text>
        </View>

        <View style={styles.rule}>
          <View style={[styles.badge, styles.badgeSnack]}>
            <Ionicons name="fast-food" size={18} color={colors.textOnPrimary} />
          </View>
          <Text style={[textStyles.bodyEmphasis, styles.ruleText]}>
            Snack from the Shop
          </Text>
          <Text style={[textStyles.headerS, styles.deltaSnack]}>
            +{config.beaver.snackRestore}
          </Text>
        </View>
      </View>

      <Text style={[textStyles.caption, styles.reassure]}>
        A sad beaver never blocks you — nothing locks, nothing’s lost. He just
        misses you.
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  moods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  mood: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.xs,
  },
  moodCaption: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rules: {
    gap: spacing.xs,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.sm,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUp: {
    backgroundColor: colors.surfaceNature,
  },
  badgeDown: {
    backgroundColor: colors.textSecondary,
  },
  badgeSnack: {
    backgroundColor: colors.celebration,
  },
  ruleText: {
    flex: 1,
    color: colors.textPrimary,
  },
  deltaUp: {
    color: colors.surfaceNature,
  },
  deltaDown: {
    color: colors.textSecondary,
  },
  deltaSnack: {
    color: colors.celebration,
  },
  reassure: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
