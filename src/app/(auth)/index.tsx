import { StyleSheet, Text, View } from 'react-native';

import { getAsset } from '@/assets/registry';
import { config } from '@/config';
import { colors, spacing, textStyles } from '@/theme';
import { Image } from 'react-native';

/** Welcome / sign-in. Auth methods land in M1 sub-steps 3–4. */
export default function WelcomeScreen() {
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
        <Text style={[textStyles.caption, styles.placeholder]}>
          Sign-in buttons land in the next sub-step.
        </Text>
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
    borderRadius: 16,
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
  placeholder: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
