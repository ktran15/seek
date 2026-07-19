import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Redirect } from 'expo-router';

import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { BEAVER_BODY_COLORS, BEAVER_SEXES } from '@/features/beaver/catalog';
import { happinessState } from '@/features/beaver/happiness';
import {
  BEAVER_SLOT_ORDER,
  type BeaverCatalogEntry,
  type BeaverSlot,
} from '@/features/beaver/layers';
import type { AvatarConfig } from '@/lib/database.types';
import { colors, palette, radii, spacing, textStyles } from '@/theme';

/**
 * DEV-ONLY beaver art QA screen (never reachable in release builds): the real
 * compositor at large scale with quick controls to sweep every render input —
 * sex × color × all 5 Happiness states (including the gender-agnostic
 * okay/neglected shares), and every cosmetic slot cycled through its full §10.2
 * catalog at the authored placements. Dark background pops silhouette/halo
 * artifacts. Mock catalog — no database.
 *
 * Open: exp://127.0.0.1:8081/--/dev/beaver-qa  (or /dev/beaver-qa on web)
 */

/** The LOCKED §10.2 catalog (migration 20260716000002) as a mock. */
const QA_CATALOG: BeaverCatalogEntry[] = [
  { slot: 'hats', name: 'Beanie', rarity: 'common', asset_slot_name: 'cosHatsBeanie' },
  { slot: 'hats', name: 'Baseball Cap', rarity: 'rare', asset_slot_name: 'cosHatsBaseballCap' },
  { slot: 'hats', name: 'Bow Hat', rarity: 'rare', asset_slot_name: 'cosHatsBowHat' },
  { slot: 'hats', name: 'Propeller Hat', rarity: 'epic', asset_slot_name: 'cosHatsPropeller' },
  { slot: 'hats', name: 'Crown', rarity: 'legendary', asset_slot_name: 'cosHatsCrown' },
  { slot: 'tails', name: 'Red Beaver Tail', rarity: 'common', asset_slot_name: 'cosTailsRed' },
  { slot: 'tails', name: 'Checkerboard Tail', rarity: 'rare', asset_slot_name: 'cosTailsCheckerboard' },
  { slot: 'tails', name: 'Beaver Tail w/ Bow', rarity: 'rare', asset_slot_name: 'cosTailsBow' },
  { slot: 'tails', name: 'Rainbow Tail', rarity: 'epic', asset_slot_name: 'cosTailsRainbow' },
  { slot: 'tails', name: 'Gold Tail', rarity: 'legendary', asset_slot_name: 'cosTailsGold' },
  { slot: 'gloves', name: 'Red Boxing Gloves', rarity: 'common', asset_slot_name: 'cosGlovesRedBoxing' },
  { slot: 'gloves', name: 'Blue Gloves', rarity: 'rare', asset_slot_name: 'cosGlovesBlue' },
  { slot: 'gloves', name: 'Pink Mitts', rarity: 'epic', asset_slot_name: 'cosGlovesPinkMitts' },
  { slot: 'gloves', name: 'Golden Boxing Gloves', rarity: 'legendary', asset_slot_name: 'cosGlovesGoldenBoxing' },
  { slot: 'eyes', name: 'Sunglasses', rarity: 'common', asset_slot_name: 'cosEyesSunglasses' },
  { slot: 'eyes', name: 'EyePatch', rarity: 'rare', asset_slot_name: 'cosEyesEyePatch' },
  { slot: 'eyes', name: 'Eye Shadow', rarity: 'rare', asset_slot_name: 'cosEyesShadow' },
  { slot: 'eyes', name: 'Ski Goggles', rarity: 'epic', asset_slot_name: 'cosEyesSkiGoggles' },
  { slot: 'eyes', name: 'Gold Monocle', rarity: 'legendary', asset_slot_name: 'cosEyesGoldMonocle' },
].map((c, i) => ({ ...c, id: `qa-${i}-${c.asset_slot_name}` })) as BeaverCatalogEntry[];

const bySlot = (slot: BeaverSlot) => QA_CATALOG.filter((c) => c.slot === slot);

/** Band midpoints — one per visual state, high→low. */
const QA_HAPPINESS = [90, 70, 50, 30, 10];
const ZOOMS = [1, 1.3, 1.6];
const PREVIEW_HEIGHT = 420;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export default function BeaverQA() {
  const [sexIdx, setSexIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [happyIdx, setHappyIdx] = useState(1); // start at Content (the default)
  const [zoomIdx, setZoomIdx] = useState(1);
  // -1 = slot empty; otherwise index into that slot's catalog items
  const [wornIdx, setWornIdx] = useState<Record<BeaverSlot, number>>(
    Object.fromEntries(BEAVER_SLOT_ORDER.map((s) => [s, -1])) as Record<BeaverSlot, number>,
  );
  const [darkBg, setDarkBg] = useState(false);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  const sex = BEAVER_SEXES[sexIdx];
  const color = BEAVER_BODY_COLORS[colorIdx];
  const happiness = QA_HAPPINESS[happyIdx];
  const state = happinessState(happiness);

  const config: AvatarConfig = {
    sex: sex.id,
    bodyColor: color.id,
    equipped: Object.fromEntries(
      BEAVER_SLOT_ORDER.filter((s) => wornIdx[s] >= 0).map((s) => [
        s,
        bySlot(s)[wornIdx[s]].id,
      ]),
    ),
  };

  const cycleSlot = (slot: BeaverSlot) =>
    setWornIdx((prev) => ({
      ...prev,
      [slot]: prev[slot] >= bySlot(slot).length - 1 ? -1 : prev[slot] + 1,
    }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityLabel="Beaver QA"
    >
      <View
        style={[
          styles.stageWrap,
          { backgroundColor: darkBg ? palette.jungleGreen : colors.background },
        ]}
      >
        <BeaverPreview
          config={config}
          happiness={happiness}
          cosmetics={QA_CATALOG}
          height={PREVIEW_HEIGHT}
          zoom={ZOOMS[zoomIdx]}
        />
      </View>

      <View style={styles.controls}>
        <QARow
          label={`Sex: ${sex.label}`}
          onPress={() => setSexIdx((sexIdx + 1) % BEAVER_SEXES.length)}
        />
        <QARow
          label={`Color: ${color.label}`}
          onPress={() => setColorIdx((colorIdx + 1) % BEAVER_BODY_COLORS.length)}
        />
        <QARow
          label={`Happiness: ${happiness} — ${state.label}`}
          onPress={() => setHappyIdx((happyIdx + 1) % QA_HAPPINESS.length)}
        />
        {BEAVER_SLOT_ORDER.map((slot) => (
          <QARow
            key={slot}
            label={`${cap(slot)}: ${wornIdx[slot] < 0 ? '—' : bySlot(slot)[wornIdx[slot]].name}`}
            onPress={() => cycleSlot(slot)}
          />
        ))}
        <QARow
          label={`Zoom: ${ZOOMS[zoomIdx]}×`}
          onPress={() => setZoomIdx((zoomIdx + 1) % ZOOMS.length)}
        />
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
