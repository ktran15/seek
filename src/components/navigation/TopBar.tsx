import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAsset } from '@/assets/registry';
import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { useMyNotifications } from '@/features/h2h/useH2H';
import { colors, spacing, textStyles } from '@/theme';

/** Persistent top bar (spec §5): Add Friends | Notifications. */
export function TopBar() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { data: notifications } = useMyNotifications(session?.user.id);
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.xxs }]}>
      <Image
        source={getAsset('appLogoWide')}
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
          accessibilityLabel={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          onPress={() => router.push('/notifications')}
          style={styles.iconButton}
          hitSlop={4}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={[textStyles.caption, styles.badgeCount]}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
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
  // Wide lockup (aspect 2.32): at 34px tall the letters read ~22px — larger
  // than the old 22pt text — without growing the bar (icons are 44px).
  brand: {
    width: 79,
    height: 34,
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
  // Anchored to the bell glyph (24px, centered in the 44px button), not the
  // button corner, so the dot reads as attached to the bell.
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeCount: {
    color: colors.textOnPrimary,
    lineHeight: 14,
  },
});
