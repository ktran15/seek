import { router } from 'expo-router';

/**
 * Ordered onboarding flow (spec §5, post-pivot). Visual-first: the beaver
 * beats (meet → name → customize → care loop) replace the old text-heavy
 * "what Seek is" + hiker-avatar screens.
 *
 * `username` is prepended to the spec's list — profiles need an identity
 * before anything social can work.
 */
export const ONBOARDING_STEPS = [
  'username',
  'notifications',
  'social-proof',
  'meet',
  'name',
  'customize',
  'care-loop',
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
