import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/features/onboarding/components/OnboardingButton';
import { OnboardingField } from '@/features/onboarding/components/OnboardingField';
import { obColors, obText, sc } from '@/features/onboarding/theme';
import { supabase } from '@/lib/supabase';

type Mode = 'signIn' | 'signUp';

/** Create account / sign in (prototype screen 2). Auth backend unchanged. */
export default function EmailAuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signUp') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo('Check your email for a confirmation link, then sign in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const isSignUp = mode === 'signUp';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + sc(8) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Text style={[obText.link, styles.back]}>← Back</Text>
        </Pressable>

        <Text style={[obText.title34, styles.title]}>
          {isSignUp ? 'Create account' : 'Welcome back'}
        </Text>

        <OnboardingField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <OnboardingField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder="At least 8 characters"
        />

        {!!error && <Text style={[obText.caption, styles.error]}>{error}</Text>}
        {!!info && <Text style={[obText.caption, styles.info]}>{info}</Text>}

        <OnboardingButton
          label={isSignUp ? 'Sign up' : 'Sign in'}
          onPress={submit}
          disabled={busy}
          style={styles.submit}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMode(isSignUp ? 'signIn' : 'signUp');
            setError(null);
            setInfo(null);
          }}
          style={styles.switchHit}
        >
          <Text style={[obText.link, styles.switchText]}>
            {isSignUp
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: obColors.screen },
  container: {
    flexGrow: 1,
    paddingHorizontal: sc(24),
    paddingBottom: sc(26),
    gap: sc(16),
  },
  backHit: { minHeight: sc(44), justifyContent: 'center' },
  back: { color: obColors.textMuted, textAlign: 'left' },
  title: { color: obColors.text, marginBottom: sc(6) },
  error: { color: obColors.link },
  info: { color: obColors.google },
  submit: { marginTop: sc(10) },
  switchHit: { minHeight: sc(44), alignItems: 'center', justifyContent: 'center' },
  switchText: { color: obColors.link },
});
