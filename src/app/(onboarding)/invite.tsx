import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { sendInvite } from '@/features/invites/sendInvite';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding step 5 (spec §5, §7.8) — inviteGate is LOCKED to 'soft' for this
 * beta: strong encouragement, always skippable, never a wall.
 */
export default function InviteStep() {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  const invite = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const didShare = await sendInvite(session.user.id);
      if (didShare) {
        setShared(true);
      }
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
    <OnboardingScreen
      step="invite"
      title="You need a rival"
      ctaLabel={shared ? 'INVITE ANOTHER' : 'INVITE A FRIEND'}
      onCta={invite}
      ctaDisabled={busy}
      onSkip={() => goToNextStep('invite')}
      skipLabel={shared ? 'Continue' : 'Skip for now'}
    >
      <Text style={[textStyles.body, styles.copy]}>
        Seek is head-to-head. Without a rival, you’re racing our mascot — and
        honestly, it wants to lose to a friend of yours.
      </Text>
      <View style={styles.card}>
        <Text style={[textStyles.headerS, styles.cardTitle]}>
          Invite a friend, earn 50 coins
        </Text>
        <Text style={[textStyles.body, styles.cardCopy]}>
          They get a code, you get coins, and your leaderboard gets interesting.
        </Text>
      </View>
      {shared && (
        <Text style={[textStyles.bodyEmphasis, styles.shared]}>
          Invite sent! 🎉 Add more rivals or continue.
        </Text>
      )}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  cardTitle: {
    color: colors.celebration,
  },
  cardCopy: {
    color: colors.textPrimary,
  },
  shared: {
    color: colors.info,
    textAlign: 'center',
  },
});
