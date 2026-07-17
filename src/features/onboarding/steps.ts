import { router, type Href } from 'expo-router';

/**
 * Ordered onboarding flow (spec §5 — the visual-first beaver rework).
 *
 * A `username`/display-name identity step is prepended (profiles need a handle
 * before anything social — leaderboards, @-search, friend requests). The eight
 * steps after it are the spec §5 order:
 *   Enable Notifications → Why we're great → Meet your beaver →
 *   Name your beaver → Customize your beaver → Care-loop explainer →
 *   Invite → Hook/Begin.
 */
export const ONBOARDING_STEPS = [
  'username',
  'notifications',
  'social-proof',
  'meet-beaver',
  'name-beaver',
  'customize-beaver',
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
