/**
 * Onboarding-scoped design tokens — a faithful reproduction of the founder's
 * Claude Design prototype (`Seek Onboarding Prototype.dc.html`, 2026-07-22).
 *
 * DELIBERATELY separate from the app's global theme (`src/theme`). The first-run
 * flow (the `(auth)` welcome/email screens + the `(onboarding)` steps) adopts
 * the prototype's new warm "Fraunces + Hanken Grotesk" direction; the rest of
 * the app keeps the current design system until the founder's app-wide overhaul
 * lands. Screens in those two groups consume THESE tokens — never inline hex or
 * font names (CLAUDE.md) — so the look stays swappable from one place.
 *
 * Every value below is lifted verbatim from the prototype's inline styles.
 */
import type { TextStyle } from 'react-native';

/** Colors — exact hex from the prototype. */
export const obColors = {
  /** Screen background (the prototype's phone-screen fill). */
  screen: '#FBF4EA',
  /** Default card / list-row surface (warm tan). */
  surface: '#F1E8DA',
  /** Warm peach card — celebration / snack / "boost". */
  surfacePeach: '#F6DFC9',
  /** Green-tint positive card. */
  surfaceGreen: '#DFE4D2',
  /** Input field fill (near-white). */
  input: '#FEFBF5',

  /** Hairline borders. */
  border: '#E4D8C6',
  borderGreen: '#C4CFB0',
  borderPeach: '#EAC9A6',

  /** Primary near-black warm text. */
  text: '#2C2822',
  /** Secondary / body copy. */
  textMuted: '#6E6659',
  /** Text links + skip affordances (rust). */
  link: '#B4551F',
  /** House-rules italic footnote. */
  note: '#8C8271',
  /** Muted body inside the green / peach care cards. */
  textGreen: '#5C6350',
  textBrown: '#7A5A38',

  /** On-fill text. */
  onPrimary: '#FFFDF9',
  onApple: '#FBF3E6',
  onGoogle: '#FFFFFF',
  /** Pure white — icon glyphs on coloured chips (e.g. the care-loop check). */
  white: '#FFFFFF',

  /** Actions. */
  primary: '#DE6B2F',
  apple: '#1C1A17',
  google: '#2C6ECB',

  /** Accent dots / icon chips. */
  dotOrange: '#DE6B2F',
  dotTan: '#A98A63',
  dotGreen: '#7C8A6B',
  /** "Skip a day" mood dot (muted tan). */
  dotSkip: '#C9B79C',
  /** Inactive progress dot / neutral chip. */
  neutral: '#E4D8C6',

  /** Rival "vs" ring (You) — translucent orange over the screen. */
  youRingFill: 'rgba(210,95,35,.12)',
  youRingBorder: 'rgba(210,95,35,.55)',
  rivalFill: 'rgba(0,0,0,.035)',
  rivalBorder: 'rgba(0,0,0,.2)',
  rivalMark: 'rgba(0,0,0,.32)',
  vs: 'rgba(0,0,0,.4)',
} as const;

/** Font families (loaded in the root layout). */
export const obFonts = {
  serifMedium: 'Fraunces_500Medium',
  serif: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  body: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemi: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
} as const;

/** Corner radii from the prototype. */
export const obRadii = {
  button: 15,
  input: 12,
  card: 16,
  cardLg: 20,
  chip: 13,
  iconSquare: 8,
  pill: 999,
} as const;

/** Named text styles — screens consume these, not raw family/size pairs. */
export const obText = {
  /** Brand "Seek" wordmark (welcome). */
  brand: { fontFamily: obFonts.serif, fontSize: 50, lineHeight: 50, letterSpacing: -1 },
  /** Create-account title. */
  title34: { fontFamily: obFonts.serif, fontSize: 34, lineHeight: 35, letterSpacing: -1 },
  /** Claim your name / Don't miss your shot / Built for doers. */
  title32: { fontFamily: obFonts.serif, fontSize: 32, lineHeight: 33, letterSpacing: -1 },
  /** You need a rival. */
  title30: { fontFamily: obFonts.serif, fontSize: 30, lineHeight: 31, letterSpacing: -1 },
  /** Meet / Name your beaver, Show up. Stay happy. */
  title29: { fontFamily: obFonts.serif, fontSize: 29, lineHeight: 30, letterSpacing: -1 },
  /** The mountain is waiting. */
  title28: { fontFamily: obFonts.serif, fontSize: 28, lineHeight: 29, letterSpacing: -1 },

  /** Body copy (15/1.5). */
  body: { fontFamily: obFonts.body, fontSize: 15, lineHeight: 22 },
  /** Slightly smaller body (14.5 in the prototype → 14). */
  bodySmall: { fontFamily: obFonts.body, fontSize: 14, lineHeight: 21 },

  /** Flat-button label (Fraunces 600, 16). */
  button: { fontFamily: obFonts.serif, fontSize: 16, lineHeight: 20 },
  /** Text link / skip (Hanken 600, 14). */
  link: { fontFamily: obFonts.bodySemi, fontSize: 14, lineHeight: 18 },
  /** Field label (Hanken 600, 13). */
  label: { fontFamily: obFonts.bodySemi, fontSize: 13, lineHeight: 17 },
  /** Input value / placeholder (14). */
  field: { fontFamily: obFonts.body, fontSize: 14, lineHeight: 19 },

  /** Serif card title (e.g. testimonials, invite card, list rows). */
  cardSerif: { fontFamily: obFonts.serif, fontSize: 16, lineHeight: 21 },
  /** Bold micro-heading ("We'll ping you for:"). */
  micro: { fontFamily: obFonts.bodyBold, fontSize: 13, lineHeight: 17 },
  /** Care-card title (Hanken 700, 14). */
  cardTitle: { fontFamily: obFonts.bodyBold, fontSize: 14, lineHeight: 18 },
  /** Care-card body (12.5). */
  cardBody: { fontFamily: obFonts.body, fontSize: 12.5, lineHeight: 18 },
  /** List-row label (Hanken 600, 14). */
  rowLabel: { fontFamily: obFonts.bodySemi, fontSize: 14, lineHeight: 18 },
  /** Attribution / caption. */
  caption: { fontFamily: obFonts.body, fontSize: 12.5, lineHeight: 18 },
  /** House-rules italic footnote. */
  note: { fontFamily: obFonts.body, fontSize: 12.5, lineHeight: 17, fontStyle: 'italic' },
  /** Small centered helper under an image. */
  helper: { fontFamily: obFonts.body, fontSize: 13.5, lineHeight: 20 },
} as const satisfies Record<string, TextStyle>;
