import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { obColors, obText } from '@/features/onboarding/theme';

/** "Built for doers" (prototype screen 5) — social proof / why we're great. */
export default function SocialProofStep() {
  return (
    <OnboardingScaffold
      step="social-proof"
      title="Built for doers"
      titleStyle={obText.title32}
      subtitle="No endless scrolling. No highlight reels. Just you, your friends, and one real thing to do every day."
      ctaLabel="Continue"
      onCta={() => goToNextStep('social-proof')}
    >
      <View style={styles.cards}>
        <View style={[styles.card, styles.cardTan]}>
          <Text style={[obText.cardSerif, styles.quote]}>
            “The only app that gets me off my phone.”
          </Text>
          <Text style={[obText.caption, styles.by]}>— an early Seeker</Text>
        </View>
        <View style={[styles.card, styles.cardPeach]}>
          <Text style={[obText.cardSerif, styles.quote]}>
            “My friends and I finally have a reason to compete again.”
          </Text>
          <Text style={[obText.caption, styles.by]}>— beta tester #7</Text>
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  cards: { marginTop: 22, gap: 14 },
  card: {
    borderWidth: 1,
    borderColor: obColors.border,
    borderRadius: 16,
    padding: 16,
  },
  cardTan: { backgroundColor: obColors.surface },
  cardPeach: { backgroundColor: obColors.surfacePeach },
  quote: { color: obColors.text },
  by: { color: obColors.textMuted, marginTop: 8 },
});
