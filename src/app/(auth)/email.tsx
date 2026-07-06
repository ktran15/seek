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

import { FormTextInput } from '@/components/ui/FormTextInput';
import { PressButton } from '@/components/ui/PressButton';
import { supabase } from '@/lib/supabase';
import { colors, spacing, textStyles } from '@/theme';

type Mode = 'signIn' | 'signUp';

export default function EmailAuthScreen() {
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
          // Email confirmation is enabled in the Supabase project.
          setInfo('Check your email for a confirmation link, then sign in.');
        }
        // With a session, the root guard moves us into onboarding.
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[textStyles.hero, styles.title]}>
          {mode === 'signUp' ? 'Create account' : 'Welcome back'}
        </Text>

        <FormTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <FormTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
          placeholder="At least 8 characters"
        />

        {!!error && <Text style={[textStyles.bodySmall, styles.error]}>{error}</Text>}
        {!!info && <Text style={[textStyles.bodySmall, styles.info]}>{info}</Text>}

        <PressButton
          label={mode === 'signUp' ? 'SIGN UP' : 'SIGN IN'}
          onPress={submit}
          disabled={busy}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMode(mode === 'signUp' ? 'signIn' : 'signUp');
            setError(null);
            setInfo(null);
          }}
          style={styles.switchMode}
        >
          <Text style={[textStyles.bodyEmphasis, styles.link]}>
            {mode === 'signUp'
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={[textStyles.bodySmall, styles.backText]}>← Back</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
  info: {
    color: colors.info,
  },
  switchMode: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    color: colors.info,
  },
  back: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.textSecondary,
  },
});
