// Type-only import; the package ships as expo-router's own tabs dependency.
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProfileView } from '@/features/profile/ProfileView';
import { ShopView } from '@/features/shop/ShopView';
import { colors, radii, spacing, textStyles } from '@/theme';

/**
 * Profile tab (spec §5, §9.5): swipe left → Shop, with a translucent "Shop"
 * hint pinned at the right edge of the profile page.
 */
export default function ProfileScreen() {
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  const pagerRef = useRef<PagerView>(null);
  // Typed as the tab navigator's prop so the 'tabPress' event exists.
  const navigation =
    useNavigation<BottomTabNavigationProp<Record<string, object | undefined>>>();

  // Tapping the Profile tab while the pager shows the Shop returns to the
  // Profile page (founder-reported: the already-focused tab press was a
  // no-op, stranding the user on the Shop unless they swiped back).
  useEffect(() => {
    return navigation.addListener('tabPress', () => {
      if (pageRef.current !== 0) pagerRef.current?.setPage(0);
    });
  }, [navigation]);

  return (
    <ErrorBoundary screen="Profile">
      <View style={styles.container}>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => {
            pageRef.current = e.nativeEvent.position;
            setPage(e.nativeEvent.position);
          }}
        >
          <View key="profile" style={styles.page}>
            <ProfileView />
          </View>
          <View key="shop" style={styles.page}>
            <ShopView />
          </View>
        </PagerView>
        {page === 0 && (
          <View style={styles.shopHint} pointerEvents="none">
            <Text style={[textStyles.headerS, styles.shopHintText]}>
              Shop ›
            </Text>
          </View>
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  // Right-edge band beside the avatar (fixed 200pt preview): below the
  // +Invite column, above the name block — open at every screen size
  // because everything above the name has token/constant heights.
  shopHint: {
    position: 'absolute',
    right: 0,
    top: 160,
    backgroundColor: colors.info,
    opacity: 0.55,
    borderTopLeftRadius: radii.card,
    borderBottomLeftRadius: radii.card,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
  },
  shopHintText: {
    color: colors.textOnDark,
  },
});
