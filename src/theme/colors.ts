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
  /** Bright gold peak — §2's rarity ladder tops out at "indian yellow / gold"
   *  (the gold crate family); used where celebration peaks past yellow. */
  gold: '#F2C14E',
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
  /** Translucent dark scrim for overlays on media (gallery chrome). */
  scrim: 'rgba(35, 56, 55, 0.55)',

  /** Errors/destructive — warm, in-palette (no new reds). */
  danger: palette.vermillon,

  /** Rarity ladder (gacha) — echoes crate colors (aesthetic §2). */
  rarity: {
    common: palette.russianGreen,
    rare: palette.biceBlue,
    epic: palette.vermillon,
    legendary: palette.indianYellow,
  },

  /** Happiness-meter fill ramp — one flat hue plane per care state (§5:
   *  cel planes, never smooth gradients), ember → gold so the bar warms and
   *  brightens as the beaver thrives. All warm act/reward-family colors. */
  happiness: {
    neglected: palette.chestnut,
    unhappy: palette.vermillon,
    okay: palette.cadmiumOrange,
    content: palette.indianYellow,
    thriving: palette.gold,
  },
  /** Meter trough — an earth tint one step deeper than `surface` — and the
   *  darker 3D bottom lip it sits on (PressButton depth language). */
  meterTrough: '#E3D4C1',
  meterTroughLip: '#CFBCA2',
  /** Flat cel-highlight plane laid over accent fills (no gradients, §4). */
  sheen: 'rgba(255, 255, 255, 0.28)',
} as const;
