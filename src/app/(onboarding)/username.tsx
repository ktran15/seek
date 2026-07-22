import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { OnboardingField } from '@/features/onboarding/components/OnboardingField';
import { OnboardingScaffold } from '@/features/onboarding/components/OnboardingScaffold';
import { goToNextStep } from '@/features/onboarding/steps';
import { obText, sc } from '@/features/onboarding/theme';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/** "Claim your name" (prototype screen 3) — username + display name. */
export default function UsernameStep() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile(session?.user.id);

  const metaName =
    (session?.user.user_metadata?.full_name as string | undefined) ?? '';
  const [username, setUsername] = useState(profile?.username ?? '');
  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? metaName,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!USERNAME_RE.test(username)) {
      setError('Usernames are 3–20 characters: letters, numbers, underscores.');
      return;
    }
    if (!displayName.trim()) {
      setError('Add a display name — it’s what friends see.');
      return;
    }

    setBusy(true);
    try {
      await updateProfile({ username, display_name: displayName.trim() });
      goToNextStep('username');
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setError(
        message.includes('duplicate') || message.includes('unique')
          ? 'That username is taken — try another.'
          : message || 'Could not save. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScaffold
      step="username"
      title="Claim your name"
      titleStyle={obText.title32}
      subtitle="This is you on the mountain and on your friends’ leaderboards."
      ctaLabel="Continue"
      onCta={submit}
      ctaDisabled={busy}
    >
      <View style={styles.fields}>
        <OnboardingField
          label="Username"
          value={username}
          onChangeText={(t) => setUsername(t.trim())}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="trail_blazer"
          errorText={error}
        />
        <OnboardingField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Alex Rivera"
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  fields: { marginTop: sc(24), gap: sc(16) },
});
