/**
 * Color tokens — exact values from SEEK_ART_AND_AESTHETIC_DIRECTION.md §2 (LOCKED).
 * Light mode only for v1.
 *
 * Discipline rule: screens consume role tokens (`colors.*`), never `palette.*`
 * directly. The palette provides range; roles keep the app coherent.
 */

/** Raw palette — do not import from screens. */
export const palette = {
  cream: '#F5ECE3',
  jungleGreen: '#233837',
  rifleGreen: '#3D4625',
  russianGreen: '#779F6F',
  shelduckBlue: '#B5D7CC',
  darkSienna: '#401D15',
  cadmiumOrange: '#EC8340',
  vermillon: '#D45735',
  indianYellow: '#ECA945',
  biceBlue: '#2774B4',
  chestnut: '#A44F3C',
  white: '#FFFFFF',
} as const;

/** Role tokens — what screens actually use. Semantic logic (aesthetic §2):
 *  warm = act/reward/win · cool blue = info/navigate · greens = the calm world
 *  · yellow = celebrate/currency. */
export const colors = {
  /** Primary app background. */
  background: palette.cream,
  /** Subtly earth-tinted surface on cream — never stark white (aesthetic §4). */
  surface: '#EFE4D7',
  /** Stronger tinted surface for grouped/secondary areas. */
  surfaceSecondary: palette.shelduckBlue,
  /** Natural mid-tone surface (calm world accents). */
  surfaceNature: palette.russianGreen,

  textPrimary: palette.jungleGreen,
  textSecondary: palette.rifleGreen,
  /** Text/icons on top of primary (orange) fills. */
  textOnPrimary: palette.white,
  /** Text/icons on dark green grounding surfaces. */
  textOnDark: palette.cream,

  /** Primary CTA / action / win — the most-tapped color. */
  primary: palette.cadmiumOrange,
  /** Pressed state + the 3D button's bottom lip. */
  primaryPressed: palette.vermillon,
  /** Celebration, coins, highlights. */
  celebration: palette.indianYellow,
  /** Info, secondary actions, links, navigation. */
  info: palette.biceBlue,
  /** Pressed state / bottom lip for info-colored 3D buttons. */
  infoPressed: '#1E5A8C',
  /** Variety accent — use sparingly. */
  accent: palette.chestnut,
  /** Deep shadow / accent. */
  shadow: palette.darkSienna,

  /** Errors/destructive — warm, in-palette (no new reds). */
  danger: palette.vermillon,

  /** Rarity ladder (gacha) — echoes crate colors (aesthetic §2). */
  rarity: {
    common: palette.russianGreen,
    rare: palette.biceBlue,
    epic: palette.vermillon,
    legendary: palette.indianYellow,
  },
} as const;
