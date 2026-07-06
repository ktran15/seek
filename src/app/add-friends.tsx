import { StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, spacing, textStyles } from '@/theme';

/** Stub — username search + requests + invite entry point land in M3. */
export default function AddFriendsScreen() {
  return (
    <ErrorBoundary screen="Add Friends">
      <View style={styles.container}>
        <Text style={[textStyles.headerL, styles.title]}>Add Friends</Text>
        <Text style={[textStyles.body, styles.copy]}>
          Username search and friend requests land in M3. The invite-a-friend
          entry point lives here too.
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
