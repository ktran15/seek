import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { useDeleteAccount } from '@/features/auth/useDeleteAccount';
import { unregisterPushToken } from '@/features/push/registerPush';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, textStyles } from '@/theme';

/** Legal documents (spec §12) — hosted pages opened in the in-app browser. */
const LEGAL_ROWS: { label: string; url: string }[] = [
  { label: 'Privacy Policy', url: config.legal.privacyPolicyUrl },
  { label: 'Terms', url: config.legal.termsUrl },
];

const openLegalPage = async (url: string) => {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Alert.alert('Couldn’t open the page', 'Check your connection and try again.');
  }
};

export default function SettingsScreen() {
  const [busy, setBusy] = useState(false);
  const deleteAccount = useDeleteAccount();

  const signOut = async () => {
    setBusy(true);
    // Deregister this device first — the RLS delete needs the live session.
    await unregisterPushToken();
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) Alert.alert('Sign out failed', error.message);
  };

  // Apple-required deletion (spec §12): double destructive confirm, then the
  // server cascade; the root guard lands on Auth once the session clears.
  const onDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'Your profile, posts, comments, coins, crates, and cosmetics are permanently deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Last check — this is permanent',
              'There is no way to recover a deleted account.',
              [
                { text: 'Keep my account', style: 'cancel' },
                {
                  text: 'Delete forever',
                  style: 'destructive',
                  onPress: () =>
                    deleteAccount.mutate(undefined, {
                      onError: (e) =>
                        Alert.alert(
                          'Deletion failed',
                          e instanceof Error
                            ? e.message
                            : 'Your account is still active. Try again.',
                        ),
                    }),
                },
              ],
            ),
        },
      ],
    );
  };

  return (
    <ErrorBoundary screen="Settings">
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Text style={[textStyles.headerL, styles.title]}>Settings</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/edit-avatar')}
          style={styles.row}
        >
          <Text style={[textStyles.bodyEmphasis, styles.rowLabel]}>
            Edit avatar base
          </Text>
          <Text style={[textStyles.caption, styles.rowBadge]}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/blocked-users')}
          style={styles.row}
        >
          <Text style={[textStyles.bodyEmphasis, styles.rowLabel]}>
            Blocked users
          </Text>
          <Text style={[textStyles.caption, styles.rowBadge]}>›</Text>
        </Pressable>

        {LEGAL_ROWS.map((row) => (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            onPress={() => void openLegalPage(row.url)}
            style={styles.row}
          >
            <Text style={[textStyles.bodyEmphasis, styles.rowLabel]}>
              {row.label}
            </Text>
            <Text style={[textStyles.caption, styles.rowBadge]}>›</Text>
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={onDeleteAccount}
          disabled={deleteAccount.isPending}
          style={styles.row}
        >
          <Text style={[textStyles.bodyEmphasis, styles.rowLabelDanger]}>
            {deleteAccount.isPending ? 'Deleting account…' : 'Delete account'}
          </Text>
          <Text style={[textStyles.caption, styles.rowBadge]}>›</Text>
        </Pressable>

        <View style={styles.footer}>
          <PressButton
            label="SIGN OUT"
            variant="info"
            onPress={signOut}
            disabled={busy || deleteAccount.isPending}
          />
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
  },
  rowLabel: {
    color: colors.textPrimary,
  },
  rowLabelDanger: {
    color: colors.danger,
  },
  rowBadge: {
    color: colors.textSecondary,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
