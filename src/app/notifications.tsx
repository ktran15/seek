import { StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, spacing, textStyles } from '@/theme';

/** Stub — friend requests + H2H/vote results land in M3/M5. */
export default function NotificationsScreen() {
  return (
    <ErrorBoundary screen="Notifications">
      <View style={styles.container}>
        <Text style={[textStyles.headerL, styles.title]}>Notifications</Text>
        <Text style={[textStyles.body, styles.copy]}>
          Friend requests (M3) and challenge results (M5) show up here.
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
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { color: colors.textPrimary },
  copy: { color: colors.textSecondary, textAlign: 'center' },
});
