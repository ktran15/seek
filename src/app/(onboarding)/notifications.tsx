import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Onboarding step 1 (spec §5): ask for notification permission with the
 * rationale. Degrades gracefully — denial never blocks (push wiring is M11).
 */
export default function NotificationsStep() {
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      // Denied or unavailable — fine; M11 re-checks before scheduling.
    } finally {
      setBusy(false);
      goToNextStep('notifications');
    }
  };

  return (
    <OnboardingScreen
      step="notifications"
      title="Don’t miss your shot"
      ctaLabel="ENABLE NOTIFICATIONS"
      onCta={enable}
      ctaDisabled={busy}
      onSkip={() => goToNextStep('notifications')}
      skipLabel="Not now"
    >
      <Text style={[textStyles.body, styles.copy]}>
        One challenge drops every day — and you get one attempt at it.
      </Text>
      <View style={styles.card}>
        <Text style={[textStyles.headerS, styles.cardTitle]}>
          We’ll ping you for:
        </Text>
        <Text style={[textStyles.body, styles.cardLine]}>
          🌄 The daily challenge reveal
        </Text>
        <Text style={[textStyles.body, styles.cardLine]}>
          ⚔️ Your head-to-head results
        </Text>
      </View>
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
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  cardLine: {
    color: colors.textPrimary,
  },
});
