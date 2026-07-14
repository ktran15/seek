import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { getAsset, getAssetOrNull } from '@/assets/registry';
import type { AvatarConfig } from '@/lib/database.types';
import { colors, radii, spacing, textStyles } from '@/theme';

import {
  beaverBodySlot,
  bodyColorOf,
  bodySexOf,
  colorOption,
  BODY_SEXES,
} from './catalog';
import { happinessState, type HappinessState } from './happiness';

/**
 * The player's beaver (spec §10). Renders the body for
 * (sex × color × Happiness state) from its registry slot, so real art is a
 * ZERO-CODE swap: drop the 30 body files into the `beaver*` slots and this
 * component picks them up.
 *
 * PLACEHOLDER PHASE (no body art yet): the slot resolves to null, so we fall
 * back to the existing beaver art on a body-colored disc, plus a caption
 * naming the chosen body. Those affordances are **self-cleaning** — the moment
 * a real slot resolves, the disc and caption disappear and only the art shows.
 *
 * Equipped cosmetics (hats/tails/gloves/eyes) layer on top of EVERY state —
 * they are wired in the cosmetics sub-step, not here.
 */

/** Per-state placeholder treatment — droop + fade as Happiness falls (§10.3). */
const STATE_TREATMENT: Record<
  HappinessState,
  { opacity: number; translateY: number; scale: number }
> = {
  thriving: { opacity: 1, translateY: -4, scale: 1.02 },
  content: { opacity: 1, translateY: 0, scale: 1 },
  okay: { opacity: 0.92, translateY: 3, scale: 0.99 },
  unhappy: { opacity: 0.8, translateY: 6, scale: 0.97 },
  neglected: { opacity: 0.62, translateY: 9, scale: 0.95 },
};

export function BeaverPreview({
  config,
  happiness = 70,
  size = 200,
  /** Hide the placeholder caption where the screen already names the body. */
  showCaption = true,
}: {
  config: AvatarConfig | null | undefined;
  happiness?: number;
  size?: number;
  showCaption?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const sex = bodySexOf(config);
  const color = bodyColorOf(config);
  const state = happinessState(happiness);

  const bodyArt = getAssetOrNull(beaverBodySlot(sex, color, state.id));
  const isPlaceholder = bodyArt === null;
  // The one real beaver we already have stands in until the body art lands.
  const source = bodyArt ?? getAsset('mascotAvatar');
  const treatment = STATE_TREATMENT[state.id];

  // Thriving gets a gentle idle bounce (aesthetic §8) — calm under Reduce Motion.
  const bounce = useSharedValue(0);
  const thriving = state.id === 'thriving' && !reducedMotion;
  useEffect(() => {
    if (thriving) {
      bounce.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      bounce.value = 0;
    }
  }, [thriving, bounce]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: treatment.translateY + bounce.value * -5 },
      { scale: treatment.scale },
    ],
    opacity: treatment.opacity,
  }));

  const sexLabel = BODY_SEXES.find((o) => o.id === sex)?.label ?? '';

  return (
    <View style={styles.container} accessibilityLabel={`Your beaver, ${state.label}`}>
      <View style={{ width: size, height: size }}>
        {isPlaceholder && (
          <View
            style={[
              styles.disc,
              {
                borderRadius: size / 2,
                backgroundColor: colorOption(color).swatch,
              },
            ]}
          />
        )}
        <Animated.View style={[styles.bodyWrap, animatedStyle]}>
          <Image
            source={source}
            style={{ width: size, height: size }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {isPlaceholder && showCaption && (
        <Text style={[textStyles.caption, styles.caption]}>
          {sexLabel} · {colorOption(color).label} · {state.label} (placeholder art)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  // Placeholder-only: a body-colored disc so the color choice actually reads
  // while every body still shares the same stand-in art.
  disc: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  bodyWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
  },
});
