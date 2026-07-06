/**
 * Spacing, radii, elevation, hit targets, z-layers —
 * SEEK_ART_AND_AESTHETIC_DIRECTION.md §4 (LOCKED).
 */
import type { ViewStyle } from 'react-native';

import { colors } from './colors';

/** 4pt-base spacing scale. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  /** Cards and surfaces — the locked 16px. */
  card: 16,
  /** Small elements (chips, thumbnails). */
  sm: 8,
  /** Chunky rounded buttons (pill / near-pill). */
  pill: 999,
} as const;

/** Accessibility: minimum tappable size (spec §2.1: ≥44pt). */
export const hitTarget = { minHeight: 44, minWidth: 44 } as const;

/**
 * Tactile-but-restrained shadows: soft, present, never heavy (aesthetic §4).
 * No gradients, no glow.
 */
export const elevation = {
  /** Cards, list items. */
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  /** Liftable objects — crates, buttons, hero cards. */
  raised: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
} as const satisfies Record<string, ViewStyle>;

export const zLayers = {
  base: 0,
  raised: 10,
  overlay: 100,
  modal: 1000,
  toast: 2000,
} as const;
