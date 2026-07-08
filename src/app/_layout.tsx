import { AlfaSlabOne_400Regular } from '@expo-google-fonts/alfa-slab-one';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/useSession';
import { isOnboarded, useProfile } from '@/features/profile/useProfile';
import { useLocalNotificationSync } from '@/features/push/useLocalNotificationSync';
import { usePushNotifications } from '@/features/push/usePushNotifications';
import { AppProviders } from '@/providers/AppProviders';
import { colors, fontFamilies, radii } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** Comment sheet presentation (M6.1): partial-height over the feed — the
 *  post stays visible (dimmed) above and shows more as the sheet is dragged
 *  down. Every detent is dimmed (no sheetLargestUndimmedDetentIndex): UIKit's
 *  dim scrim is what makes TAP-OUTSIDE dismiss the sheet with the native
 *  slide-down (founder polish fix 1) — an undimmed backdrop passes taps to
 *  the feed instead. Shared with the dev preview route so geometry can't
 *  drift. */
const commentSheetOptions = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [0.6, 0.95],
  sheetInitialDetentIndex: 0,
  sheetGrabberVisible: true,
  sheetCornerRadius: radii.card,
};

function RootNavigator() {
  const { session, isLoading: sessionLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile(
    session?.user.id,
  );

  const ready = !sessionLoading && (!session || !profileLoading);
  const signedIn = !!session;
  const onboarded = signedIn && isOnboarded(profile);

  // Token registration + notification-tap routing (M11, spec §13).
  usePushNotifications(session?.user.id, ready && onboarded);
  // Local schedule: daily live, evening reminder, invite nudge (M11).
  useLocalNotificationSync(onboarded ? session?.user.id : undefined);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: fontFamilies.header },
        headerShadowVisible: false,
      }}
    >
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(main)" />
        <Stack.Screen name="add-friends" options={{ headerShown: true, title: 'Add Friends' }} />
        <Stack.Screen name="friends" options={{ headerShown: true, title: 'Friends' }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: true, title: 'Profile' }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="blocked-users" options={{ headerShown: true, title: 'Blocked Users' }} />
        <Stack.Screen name="edit-avatar" options={{ headerShown: true, title: 'Edit Avatar' }} />
        {/* Swipe-back is allowed pre-arm; the screen itself flips
            gestureEnabled off from capture onward (spec §7.4). */}
        <Stack.Screen name="challenge-flow/[day]" options={{ gestureEnabled: true }} />
        <Stack.Screen name="vote" options={{ headerShown: true, title: 'Community Vote' }} />
        <Stack.Screen name="comments/[postId]" options={commentSheetOptions} />
      </Stack.Protected>

      {/* Dev-only sheet preview (mock data, no auth) — the route itself
          redirects away in release builds. */}
      {__DEV__ && (
        <Stack.Screen name="dev/comment-sheet-preview" options={commentSheetOptions} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AlfaSlabOne_400Regular,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Archivo_800ExtraBold,
  });

  // Wait for fonts (or a font failure — then render with system fonts rather
  // than blocking forever). The splash stays up via RootNavigator readiness.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
