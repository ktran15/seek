import { StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, spacing, textStyles } from '@/theme';

/** Home tab — 3-feed swipe lands in M2 sub-step 2. */
export default function HomeScreen() {
  return (
    <ErrorBoundary screen="Home">
      <View style={styles.container}>
        <Text style={[textStyles.headerL, styles.title]}>Home</Text>
        <Text style={[textStyles.body, styles.copy]}>
          Friends / FoF / Explore feeds land next sub-step.
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
