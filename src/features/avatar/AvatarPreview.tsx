import { StyleSheet, View } from 'react-native';

import type { AvatarConfig } from '@/lib/database.types';
import { colors, palette } from '@/theme';

import { HAIR_COLORS, SKIN_TONES, swatchById } from './catalog';

/**
 * Placeholder layered avatar render — simple shapes standing in for the real
 * layer art (M12, Rig Bible). Reads the same `avatar_config` the real renderer
 * will, so persistence is exercised for real.
 */
export function AvatarPreview({ config }: { config: AvatarConfig }) {
  const skin = swatchById(SKIN_TONES, config.skinTone).color;
  const hairColor = swatchById(HAIR_COLORS, config.hairColor).color;
  const hair = config.hair ?? 'hair1';
  const eyes = config.eyes ?? 'eyes1';

  return (
    <View style={styles.stage} accessibilityLabel="Avatar preview">
      {/* backpack (z0 — peeks out behind the body) */}
      <View style={styles.backpack} />
      {/* body: base shirt + pants (auto-equipped) */}
      <View style={styles.body}>
        <View style={styles.shirt} />
        <View style={styles.pants} />
      </View>
      {/* head (skin) */}
      <View style={[styles.head, { backgroundColor: skin }]}>
        {/* eyes variants */}
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
    </View>
  );
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
    backgroundColor: palette.chestnut,
  },
  body: {
    position: 'absolute',
    top: 78,
    width: 76,
    height: 110,
    alignItems: 'center',
  },
  shirt: {
    width: '100%',
    height: 62,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: palette.russianGreen,
  },
  pants: {
    width: '86%',
    height: 44,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: palette.rifleGreen,
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
