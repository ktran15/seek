import { Image, StyleSheet, Text, View } from 'react-native';

import { getAssetOrNull } from '@/assets/registry';
import { config } from '@/config';
import type { AvatarConfig } from '@/lib/database.types';
import { colors, radii, spacing, textStyles } from '@/theme';

import {
  beaverBodyColor,
  beaverBodySlotName,
  beaverSex,
  bodyColorOption,
  sexLabel,
} from './catalog';
import { happinessState } from './happiness';
import {
  BEHIND_BODY,
  resolveBeaverLayers,
  type BeaverCatalogEntry,
  type BeaverSlot,
  type ResolvedBeaverLayer,
} from './layers';

/** Where each slot's placeholder chip sits over the beaver (fractions). */
const SLOT_POS: Record<BeaverSlot, object> = {
  hats: { top: '3%' },
  eyes: { top: '33%' },
  gloves: { top: '58%' },
  tails: { bottom: '2%' },
};
const SLOT_LABEL: Record<BeaverSlot, string> = {
  hats: 'Hat',
  eyes: 'Eyes',
  gloves: 'Gloves',
  tails: 'Tail',
};

/**
 * Renders the player beaver: its body at the current Happiness-state pose
 * (spec §10.3) with equipped cosmetics composited in the LOCKED z-order (Rig
 * Bible §3): tail behind the body, then gloves, eyes, hats on top.
 *
 * Real art (`beaverBody{Sex}{Color}{State}` bodies, per-cosmetic asset slots)
 * renders as full-canvas registered images with zero code change once it
 * lands. Until then: the body is a fur-colored placeholder disc and each
 * equipped cosmetic shows as a rarity-colored chip at its slot — so equip /
 * try-on gives real feedback in placeholder-land.
 *
 * `happiness` picks the state pose; it defaults to the starting value (70 =
 * Content), which is what onboarding shows before a beaver has a live stat.
 */
export function BeaverPreview({
  config: avatar,
  happiness = config.careLoop.startingHappiness,
  cosmetics = [],
  height = 200,
}: {
  config: AvatarConfig | undefined;
  happiness?: number;
  cosmetics?: readonly BeaverCatalogEntry[];
  height?: number;
}) {
  const sex = beaverSex(avatar);
  const color = beaverBodyColor(avatar);
  const option = bodyColorOption(color);
  const state = happinessState(happiness);
  const label = `${sexLabel(sex)} · ${option.label} beaver, ${state.label}`;

  const worn = resolveBeaverLayers(avatar?.equipped, cosmetics);
  const bodyArt = getAssetOrNull(beaverBodySlotName(avatar, state.id));

  const box = { width: height, height };
  const fullLayer = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: height,
    height,
  };

  // A cosmetic layer: real art (full-canvas registered image) when present,
  // else a rarity-colored chip at the slot's placeholder position.
  const cosmeticLayer = (l: ResolvedBeaverLayer) => {
    const art = l.cosmetic.asset_slot_name
      ? getAssetOrNull(l.cosmetic.asset_slot_name)
      : null;
    if (art) {
      return (
        <Image
          key={l.slot}
          source={art}
          style={fullLayer}
          resizeMode="contain"
        />
      );
    }
    return (
      <View
        key={l.slot}
        style={[
          styles.chip,
          SLOT_POS[l.slot],
          { backgroundColor: colors.rarity[l.cosmetic.rarity] },
        ]}
      >
        <Text style={styles.chipText} numberOfLines={1}>
          {SLOT_LABEL[l.slot]}
        </Text>
      </View>
    );
  };

  const body = bodyArt ? (
    <Image source={bodyArt} style={fullLayer} resizeMode="contain" />
  ) : (
    <BodyPlaceholder height={height} swatch={option.swatch} female={sex === 'female'} />
  );

  return (
    <View style={styles.wrap}>
      <View style={[box, styles.stage]} accessibilityLabel={label}>
        {worn.filter((l) => BEHIND_BODY.has(l.slot)).map(cosmeticLayer)}
        {body}
        {worn.filter((l) => !BEHIND_BODY.has(l.slot)).map(cosmeticLayer)}
      </View>
      {!bodyArt ? (
        <Text style={[textStyles.caption, styles.caption]}>
          Placeholder — {option.label.toLowerCase()} beaver art coming soon
        </Text>
      ) : null}
    </View>
  );
}

/** Fur-colored disc placeholder (no real body art yet). */
function BodyPlaceholder({
  height,
  swatch,
  female,
}: {
  height: number;
  swatch: string;
  female: boolean;
}) {
  const disc = Math.round(height * 0.72);
  return (
    <View style={[StyleSheet.absoluteFill, styles.center]}>
      <View
        style={[
          styles.disc,
          { width: disc, height: disc, borderRadius: disc / 2, backgroundColor: swatch },
        ]}
      >
        <Text style={{ fontSize: Math.round(disc * 0.46) }}>🦫</Text>
        {female ? (
          <Text style={[styles.femaleCue, { fontSize: Math.round(disc * 0.2) }]}>
            🎀
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs },
  stage: { alignSelf: 'center', overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.shadow,
  },
  femaleCue: { position: 'absolute', top: '6%' },
  caption: { color: colors.textSecondary, textAlign: 'center' },
  chip: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.textOnPrimary,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.textOnPrimary,
  },
});
