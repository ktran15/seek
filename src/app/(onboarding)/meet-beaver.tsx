import { Image, StyleSheet, Text, View } from 'react-native';

import { getAsset } from '@/assets/registry';
import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { obColors, obRadii, obText } from '@/features/onboarding/theme';

/** "Meet your beaver" (prototype screen 6) — graphic-first intro to the beaver. */
export default function MeetBeaverStep() {
  return (
    <OnboardingScaffold
      step="meet-beaver"
      title="Meet your beaver"
      titleStyle={obText.title29}
      ctaLabel="Let’s go"
      onCta={() => goToNextStep('meet-beaver')}
    >
      <View style={styles.stage}>
        <Image
          source={getAsset('onboardingBeaver')}
          style={styles.beaver}
          resizeMode="contain"
          accessibilityLabel="Your beaver"
        />
      </View>

      <Text style={[obText.helper, styles.helper]}>
        This little builder is yours. Bring it to the summit.
      </Text>

      <View style={styles.rows}>
        <MeetRow squareColor={obColors.surfacePeach} dotColor={obColors.dotOrange} label="Name it" />
        <MeetRow squareColor={obColors.surfaceGreen} dotColor={obColors.dotGreen} label="Make it yours" />
        <MeetRow
          squareColor={obColors.surfacePeach}
          dotColor={obColors.dotTan}
          label="Keep it happy by showing up"
        />
      </View>
    </OnboardingScaffold>
  );
}

function MeetRow({
  squareColor,
  dotColor,
  label,
}: {
  squareColor: string;
  dotColor: string;
  label: string;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.square, { backgroundColor: squareColor }]}>
        <View style={[styles.squareDot, { backgroundColor: dotColor }]} />
      </View>
      <Text style={[obText.rowLabel, styles.rowLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    marginTop: 14,
    backgroundColor: obColors.surface,
    borderWidth: 1,
    borderColor: obColors.border,
    borderRadius: obRadii.cardLg,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaver: { height: 144, width: '70%' },
  helper: { color: obColors.textMuted, textAlign: 'center', marginTop: 12, marginBottom: 14 },
  rows: { gap: 9 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: obColors.surface,
    borderWidth: 1,
    borderColor: obColors.border,
    borderRadius: obRadii.chip,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  square: {
    width: 28,
    height: 28,
    borderRadius: obRadii.iconSquare,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareDot: { width: 9, height: 9, borderRadius: 5 },
  rowLabel: { color: obColors.text, flex: 1 },
});
