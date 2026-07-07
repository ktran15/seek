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
import { AppProviders } from '@/providers/AppProviders';
import { colors, fontFamilies } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading: sessionLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile(
    session?.user.id,
  );

  const ready = !sessionLoading && (!session || !profileLoading);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  const signedIn = !!session;
  const onboarded = signedIn && isOnboarded(profile);

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
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="challenge-flow/[day]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="vote" options={{ headerShown: true, title: 'Community Vote' }} />
      </Stack.Protected>
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
