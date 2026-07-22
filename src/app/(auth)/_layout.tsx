import { Stack } from 'expo-router';

import { obColors } from '@/features/onboarding/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // First-run screens adopt the onboarding prototype's warm fill.
        contentStyle: { backgroundColor: obColors.screen },
        animation: 'slide_from_right',
      }}
    />
  );
}
