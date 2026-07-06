/**
 * Typography tokens — SEEK_ART_AND_AESTHETIC_DIRECTION.md §3 (LOCKED).
 * Four roles, disciplined hierarchy. Do not introduce other fonts.
 */
import type { TextStyle } from 'react-native';

/** Font family names as registered by useFonts in the root layout. */
export const fontFamilies = {
  /** Brand/hero display — big and sparing (heavy slab). */
  brand: 'AlfaSlabOne_400Regular',
  /** Functional headers — card titles, buttons, list headings. */
  header: 'Nunito_800ExtraBold',
  headerBlack: 'Nunito_900Black',
  /** Body / UI. */
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  /** Timer — athletic scoreboard moments. */
  timer: 'Archivo_800ExtraBold',
} as const;

/** Named text styles — consume these, not raw fontFamily/size pairs. */
export const textStyles = {
  /** Logo-scale brand moments (loading screen, summit). */
  heroXL: {
    fontFamily: fontFamilies.brand,
    fontSize: 44,
    lineHeight: 52,
  },
  /** Mountain screen title, reward/win banners, major section headers. */
  hero: {
    fontFamily: fontFamilies.brand,
    fontSize: 30,
    lineHeight: 38,
  },
  headerL: {
    fontFamily: fontFamilies.headerBlack,
    fontSize: 24,
    lineHeight: 30,
  },
  header: {
    fontFamily: fontFamilies.header,
    fontSize: 19,
    lineHeight: 24,
  },
  headerS: {
    fontFamily: fontFamilies.header,
    fontSize: 16,
    lineHeight: 20,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyEmphasis: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 19,
  },
  caption: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  /** 3D-press button label (aesthetic §4: Nunito Black). */
  button: {
    fontFamily: fontFamilies.headerBlack,
    fontSize: 18,
    lineHeight: 24,
  },
  /**
   * The challenge clock (spec §7.5) — chunky, athletic, big on-camera.
   * Tabular numerals so the running countdown doesn't jitter (LOCKED).
   */
  timer: {
    fontFamily: fontFamilies.timer,
    fontSize: 64,
    lineHeight: 72,
    fontVariant: ['tabular-nums'],
  },
  /** Smaller tabular clock (e.g. the pinned day-3 vote countdown). */
  timerS: {
    fontFamily: fontFamilies.timer,
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
} as const satisfies Record<string, TextStyle>;
