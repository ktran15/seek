import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { FormTextInput } from '@/components/ui/FormTextInput';
import { useSession } from '@/features/auth/useSession';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { goToNextStep } from '@/features/onboarding/steps';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import { colors, textStyles } from '@/theme';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

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
      await updateProfile({
        username,
        display_name: displayName.trim(),
      });
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
    <OnboardingScreen
      step="username"
      title="Claim your name"
      ctaLabel="CONTINUE"
      onCta={submit}
      ctaDisabled={busy}
    >
      <Text style={[textStyles.body, styles.copy]}>
        This is you on the mountain and on your friends’ leaderboards.
      </Text>
      <FormTextInput
        label="Username"
        value={username}
        onChangeText={(t) => setUsername(t.trim())}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="trail_blazer"
        errorText={error}
      />
      <FormTextInput
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Alex Rivera"
      />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.textSecondary,
  },
});
