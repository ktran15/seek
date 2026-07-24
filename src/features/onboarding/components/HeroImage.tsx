import { Image, useWindowDimensions, View } from 'react-native';

import { getAsset, type AssetSlot } from '@/assets/registry';

interface HeroImageProps {
  /** Registry slot for the hero art. Authored square (1600×1600) — see registry. */
  slot: AssetSlot;
  /**
   * Banner aspect ratio (width ÷ height). Higher = shorter, wider, more
   * cinematic. The founder-approved onboarding heroes use a ~3:2 banner.
   */
  aspect?: number;
  /**
   * Vertical crop focus, 0 (top edge) … 1 (bottom edge); 0.5 centres.
   * Reproduces CSS `object-position: center <focusY>` — the control React
   * Native's `resizeMode="cover"` (always centred) can't express. Aim it at the
   * subject band so the beaver/sun/flag stay framed while dead sky / foreground
   * is what gets cropped.
   */
  focusY?: number;
  accessibilityLabel?: string;
}

/**
 * Full-bleed onboarding hero that fills a short landscape strip from a SQUARE
 * source without ever stretching. The square image is rendered at full screen
 * width (so it's taller than the strip), clipped by the strip, and slid
 * vertically by `focusY` — i.e. a faithful `object-fit: cover` +
 * `object-position` that RN's plain `cover` can't do (it only ever centres).
 * Everything derives from screen width, so the framing is identical on every
 * phone. Used by the welcome ((auth)) and Begin ((onboarding)) heroes.
 */
export function HeroImage({
  slot,
  aspect = 1.5,
  focusY = 0.5,
  accessibilityLabel,
}: HeroImageProps) {
  const { width } = useWindowDimensions();
  const stripHeight = width / aspect;
  // The square image (width × width) overhangs the shorter strip by this much;
  // slide it up by the focused fraction of that overhang.
  const overhang = width - stripHeight;

  return (
    <View style={{ width: '100%', height: stripHeight, overflow: 'hidden' }}>
      <Image
        source={getAsset(slot)}
        style={{ width, height: width, marginTop: -overhang * focusY }}
        resizeMode="cover"
        accessibilityLabel={accessibilityLabel}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
