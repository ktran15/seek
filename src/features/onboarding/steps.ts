import { router } from 'expo-router';

/**
 * Ordered onboarding flow (spec §5, with a username/profile step prepended —
 * profiles need identity before anything social).
 */
export const ONBOARDING_STEPS = [
  'username',
  'notifications',
  'social-proof',
  'about',
  'avatar',
  'invite',
  'begin',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

/** Advance to the next step (or no-op on the last — Begin completes instead). */
export function goToNextStep(current: OnboardingStep): void {
  const next = ONBOARDING_STEPS[stepIndex(current) + 1];
  if (next) {
    router.push(`/(onboarding)/${next}`);
  }
}
