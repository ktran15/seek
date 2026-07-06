/**
 * Motion tokens — SEEK_ART_AND_AESTHETIC_DIRECTION.md §8.
 * Calm/subtle in the resting world; energetic bursts at the reward peaks.
 * All expressive animations must check `useReducedMotion()` (Reanimated) and
 * fall back to the calm variant.
 */

/** Durations in ms. */
export const durations = {
  /** Micro-interactions: button press, toggles. */
  press: 90,
  /** Everyday transitions — quick and unobtrusive. */
  base: 200,
  /** Screen-level transitions. */
  screen: 300,
  /** Celebration peaks: crate open, climb, win. */
  celebrate: 700,
} as const;

/** Cubic-bezier control points (usable with Reanimated Easing.bezier). */
export const easings = {
  /** Standard ease-out for entrances/everyday movement. */
  standard: [0.2, 0, 0, 1],
  /** Accelerate out for exits. */
  exit: [0.4, 0, 1, 1],
  /** Playful overshoot for celebration moments. */
  bounce: [0.34, 1.56, 0.64, 1],
} as const;
