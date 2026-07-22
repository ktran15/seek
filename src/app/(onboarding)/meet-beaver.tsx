import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { obColors, obRadii, obText, sc } from '@/features/onboarding/theme';
import { useProfile } from '@/features/profile/useProfile';

/** "Meet your beaver" (prototype screen 6) — graphic-first intro to the beaver. */
export default function MeetBeaverStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);

  return (
    <OnboardingScaffold
      step="meet-beaver"
      title="Meet your beaver"
      titleStyle={obText.title29}
      ctaLabel="Let’s go"
      onCta={() => goToNextStep('meet-beaver')}
    >
      <View style={styles.stage}>
        <BeaverPreview config={profile?.avatar_config} height={sc(148)} />
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
    marginTop: sc(14),
    backgroundColor: obColors.surface,
    borderWidth: 1,
    borderColor: obColors.border,
    borderRadius: obRadii.cardLg,
    height: sc(170),
    alignItems: 'center',
    justifyContent: 'center',
  },
  helper: {
    color: obColors.textMuted,
    textAlign: 'center',
    marginTop: sc(12),
    marginBottom: sc(14),
  },
  rows: { gap: sc(9) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sc(12),
    backgroundColor: obColors.surface,
    borderWidth: 1,
    borderColor: obColors.border,
    borderRadius: obRadii.chip,
    paddingVertical: sc(11),
    paddingHorizontal: sc(13),
  },
  square: {
    width: sc(28),
    height: sc(28),
    borderRadius: obRadii.iconSquare,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareDot: { width: sc(9), height: sc(9), borderRadius: sc(5) },
  rowLabel: { color: obColors.text, flex: 1 },
});
