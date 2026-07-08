import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PressButton } from '@/components/ui/PressButton';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, textStyles } from '@/theme';

interface StubRow {
  label: string;
  lands: string;
}

/** Settings rows per spec §5; every remaining stub is labeled with its milestone. */
const STUB_ROWS: StubRow[] = [
  { label: 'Privacy Policy', lands: 'M10' },
  { label: 'Terms', lands: 'M10' },
  { label: 'Delete account', lands: 'M10' },
];

export default function SettingsScreen() {
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) Alert.alert('Sign out failed', error.message);
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

        {STUB_ROWS.map((row) => (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(row.label, `This lands in milestone ${row.lands}.`)
            }
            style={styles.row}
          >
            <Text style={[textStyles.bodyEmphasis, styles.rowLabel]}>
              {row.label}
            </Text>
            <Text style={[textStyles.caption, styles.rowBadge]}>{row.lands}</Text>
          </Pressable>
        ))}

        <View style={styles.footer}>
          <PressButton
            label="SIGN OUT"
            variant="info"
            onPress={signOut}
            disabled={busy}
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
  rowBadge: {
    color: colors.textSecondary,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
