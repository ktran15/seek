import { StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, spacing, textStyles } from '@/theme';

/** Challenge tab — Mountain ↔ Leaderboard swipe lands in M2 sub-step 3. */
export default function ChallengeScreen() {
  return (
    <ErrorBoundary screen="Challenge">
      <View style={styles.container}>
        <Text style={[textStyles.headerL, styles.title]}>Challenge</Text>
        <Text style={[textStyles.body, styles.copy]}>
          Mountain and Leaderboard land next sub-steps.
        </Text>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { color: colors.textPrimary },
  copy: { color: colors.textSecondary, textAlign: 'center' },
});
