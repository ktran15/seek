import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAsset } from '@/assets/registry';
import { config } from '@/config';
import { colors, spacing } from '@/theme';

/** Persistent top bar (spec §5): Add Friends | Notifications. */
export function TopBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.xxs }]}>
      <Image
        source={getAsset('appLogoWordmark')}
        style={styles.brand}
        resizeMode="contain"
        accessibilityLabel={config.appName}
      />
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add friends"
          onPress={() => router.push('/add-friends')}
          style={styles.iconButton}
          hitSlop={4}
        >
          <Ionicons name="person-add-outline" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/notifications')}
          style={styles.iconButton}
          hitSlop={4}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  // Sized to the text it replaced (22/28 "Seek" ≈ 28px tall).
  brand: {
    width: 42,
    height: 28,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
