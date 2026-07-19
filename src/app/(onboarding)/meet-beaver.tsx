import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding "Meet your beaver" (spec §5 step 3, §10.6) — the visual intro
 * beat that introduces the beaver concept (replaces the old text "how Seek
 * works" screen). Graphic-first, minimal text.
 */
export default function MeetBeaverStep() {
  return (
    <OnboardingScreen
      step="meet-beaver"
      title="Meet your beaver"
      ctaLabel="LET’S GO"
      onCta={() => goToNextStep('meet-beaver')}
    >
      <View style={styles.stage}>
        <BeaverPreview config={undefined} height={200} />
      </View>

      <Text style={[textStyles.body, styles.lead]}>
        This little builder is yours. It climbs the mountain with you.
      </Text>

      <View style={styles.row}>
        <Ionicons name="pencil" size={24} color={colors.info} />
        <Text style={[textStyles.body, styles.rowText]}>Name it</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="color-palette" size={24} color={colors.primary} />
        <Text style={[textStyles.body, styles.rowText]}>Make it yours</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="heart" size={24} color={colors.primaryPressed} />
        <Text style={[textStyles.body, styles.rowText]}>
          Keep it happy by showing up
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.lg,
  },
  lead: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  rowText: { color: colors.textPrimary, flex: 1 },
});
