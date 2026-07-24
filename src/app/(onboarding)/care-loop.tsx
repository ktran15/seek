import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { obColors, obText, sc } from '@/features/onboarding/theme';

/**
 * "Show up. Stay happy." (prototype screen 8) — teaches the care loop: finish →
 * happiness up + streak; skip → a small dip (never a gameplay penalty); a Shop
 * snack tops it up. No write.
 */
export default function CareLoopStep() {
  return (
    <OnboardingScaffold
      step="care-loop"
      title="Show up. Stay happy."
      titleStyle={obText.title29}
      subtitle="Your beaver’s mood follows your habits."
      ctaLabel="Got it"
      onCta={() => goToNextStep('care-loop')}
    >
      <View style={styles.cards}>
        <View style={[styles.card, styles.cardGood]}>
          <View style={[styles.icon, { backgroundColor: obColors.dotGreen }]}>
            <Ionicons name="checkmark" size={sc(15)} color={obColors.white} />
          </View>
          <View style={styles.text}>
            <Text style={[obText.cardTitle, styles.title]}>Finish the day</Text>
            <Text style={[obText.cardBody, { color: obColors.textGreen }]}>
              Happiness goes up and your streak grows.
            </Text>
          </View>
        </View>

        <View style={[styles.card, styles.cardSkip]}>
          <View style={[styles.icon, { backgroundColor: obColors.dotSkip }]}>
            <View style={[styles.innerDot, { backgroundColor: obColors.screen }]} />
          </View>
          <View style={styles.text}>
            <Text style={[obText.cardTitle, styles.title]}>Skip a day</Text>
            <Text style={[obText.cardBody, { color: obColors.textMuted }]}>
              It dips a little, no penalty, just a nudge to come back.
            </Text>
          </View>
        </View>

        <View style={[styles.card, styles.cardBoost]}>
          <View style={[styles.icon, { backgroundColor: obColors.primary }]}>
            <View style={[styles.innerDot, { backgroundColor: obColors.onPrimary }]} />
          </View>
          <View style={styles.text}>
            <Text style={[obText.cardTitle, styles.title]}>Need a boost?</Text>
            <Text style={[obText.cardBody, { color: obColors.textBrown }]}>
              Grab a snack from the Shop any time.
            </Text>
          </View>
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  cards: { marginTop: sc(22), gap: sc(12) },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sc(12),
    borderWidth: 1,
    borderRadius: sc(15),
    padding: sc(14),
  },
  cardGood: { backgroundColor: obColors.surfaceGreen, borderColor: obColors.borderGreen },
  cardSkip: { backgroundColor: obColors.surface, borderColor: obColors.border },
  cardBoost: { backgroundColor: obColors.surfacePeach, borderColor: obColors.borderPeach },
  icon: {
    width: sc(26),
    height: sc(26),
    borderRadius: sc(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: { width: sc(9), height: sc(9), borderRadius: sc(5) },
  text: { flex: 1, gap: sc(3) },
  title: { color: obColors.text },
});
