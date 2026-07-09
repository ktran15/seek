import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Redirect } from 'expo-router';

import { ANCHOR_ZONES, type AnchorSlot } from '@/features/avatar/anchorZones';
import { AvatarPreview } from '@/features/avatar/AvatarPreview';
import { EYES, HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from '@/features/avatar/catalog';
import { canvasRect, frameFor } from '@/features/avatar/frame';
import {
  SLOT_ORDER,
  type CatalogEntry,
  type CosmeticRarity,
  type CosmeticSlot,
} from '@/features/avatar/layers';
import type { AvatarConfig } from '@/lib/database.types';
import { colors, palette, radii, spacing, textStyles } from '@/theme';

/**
 * DEV-ONLY art QA screen (M12, Rig Bible §9 checks; never reachable in
 * release builds): the real compositor at large scale with quick controls to
 * (a) SWAP every base variant and cycle every cosmetic slot through its four
 * rarities — registration drift shows immediately, (b) OVERLAY the
 * LOCKED-ON-BASE anchor zones over the composite, (c) run a SILHOUETTE
 * check on a dark background where halo/edge artifacts pop. Uses a mock
 * catalog built from the slot-name convention — no database.
 *
 * Open from Settings → "Art QA" (dev builds only), or:
 *   exp://127.0.0.1:8081/--/dev/art-qa
 */

const RARITIES: readonly CosmeticRarity[] = ['common', 'rare', 'epic', 'legendary'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** All 32 seeded cosmetics, ids/asset slots per the M7 naming convention. */
const MOCK_CATALOG: CatalogEntry[] = SLOT_ORDER.flatMap((slot) =>
  RARITIES.map((rarity) => ({
    id: `qa-${slot}-${rarity}`,
    slot,
    name: `${cap(rarity)} ${cap(slot)}`,
    rarity,
    asset_slot_name: `cos${cap(slot)}${cap(rarity)}`,
  })),
);

const PREVIEW_HEIGHT = 420;
const ZONE_COLORS = [
  palette.biceBlue,
  palette.vermillon,
  palette.indianYellow,
  palette.russianGreen,
  palette.cadmiumOrange,
];

export default function ArtQA() {
  const [skin, setSkin] = useState(1); // index into catalog option arrays
  const [eyes, setEyes] = useState(0);
  const [hair, setHair] = useState(1);
  const [hairColor, setHairColor] = useState(1);
  // -1 = slot empty; 0..3 = rarity index
  const [wornRarity, setWornRarity] = useState<Record<CosmeticSlot, number>>(
    Object.fromEntries(SLOT_ORDER.map((s) => [s, -1])) as Record<CosmeticSlot, number>,
  );
  const [showZones, setShowZones] = useState(false);
  const [darkBg, setDarkBg] = useState(false);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  const config: AvatarConfig = {
    skinTone: SKIN_TONES[skin].id,
    eyes: EYES[eyes].id,
    hair: HAIR_STYLES[hair].id,
    hairColor: HAIR_COLORS[hairColor].id,
    equipped: Object.fromEntries(
      SLOT_ORDER.filter((s) => wornRarity[s] >= 0).map((s) => [
        s,
        `qa-${s}-${RARITIES[wornRarity[s]]}`,
      ]),
    ),
  };

  // Same pure math the compositor uses — the overlay can't drift from it.
  const wornSlots = SLOT_ORDER.filter((s) => wornRarity[s] >= 0);
  const frame = frameFor(wornSlots);
  const previewWidth = Math.round(
    (PREVIEW_HEIGHT * (frame.x[1] - frame.x[0])) / (frame.y[1] - frame.y[0]),
  );
  const rect = canvasRect(frame, previewWidth, PREVIEW_HEIGHT);
  const scale = rect.width / 1024;

  const cycle = (slot: CosmeticSlot) =>
    setWornRarity((prev) => ({
      ...prev,
      [slot]: prev[slot] >= RARITIES.length - 1 ? -1 : prev[slot] + 1,
    }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityLabel="Art QA"
    >
      <View
        style={[
          styles.stageWrap,
          { backgroundColor: darkBg ? palette.jungleGreen : colors.background },
        ]}
      >
        <View style={{ width: previewWidth, height: PREVIEW_HEIGHT }}>
          <AvatarPreview config={config} cosmetics={MOCK_CATALOG} height={PREVIEW_HEIGHT} />
          {showZones &&
            (Object.entries(ANCHOR_ZONES) as [AnchorSlot, (typeof ANCHOR_ZONES)[AnchorSlot]][]).map(
              ([name, zone], i) => (
                <View
                  key={name}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: rect.left + zone.x[0] * scale,
                    top: rect.top + zone.y[0] * scale,
                    width: (zone.x[1] - zone.x[0]) * scale,
                    height: (zone.y[1] - zone.y[0]) * scale,
                    borderWidth: 1,
                    borderColor: ZONE_COLORS[i % ZONE_COLORS.length],
                  }}
                />
              ),
            )}
        </View>
      </View>

      <View style={styles.controls}>
        <QARow label={`Skin: ${SKIN_TONES[skin].label}`} onPress={() => setSkin((skin + 1) % SKIN_TONES.length)} />
        <QARow label={`Eyes: ${EYES[eyes].label}`} onPress={() => setEyes((eyes + 1) % EYES.length)} />
        <QARow label={`Hair: ${HAIR_STYLES[hair].label}`} onPress={() => setHair((hair + 1) % HAIR_STYLES.length)} />
        <QARow
          label={`Hair color: ${HAIR_COLORS[hairColor].label}`}
          onPress={() => setHairColor((hairColor + 1) % HAIR_COLORS.length)}
        />
        {SLOT_ORDER.map((slot) => (
          <QARow
            key={slot}
            label={`${cap(slot)}: ${wornRarity[slot] < 0 ? '—' : RARITIES[wornRarity[slot]]}`}
            onPress={() => cycle(slot)}
          />
        ))}
        <QARow label={showZones ? 'Zones: ON' : 'Zones: off'} onPress={() => setShowZones(!showZones)} />
        <QARow
          label={darkBg ? 'Silhouette bg: dark' : 'Silhouette bg: cream'}
          onPress={() => setDarkBg(!darkBg)}
        />
      </View>
    </ScrollView>
  );
}

function QARow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Text style={[textStyles.bodyEmphasis, styles.rowLabel]}>{label}</Text>
      <Text style={[textStyles.caption, styles.rowHint]}>tap to cycle</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  stageWrap: {
    alignItems: 'center',
    borderRadius: radii.card,
    paddingVertical: spacing.md,
  },
  controls: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  rowLabel: {
    color: colors.textPrimary,
  },
  rowHint: {
    color: colors.textSecondary,
  },
});
