import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { obColors, obText } from '@/features/onboarding/theme';
import { sendInvite } from '@/features/invites/sendInvite';
import { useProfile } from '@/features/profile/useProfile';

/**
 * "You need a rival" (prototype screen 9, spec §7.8) — inviteGate is LOCKED to
 * 'soft' for this beta: strong encouragement, always skippable, never a wall.
 */
export default function InviteStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  const invite = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const didShare = await sendInvite();
      if (didShare) setShared(true);
    } catch (e) {
      Alert.alert(
        'Could not open the share sheet',
        e instanceof Error ? e.message : 'Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScaffold
      step="invite"
      title="You need a rival"
      titleStyle={obText.title30}
      subtitle="Seek is head-to-head. Climbing up the mountain can be lonely — invite a friend to join you on the trail."
      ctaLabel={shared ? 'Invite another' : 'Invite a friend'}
      onCta={invite}
      ctaDisabled={busy}
      onSkip={() => goToNextStep('invite')}
      skipLabel={shared ? 'Continue' : 'Skip for now'}
    >
      <View style={styles.versus}>
        <View style={styles.avatarBlock}>
          <View style={styles.youRing}>
            <BeaverPreview config={profile?.avatar_config} height={72} />
          </View>
          <Text style={[obText.caption, styles.avatarLabel]}>You</Text>
        </View>

        <Text style={[obText.title30, styles.vs]}>vs</Text>

        <View style={styles.avatarBlock}>
          <View style={styles.rivalRing}>
            <Text style={styles.rivalMark}>?</Text>
          </View>
          <Text style={[obText.caption, styles.avatarLabel]}>Your rival</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[obText.cardSerif, styles.cardTitle]}>
          Invite a friend, earn 50 coins
        </Text>
        <Text style={[obText.cardBody, styles.cardBody]}>
          They get a code, you get coins, and your leaderboard gets interesting.
        </Text>
      </View>

      {shared ? (
        <Text style={[obText.link, styles.confirm]}>
          Invite sent! Add more rivals or continue.
        </Text>
      ) : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  versus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    marginTop: 28,
    marginBottom: 26,
  },
  avatarBlock: { alignItems: 'center', gap: 9 },
  youRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: obColors.youRingFill,
    borderWidth: 2.5,
    borderColor: obColors.youRingBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rivalRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: obColors.rivalFill,
    borderWidth: 2.5,
    borderColor: obColors.rivalBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivalMark: {
    fontFamily: obText.title30.fontFamily,
    fontSize: 34,
    color: obColors.rivalMark,
  },
  vs: { color: obColors.vs, fontSize: 20 },
  avatarLabel: { color: obColors.textMuted },
  card: {
    backgroundColor: obColors.surfacePeach,
    borderWidth: 1.5,
    borderColor: obColors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: { color: obColors.link, marginBottom: 6 },
  cardBody: { color: obColors.textBrown },
  confirm: { color: obColors.link, textAlign: 'center', marginTop: 16 },
});
