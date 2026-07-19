import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { getAssetOrNull } from '@/assets/registry';
import { config } from '@/config';
import type { AvatarConfig } from '@/lib/database.types';
import type { ImageSourcePropType } from 'react-native';
import { colors, radii, spacing, textStyles } from '@/theme';

import {
  beaverBodyColor,
  beaverBodySlotChain,
  beaverSex,
  bodyColorOption,
  sexLabel,
} from './catalog';
import { happinessState } from './happiness';
import {
  resolveBeaverLayers,
  type BeaverCatalogEntry,
  type BeaverSlot,
  type ResolvedBeaverLayer,
} from './layers';
import { BODY_Z, getPlacement, PLACEMENT_CANVAS } from './placement';

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

/** Rig z for a cosmetic with art but no placement entry (legacy full-canvas). */
const RIG_SLOT_Z: Record<BeaverSlot, number> = {
  tails: 0,
  gloves: 2,
  eyes: 3,
  hats: 4,
};

interface DrawLayer {
  key: string;
  z: number;
  node: React.ReactElement;
}

/**
 * Renders the player beaver on the 1024² composite grid (Rig Bible §5): the
 * body (selected by color × Happiness state, plus sex where the art is
 * per-sex) auto-centered at z1, each equipped cosmetic drawn at its authored
 * placement from `beaver-placement.json` (center offset / scale / rotation),
 * stacked by z. Falls back gracefully at every level (§2.1):
 *   - body state art missing → content pose → thriving → placeholder disc
 *   - cosmetic placement missing → legacy full-canvas registered layer
 *   - cosmetic art missing → rarity-colored slot chip
 *
 * `zoom` magnifies the composite about the canvas center (art may extend past
 * the box — the stage doesn't clip, matching the authoring tool).
 */
export function BeaverPreview({
  config: avatar,
  happiness = config.careLoop.startingHappiness,
  cosmetics = [],
  height = 200,
  zoom = 1,
}: {
  config: AvatarConfig | undefined;
  happiness?: number;
  cosmetics?: readonly BeaverCatalogEntry[];
  height?: number;
  zoom?: number;
}) {
  const sex = beaverSex(avatar);
  const color = beaverBodyColor(avatar);
  const option = bodyColorOption(color);
  const state = happinessState(happiness);
  const label = `${sexLabel(sex)} · ${option.label} beaver, ${state.label}`;

  const worn = resolveBeaverLayers(avatar?.equipped, cosmetics);

  // Body: most-specific slot with registered art wins (state → content → thriving).
  let bodySlot: string | null = null;
  let bodyArt: ImageSourcePropType | null = null;
  for (const slot of beaverBodySlotChain(avatar, state.id)) {
    const art = getAssetOrNull(slot);
    if (art) {
      bodySlot = slot;
      bodyArt = art;
      break;
    }
  }

  // Canvas → box mapping: k scales canvas px to screen px; the canvas center
  // stays pinned to the box center for any zoom.
  const k = (height / PLACEMENT_CANVAS) * zoom;
  const inset = (height - PLACEMENT_CANVAS * k) / 2;
  const box = { width: height, height };
  const fullLayer = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: height,
    height,
  };

  const placedStyle = (p: NonNullable<ReturnType<typeof getPlacement>>) => ({
    position: 'absolute' as const,
    left: inset + (PLACEMENT_CANVAS / 2 + p.x - p.w / 2) * k,
    top: inset + (PLACEMENT_CANVAS / 2 + p.y - p.h / 2) * k,
    width: p.w * k,
    height: p.h * k,
    transform: [{ scale: p.scale }, { rotate: `${p.rotation}deg` }],
  });

  const layers: DrawLayer[] = [];

  if (bodyArt && bodySlot) {
    const p = getPlacement(bodySlot);
    layers.push({
      key: 'body',
      z: BODY_Z,
      node: p ? (
        <Image key="body" source={bodyArt} style={placedStyle(p)} resizeMode="contain" />
      ) : (
        <Image key="body" source={bodyArt} style={fullLayer} resizeMode="contain" />
      ),
    });
  }

  for (const l of worn) {
    const slotName = l.cosmetic.asset_slot_name;
    const art = slotName ? getAssetOrNull(slotName) : null;
    if (!art) {
      // No registered art: rarity chip at the slot's rough position (topmost).
      layers.push({
        key: l.slot,
        z: 100,
        node: (
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
        ),
      });
      continue;
    }
    const p = slotName ? getPlacement(slotName) : null;
    layers.push({
      key: l.slot,
      z: p ? p.z : RIG_SLOT_Z[l.slot],
      node: p ? (
        <Image key={l.slot} source={art} style={placedStyle(p)} resizeMode="contain" />
      ) : (
        <Image key={l.slot} source={art} style={fullLayer} resizeMode="contain" />
      ),
    });
  }

  // Stable ascending z: ties keep push order (body first, then slot order).
  const drawn = [...layers].sort((a, b) => a.z - b.z);

  return (
    <View style={styles.wrap}>
      <View style={[box, styles.stage]} accessibilityLabel={label}>
        {!bodyArt ? (
          <BodyPlaceholder height={height} swatch={option.swatch} female={sex === 'female'} />
        ) : null}
        {drawn.map((l) => l.node)}
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
        <Ionicons
          name="paw"
          size={Math.round(disc * 0.42)}
          color={colors.textOnPrimary}
        />
        {female ? (
          <Ionicons
            name="female"
            size={Math.round(disc * 0.2)}
            color={colors.textOnPrimary}
            style={styles.femaleCue}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs },
  // No clipping: the founder authors art past the canvas edge (tails, gloves)
  // and the Placement Studio shows it unclipped — the app must match.
  stage: { alignSelf: 'center', overflow: 'visible' },
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
