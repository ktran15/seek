import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { AvatarConfig } from '@/lib/database.types';
import { colors, palette } from '@/theme';

import { HAIR_COLORS, SKIN_TONES, swatchById } from './catalog';
import { resolveLayers, type CatalogEntry, type CosmeticSlot } from './layers';

/**
 * Placeholder layered avatar render — simple shapes standing in for the real
 * layer art (M12, Rig Bible). Reads the same `avatar_config` the real renderer
 * will (base choices + equipped cosmetics), so persistence and the LOCKED
 * layering rules (resolveLayers, unit-tested) are exercised for real.
 *
 * Cosmetic layers draw as slot-shaped blocks tinted by rarity; base gear
 * keeps the earth-tone palette. Pass the cosmetics catalog to render equips;
 * omit it (onboarding) for the base-only avatar.
 */
export function AvatarPreview({
  config,
  cosmetics = [],
}: {
  config: AvatarConfig;
  cosmetics?: readonly CatalogEntry[];
}) {
  const skin = swatchById(SKIN_TONES, config.skinTone).color;
  const hairColor = swatchById(HAIR_COLORS, config.hairColor).color;
  const hair = config.hair ?? 'hair1';
  const eyes = config.eyes ?? 'eyes1';

  const layers = resolveLayers(config.equipped, cosmetics);
  const worn = new Map(layers.map((l) => [l.slot, l.cosmetic]));
  /** Fill for a slot: rarity tint when a cosmetic is worn, base color else. */
  const fill = (slot: CosmeticSlot, base: string): string => {
    const cosmetic = worn.get(slot);
    return cosmetic ? colors.rarity[cosmetic.rarity] : base;
  };

  return (
    <View style={styles.stage} accessibilityLabel="Avatar preview">
      {/* backpack (z0 — peeks out behind the body) */}
      {worn.has('backpack') && (
        <View
          style={[styles.backpack, { backgroundColor: fill('backpack', palette.chestnut) }]}
        />
      )}
      {/* body: shirt (hidden under a jacket — LOCKED) + pants */}
      <View style={styles.body}>
        {worn.has('shirts') && (
          <View
            style={[styles.shirt, { backgroundColor: fill('shirts', palette.russianGreen) }]}
          />
        )}
        {worn.has('jacket') && (
          <View style={[styles.jacket, jacketFill(worn.get('jacket'))]} />
        )}
        {worn.has('pants') && (
          <View
            style={[styles.pants, { backgroundColor: fill('pants', palette.rifleGreen) }]}
          />
        )}
        {worn.has('boots') && (
          <View style={styles.bootRow}>
            <View style={[styles.boot, { backgroundColor: fill('boots', palette.darkSienna) }]} />
            <View style={[styles.boot, { backgroundColor: fill('boots', palette.darkSienna) }]} />
          </View>
        )}
      </View>
      {/* head (skin) */}
      <View style={[styles.head, { backgroundColor: skin }]}>
        <View style={styles.eyeRow}>
          <View style={[styles.eye, eyeStyles[eyes]]} />
          <View style={[styles.eye, eyeStyles[eyes]]} />
        </View>
      </View>
      {/* hair style variants (over head) */}
      <View style={[styles.hairBase, hairStyles[hair], { backgroundColor: hairColor }]} />
      {hair === 'hair5' && (
        <View style={[styles.bunKnot, { backgroundColor: hairColor }]} />
      )}
      {hair === 'hair4' && (
        <View style={[styles.longSides, { backgroundColor: hairColor }]} />
      )}
      {/* accessories over hair/face */}
      {worn.has('hats') && (
        <View style={[styles.hat, { backgroundColor: fill('hats', palette.chestnut) }]} />
      )}
      {worn.has('sunglasses') && (
        <View
          style={[styles.sunglasses, { backgroundColor: fill('sunglasses', palette.jungleGreen) }]}
        />
      )}
      {/* pet companion, front */}
      {worn.has('pet') && (
        <View style={[styles.pet, { backgroundColor: fill('pet', palette.russianGreen) }]} />
      )}
    </View>
  );
}

/** Jacket fill (always a cosmetic — no base jacket). */
function jacketFill(cosmetic: CatalogEntry | null | undefined): ViewStyle {
  return { backgroundColor: cosmetic ? colors.rarity[cosmetic.rarity] : palette.rifleGreen };
}

const HEAD_SIZE = 84;

const styles = StyleSheet.create({
  stage: {
    width: 160,
    height: 200,
    alignSelf: 'center',
    alignItems: 'center',
  },
  backpack: {
    position: 'absolute',
    top: 96,
    left: 18,
    width: 44,
    height: 62,
    borderRadius: 14,
  },
  body: {
    position: 'absolute',
    top: 78,
    width: 76,
    height: 122,
    alignItems: 'center',
  },
  shirt: {
    width: '100%',
    height: 62,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  jacket: {
    position: 'absolute',
    top: -2,
    width: '112%',
    height: 66,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  pants: {
    position: 'absolute',
    top: 62,
    width: '86%',
    height: 44,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  bootRow: {
    position: 'absolute',
    top: 104,
    flexDirection: 'row',
    gap: 10,
  },
  boot: {
    width: 24,
    height: 14,
    borderRadius: 5,
  },
  head: {
    position: 'absolute',
    top: 8,
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: HEAD_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  eye: {
    backgroundColor: colors.textPrimary,
  },
  hairBase: {
    position: 'absolute',
  },
  bunKnot: {
    position: 'absolute',
    top: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  longSides: {
    position: 'absolute',
    top: 30,
    width: HEAD_SIZE + 18,
    height: 46,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: -1,
  },
  hat: {
    position: 'absolute',
    top: -4,
    width: HEAD_SIZE - 4,
    height: 22,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  sunglasses: {
    position: 'absolute',
    top: 36,
    width: HEAD_SIZE - 20,
    height: 12,
    borderRadius: 6,
  },
  pet: {
    position: 'absolute',
    bottom: 4,
    right: 14,
    width: 30,
    height: 26,
    borderRadius: 12,
  },
});

/** Eye shape per variant id. */
const eyeStyles: Record<string, object> = {
  eyes1: { width: 10, height: 10, borderRadius: 5 },
  eyes2: { width: 12, height: 6, borderRadius: 3 },
  eyes3: { width: 12, height: 4, borderRadius: 2 },
};

/** Hair silhouette per style id (positioned over the head). */
const hairStyles: Record<string, object> = {
  hair1: { top: 6, width: HEAD_SIZE - 8, height: 18, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  hair2: { top: 2, width: HEAD_SIZE - 2, height: 26, borderTopLeftRadius: 42, borderTopRightRadius: 42 },
  hair3: { top: -2, width: HEAD_SIZE + 8, height: 34, borderRadius: 24 },
  hair4: { top: 0, width: HEAD_SIZE + 2, height: 28, borderTopLeftRadius: 42, borderTopRightRadius: 42 },
  hair5: { top: 4, width: HEAD_SIZE - 6, height: 22, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
};
