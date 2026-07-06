import { StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, spacing, textStyles } from '@/theme';

/** Profile tab — header/tabs skeleton + swipe→Shop land in M2 sub-step 4. */
export default function ProfileScreen() {
  return (
    <ErrorBoundary screen="Profile">
      <View style={styles.container}>
        <Text style={[textStyles.headerL, styles.title]}>Profile</Text>
        <Text style={[textStyles.body, styles.copy]}>
          Profile skeleton lands in sub-step 4.
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
