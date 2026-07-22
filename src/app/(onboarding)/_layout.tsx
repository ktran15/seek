import { Stack } from 'expo-router';

import { obColors } from '@/features/onboarding/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Onboarding adopts the prototype's warm screen fill.
        contentStyle: { backgroundColor: obColors.screen },
        // Horizontal slide echoes the prototype's swipe track; forward-only
        // (the flow writes profile state as it advances — no swipe-back).
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    />
  );
}
