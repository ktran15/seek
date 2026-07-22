import { router, type Href } from 'expo-router';

/**
 * Ordered onboarding flow — the founder's Claude Design prototype
 * (`Seek Onboarding Prototype.dc.html`, 2026-07-22). Eight dot-tracked steps
 * after auth:
 *   Claim your name → Don't miss your shot (notifications) → Built for doers
 *   (social proof) → Meet your beaver → Name your beaver → Show up. Stay happy.
 *   (care loop) → You need a rival (invite) → The mountain is waiting (begin).
 *
 * The prototype drops the standalone "Customize your beaver" step; sex/body
 * colour stays editable later in Settings → Edit beaver.
 */
export const ONBOARDING_STEPS = [
  'username',
  'notifications',
  'social-proof',
  'meet-beaver',
  'name-beaver',
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
    // Dynamically-built route (validated by ONBOARDING_STEPS); cast like the
    // app's other dynamic pushes since typed-routes can't infer the template.
    router.push(`/(onboarding)/${next}` as Href);
  }
}
