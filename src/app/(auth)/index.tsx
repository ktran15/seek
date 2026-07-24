import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroImage } from '@/features/onboarding/components/HeroImage';
import { OnboardingButton } from '@/features/onboarding/components/OnboardingButton';
import { obColors, obRadii, obText, sc } from '@/features/onboarding/theme';
import {
  AuthCancelled,
  signInWithApple,
  signInWithGoogle,
} from '@/features/auth/socialAuth';

/** Welcome (prototype screen 1) — sunrise hero, brand, and the three sign-in
 *  paths. Backend auth is unchanged; only the presentation is the new look. */
export default function WelcomeScreen() {
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  const runSocial = async (method: () => Promise<void>) => {
    setBusy(true);
    try {
      await method();
      // Session change flips the root guard into onboarding.
    } catch (e) {
      if (!(e instanceof AuthCancelled)) {
        Alert.alert(
          'Sign-in failed',
          e instanceof Error ? e.message : 'Something went wrong. Try again.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <HeroImage
        slot="onboardingIntro"
        // Focus low on the square so the sun + beaver + mountains fill the strip
        // and the empty top sky is what's trimmed.
        focusY={0.62}
        accessibilityLabel="A beaver watching the sunrise over the mountains"
      />

      <View style={[styles.content, { paddingBottom: insets.bottom + sc(26) }]}>
        <View>
          <Text style={[obText.brand, styles.brand]}>Seek</Text>
          <Text style={[obText.body, styles.tagline]}>Do hard things. Together.</Text>
        </View>

        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={obRadii.button}
              style={styles.appleButton}
              onPress={() => runSocial(signInWithApple)}
            />
          )}
          <OnboardingButton
            label="Continue with Google"
            variant="google"
            disabled={busy}
            onPress={() => runSocial(signInWithGoogle)}
          />
          <OnboardingButton
            label="Continue with email"
            disabled={busy}
            onPress={() => router.push('/(auth)/email')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: obColors.screen },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: sc(24),
    paddingTop: sc(22),
    gap: sc(20),
  },
  brand: { color: obColors.text },
  tagline: { color: obColors.textMuted, marginTop: sc(6) },
  buttons: { gap: sc(10) },
  appleButton: { height: sc(52) },
});
