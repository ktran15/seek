import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, textStyles } from '@/theme';

/** Placeholder — the real onboarding sequence lands in M1 sub-steps 5–7. */
export default function OnboardingPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.headerL, styles.text]}>Onboarding</Text>
      <Text style={[textStyles.body, styles.text]}>
        Steps land in the next sub-steps.
      </Text>
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
    gap: spacing.sm,
  },
  text: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
