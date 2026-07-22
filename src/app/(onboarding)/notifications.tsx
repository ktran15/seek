import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { registerPushToken } from '@/features/push/registerPush';
import { obColors, obText, sc } from '@/features/onboarding/theme';

/**
 * "Don't miss your shot" (prototype screen 4) — notification permission with
 * the rationale. Degrades gracefully: denial never blocks the flow.
 */
export default function NotificationsStep() {
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    try {
      await Notifications.requestPermissionsAsync();
      // Grant just landed — register this device now (no-op in Expo Go / denied).
      await registerPushToken();
    } catch {
      // Denied or unavailable — fine; scheduling re-checks permission.
    } finally {
      setBusy(false);
      goToNextStep('notifications');
    }
  };

  return (
    <OnboardingScaffold
      step="notifications"
      title="Don’t miss your shot"
      titleStyle={obText.title32}
      subtitle="You get one attempt at a daily challenge."
      ctaLabel="Enable notifications"
      onCta={enable}
      ctaDisabled={busy}
      onSkip={() => goToNextStep('notifications')}
      skipLabel="Not now"
    >
      <View style={styles.card}>
        <Text style={[obText.micro, styles.cardTitle]}>We’ll ping you for:</Text>
        <PingRow color={obColors.dotOrange} label="The daily challenge reveal" />
        <PingRow color={obColors.dotTan} label="Your head-to-head results" />
        <PingRow color={obColors.dotGreen} label="A nudge to keep your beaver happy" />
      </View>
    </OnboardingScaffold>
  );
}

function PingRow({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[obText.body, styles.rowLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: sc(22),
    backgroundColor: obColors.surface,
    borderWidth: 1,
    borderColor: obColors.border,
    borderRadius: sc(16),
    paddingVertical: sc(18),
    paddingHorizontal: sc(16),
    gap: sc(15),
  },
  cardTitle: { color: obColors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: sc(12) },
  dot: { width: sc(10), height: sc(10), borderRadius: sc(5) },
  rowLabel: { color: obColors.text, flex: 1 },
});
