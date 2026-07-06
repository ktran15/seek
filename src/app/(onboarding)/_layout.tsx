import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Onboarding is a forward-moving flow; no swipe-back past auth.
        gestureEnabled: false,
      }}
    />
  );
}
