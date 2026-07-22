/**
 * Onboarding-scoped design tokens — a faithful, 1:1 reproduction of the
 * founder's Claude Design prototype (`Seek Onboarding Prototype.dc.html`).
 *
 * DELIBERATELY separate from the app's global theme (`src/theme`). The first-run
 * flow (the `(auth)` welcome/email screens + the `(onboarding)` steps) adopts
 * the prototype's new warm "Fraunces + Hanken Grotesk" direction; the rest of
 * the app keeps the current design system until the founder's app-wide overhaul.
 * Screens in those two groups consume THESE tokens — never inline hex or font
 * names (CLAUDE.md).
 *
 * ── Exact-match scaling ──────────────────────────────────────────────────────
 * The prototype is authored on a fixed **300 px-wide** phone mock, with every
 * dimension in absolute px. To reproduce that composition *exactly* on a real
 * phone — and identically across every phone size — each px is scaled by
 * `deviceWidth / 300` (the mock's aspect ≈ a modern phone's, so vertical
 * proportions follow too). Wrap EVERY prototype px in `sc()`; colours/fonts are
 * size-independent.
 */
import { Dimensions } from 'react-native';
import type { TextStyle } from 'react-native';

/** Width the prototype's px values are authored against (the DC phone mock). */
const BASE_WIDTH = 300;
/** Device width ÷ base. Clamped so tablets/wide web don't explode; every phone
 *  (SE 320 → Pro Max 430) lands well under the cap. */
export const obScale = Math.min(Dimensions.get('window').width / BASE_WIDTH, 1.6);
/** Scale one prototype px to this device. */
export const sc = (n: number): number => n * obScale;

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
  /** Stronger border for light swatches/chips that would vanish on cream. */
  borderStrong: '#C9B79C',

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

/** Corner radii from the prototype (scaled). */
export const obRadii = {
  button: sc(15),
  input: sc(12),
  card: sc(16),
  cardLg: sc(20),
  chip: sc(13),
  iconSquare: sc(8),
  pill: 999,
} as const;

/** Named text styles — screens consume these, not raw family/size pairs.
 *  Sizes/line-heights/letter-spacing are the prototype's values, scaled. */
export const obText = {
  /** Brand "Seek" wordmark (welcome). */
  brand: { fontFamily: obFonts.serif, fontSize: sc(50), lineHeight: sc(50), letterSpacing: sc(-1) },
  /** Create-account title. */
  title34: { fontFamily: obFonts.serif, fontSize: sc(34), lineHeight: sc(35), letterSpacing: sc(-1) },
  /** Claim your name / Don't miss your shot / Built for doers. */
  title32: { fontFamily: obFonts.serif, fontSize: sc(32), lineHeight: sc(33), letterSpacing: sc(-1) },
  /** You need a rival. */
  title30: { fontFamily: obFonts.serif, fontSize: sc(30), lineHeight: sc(31), letterSpacing: sc(-1) },
  /** Meet / Name your beaver, Show up. Stay happy. */
  title29: { fontFamily: obFonts.serif, fontSize: sc(29), lineHeight: sc(30), letterSpacing: sc(-1) },
  /** The mountain is waiting. */
  title28: { fontFamily: obFonts.serif, fontSize: sc(28), lineHeight: sc(29), letterSpacing: sc(-1) },

  /** Body copy (15/1.5). */
  body: { fontFamily: obFonts.body, fontSize: sc(15), lineHeight: sc(22) },
  /** Slightly smaller body (14.5 in the prototype). */
  bodySmall: { fontFamily: obFonts.body, fontSize: sc(14), lineHeight: sc(21) },

  /** Flat-button label (Fraunces 600, 16). */
  button: { fontFamily: obFonts.serif, fontSize: sc(16), lineHeight: sc(20) },
  /** Text link / skip (Hanken 600, 14). */
  link: { fontFamily: obFonts.bodySemi, fontSize: sc(14), lineHeight: sc(18) },
  /** Field label (Hanken 600, 13). */
  label: { fontFamily: obFonts.bodySemi, fontSize: sc(13), lineHeight: sc(17) },
  /** Input value / placeholder (14). */
  field: { fontFamily: obFonts.body, fontSize: sc(14), lineHeight: sc(19) },

  /** Serif card title (testimonials, invite card, list rows). */
  cardSerif: { fontFamily: obFonts.serif, fontSize: sc(16), lineHeight: sc(21) },
  /** Bold micro-heading ("We'll ping you for:"). */
  micro: { fontFamily: obFonts.bodyBold, fontSize: sc(13), lineHeight: sc(17) },
  /** Care-card title (Hanken 700, 14). */
  cardTitle: { fontFamily: obFonts.bodyBold, fontSize: sc(14), lineHeight: sc(18) },
  /** Care-card body (12.5). */
  cardBody: { fontFamily: obFonts.body, fontSize: sc(12.5), lineHeight: sc(18) },
  /** List-row label (Hanken 600, 14). */
  rowLabel: { fontFamily: obFonts.bodySemi, fontSize: sc(14), lineHeight: sc(18) },
  /** Attribution / caption. */
  caption: { fontFamily: obFonts.body, fontSize: sc(12.5), lineHeight: sc(18) },
  /** House-rules italic footnote. */
  note: { fontFamily: obFonts.body, fontSize: sc(12.5), lineHeight: sc(17), fontStyle: 'italic' },
  /** Small centered helper under an image. */
  helper: { fontFamily: obFonts.body, fontSize: sc(13.5), lineHeight: sc(20) },
} as const satisfies Record<string, TextStyle>;
