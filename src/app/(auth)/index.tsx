import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, View } from 'react-native';

import { getAsset } from '@/assets/registry';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import {
  AuthCancelled,
  signInWithApple,
  signInWithGoogle,
} from '@/features/auth/socialAuth';
import { colors, radii, spacing, textStyles } from '@/theme';

export default function WelcomeScreen() {
  const [busy, setBusy] = useState(false);

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
    <View style={styles.container}>
      <Image
        source={getAsset('appLogo')}
        style={styles.logo}
        accessibilityLabel={`${config.appName} logo placeholder`}
      />
      <Text style={[textStyles.heroXL, styles.title]}>{config.appName}</Text>
      <Text style={[textStyles.body, styles.tagline]}>
        Do hard things. Together.
      </Text>

      <View style={styles.buttons}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radii.pill}
            style={styles.appleButton}
            onPress={() => runSocial(signInWithApple)}
          />
        )}
        <PressButton
          label="CONTINUE WITH GOOGLE"
          variant="info"
          disabled={busy}
          onPress={() => runSocial(signInWithGoogle)}
        />
        <PressButton
          label="CONTINUE WITH EMAIL"
          disabled={busy}
          onPress={() => router.push('/(auth)/email')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radii.card,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
  },
  tagline: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  buttons: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  appleButton: {
    height: 52,
  },
});
