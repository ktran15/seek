import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding "Care-loop explainer" (spec §5 step 6, §10.6). Teaches the loop
 * graphically, minimal text: show up → beaver's happy + streak grows; skip →
 * it dips (never a gameplay penalty, §10.3); a Shop snack tops it up. No write.
 */
export default function CareLoopStep() {
  return (
    <OnboardingScreen
      step="care-loop"
      title="Show up. Stay happy."
      ctaLabel="GOT IT"
      onCta={() => goToNextStep('care-loop')}
    >
      <Text style={[textStyles.body, styles.lead]}>
        Your beaver’s mood follows your habit — not a scoreboard.
      </Text>

      <View style={[styles.card, styles.cardGood]}>
        <Text style={styles.emoji}>✅</Text>
        <View style={styles.cardText}>
          <Text style={[textStyles.headerS, styles.cardTitle]}>
            Finish the day
          </Text>
          <Text style={[textStyles.body, styles.cardBody]}>
            Happiness goes up 🐾 and your streak grows 🔥
          </Text>
        </View>
      </View>

      <View style={[styles.card, styles.cardDip]}>
        <Text style={styles.emoji}>😴</Text>
        <View style={styles.cardText}>
          <Text style={[textStyles.headerS, styles.cardTitle]}>Skip a day</Text>
          <Text style={[textStyles.body, styles.cardBody]}>
            It dips a little — no penalty, just a nudge to come back.
          </Text>
        </View>
      </View>

      <View style={[styles.card, styles.cardSnack]}>
        <Text style={styles.emoji}>🍎</Text>
        <View style={styles.cardText}>
          <Text style={[textStyles.headerS, styles.cardTitle]}>
            Need a boost?
          </Text>
          <Text style={[textStyles.body, styles.cardBody]}>
            Grab a snack from the Shop any time.
          </Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.textPrimary, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  cardGood: { backgroundColor: colors.surfaceNature },
  cardDip: { backgroundColor: colors.surface },
  cardSnack: { backgroundColor: colors.surfaceSecondary },
  emoji: { fontSize: 32 },
  cardText: { flex: 1, gap: spacing.xxs },
  cardTitle: { color: colors.textPrimary },
  cardBody: { color: colors.textPrimary },
});
