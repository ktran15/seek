import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { getAsset } from '@/assets/registry';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * M0 boot screen — proves the themed shell end-to-end: tokens, fonts,
 * the 3D-press button, and config. Replaced by the real Loading→Auth
 * flow in M1.
 */
export default function BootScreen() {
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

      <Text style={[textStyles.timer, styles.timer]}>0:42</Text>

      <PressButton
        label="BEGIN"
        onPress={() => Alert.alert(config.appName, 'M0 themed shell is alive.')}
        style={styles.button}
      />
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
  timer: {
    marginTop: spacing.xl,
    color: colors.textPrimary,
  },
  button: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
