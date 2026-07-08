import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AvatarPreview } from '@/features/avatar/AvatarPreview';
import { useCosmeticsCatalog } from '@/features/economy/useEconomy';
import { useProfile } from '@/features/profile/useProfile';
import { colors, spacing, textStyles } from '@/theme';

/**
 * Another user's profile — the navigation target for friends-list rows
 * (founder-directed, pre-M12). Deliberately minimal: full-look avatar +
 * names, the profile data every authenticated user can already read. Stats/
 * inventory stay private to their owner (their queries are RLS-scoped to
 * auth.uid()); expanding this surface is a founder call, not a default.
 */
export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = typeof id === 'string' ? id : undefined;
  const { data: profile, isLoading } = useProfile(userId);
  const { data: catalog } = useCosmeticsCatalog();

  return (
    <ErrorBoundary screen="UserProfile">
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {isLoading ? (
          <ActivityIndicator color={colors.textSecondary} />
        ) : !profile ? (
          <>
            <Text style={[textStyles.headerL, styles.title]}>
              This climber is gone
            </Text>
            <Text style={[textStyles.body, styles.copy]}>
              The account may have been deleted.
            </Text>
          </>
        ) : (
          <>
            <AvatarPreview
              config={profile.avatar_config ?? {}}
              cosmetics={catalog ?? []}
            />
            <Text style={[textStyles.headerL, styles.title]}>
              {profile.display_name ?? '—'}
            </Text>
            <Text style={[textStyles.body, styles.copy]}>
              @{profile.username ?? '—'}
            </Text>
          </>
        )}
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  title: {
    color: colors.textPrimary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  copy: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
