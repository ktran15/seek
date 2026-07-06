import { Alert, StyleSheet, Text, View } from 'react-native';

import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { useProfile } from '@/features/profile/useProfile';
import { supabase } from '@/lib/supabase';
import { colors, spacing, textStyles } from '@/theme';

/** Post-onboarding home placeholder — the real Main App shell is M2. */
export default function HomeScreen() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign out failed', error.message);
  };

  return (
    <View style={styles.container}>
      <Text style={[textStyles.hero, styles.title]}>{config.appName}</Text>
      <Text style={[textStyles.body, styles.subtitle]}>
        Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}! The
        main app (navigation, feeds, mountain) is built in M2+.
      </Text>
      <PressButton label="SIGN OUT" variant="info" onPress={signOut} style={styles.button} />
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
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
