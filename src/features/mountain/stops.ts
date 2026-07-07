/**
 * Data-driven stop layout (spec §8): 7 stops zig-zagging up the trail.
 * Coordinates are fractions of the mountain container (x: 0..1 left→right,
 * y: 0..1 top→bottom), so the layout scales with any screen — code owns
 * positioning, art owns the look.
 */
export interface StopPosition {
  day: number;
  x: number;
  y: number;
}

export const STOP_POSITIONS: StopPosition[] = [
  { day: 1, x: 0.5, y: 0.88 },
  { day: 2, x: 0.26, y: 0.76 },
  { day: 3, x: 0.62, y: 0.64 },
  { day: 4, x: 0.34, y: 0.52 },
  { day: 5, x: 0.66, y: 0.4 },
  { day: 6, x: 0.42, y: 0.28 },
  { day: 7, x: 0.5, y: 0.13 },
];

/** Start flag at the base of the trail. */
export const START_FLAG_POSITION = { x: 0.68, y: 0.94 };

export type StopState = 'completed' | 'current' | 'locked' | 'missed';
