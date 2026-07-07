import { useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, View } from 'react-native';

import { getAsset, type AssetSlot } from '@/assets/registry';
import { PressButton } from '@/components/ui/PressButton';
import { colors, elevation, radii, spacing, textStyles } from '@/theme';

import {
  useMyCosmetics,
  useMyCrates,
  useOpenCrate,
  type Crate,
  type CrateOpenResult,
  type CrateTier,
} from './useEconomy';

const CRATE_ASSET: Record<CrateTier, AssetSlot> = {
  wood: 'crateWooden',
  blue: 'crateBlue',
  red: 'crateRed',
  yellow: 'crateYellow',
  gold: 'crateGold',
};

const CRATE_LABEL: Record<CrateTier, string> = {
  wood: 'Wooden',
  blue: 'Blue',
  red: 'Red',
  yellow: 'Yellow',
  gold: 'Gold',
};

/** Simple reveal card — the expressive open animation is the M13 pass. */
function RevealModal({
  result,
  onClose,
}: {
  result: CrateOpenResult;
  onClose: () => void;
}) {
  const rarityColor = colors.rarity[result.cosmetic.rarity];
  const isDupe = result.outcome === 'dupe';
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.revealBackdrop}>
        <View style={[styles.revealCard, elevation.card]}>
          <View style={[styles.rarityChip, { backgroundColor: rarityColor }]}>
            <Text style={[textStyles.caption, styles.rarityChipLabel]}>
              {result.cosmetic.rarity.toUpperCase()}
            </Text>
          </View>
          <Text style={[textStyles.headerL, styles.revealName]}>
            {result.cosmetic.name}
          </Text>
          <Text style={[textStyles.body, styles.revealSlot]}>
            {result.cosmetic.slot}
          </Text>
          {isDupe && (
            <Text style={[textStyles.bodyEmphasis, styles.dupeNote]}>
              Duplicate! Converted to +{result.refund_coins} coins.
            </Text>
          )}
          <PressButton label={isDupe ? 'CASH IN' : 'NICE'} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

/**
 * Profile → Inventory (spec §9.3 LOCKED gacha pattern): unopened crates open
 * deliberately here; owned cosmetics list below (equip arrives in M8).
 */
export function InventorySection({ userId }: { userId: string | undefined }) {
  const { data: crates } = useMyCrates(userId);
  const { data: cosmetics } = useMyCosmetics(userId);
  const openCrate = useOpenCrate(userId);
  const [reveal, setReveal] = useState<CrateOpenResult | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const unopened = (crates ?? []).filter((c) => !c.opened);

  const open = (crate: Crate) => {
    setOpeningId(crate.id);
    openCrate.mutate(crate.id, {
      onSuccess: (result) => setReveal(result),
      onError: (e) =>
        Alert.alert('Crate not opened', e instanceof Error ? e.message : 'Try again.'),
      onSettled: () => setOpeningId(null),
    });
  };

  return (
    <View style={styles.body}>
      <Text style={[textStyles.headerS, styles.heading]}>
        Crates ({unopened.length})
      </Text>
      {unopened.length === 0 ? (
        <Text style={[textStyles.caption, styles.note]}>
          No unopened crates — complete challenges, win matchups, or visit the
          Shop.
        </Text>
      ) : (
        <View style={styles.crateGrid}>
          {unopened.map((crate) => (
            <View key={crate.id} style={[styles.crateCard, elevation.card]}>
              <Image source={getAsset(CRATE_ASSET[crate.tier])} style={styles.crateImage} />
              <Text style={[textStyles.caption, styles.crateName]}>
                {CRATE_LABEL[crate.tier]}
              </Text>
              <PressButton
                label={openingId === crate.id ? 'OPENING…' : 'OPEN'}
                disabled={openingId !== null}
                onPress={() => open(crate)}
              />
            </View>
          ))}
        </View>
      )}

      <Text style={[textStyles.headerS, styles.heading]}>
        Cosmetics ({(cosmetics ?? []).length})
      </Text>
      {(cosmetics ?? []).length === 0 ? (
        <Text style={[textStyles.caption, styles.note]}>
          Open crates to collect cosmetics. Equipping lands in M8.
        </Text>
      ) : (
        <View style={styles.cosmeticList}>
          {(cosmetics ?? []).map(({ id, cosmetic }) => (
            <View key={id} style={styles.cosmeticRow}>
              <View
                style={[
                  styles.rarityDot,
                  { backgroundColor: colors.rarity[cosmetic.rarity] },
                ]}
              />
              <View style={styles.cosmeticText}>
                <Text style={[textStyles.bodyEmphasis, styles.cosmeticName]}>
                  {cosmetic.name}
                </Text>
                <Text style={[textStyles.caption, styles.note]}>
                  {cosmetic.slot} · {cosmetic.rarity}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {reveal && (
        <RevealModal result={reveal} onClose={() => setReveal(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  heading: {
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  note: {
    color: colors.textSecondary,
  },
  crateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  crateCard: {
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  crateImage: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
  },
  crateName: {
    color: colors.textPrimary,
  },
  cosmeticList: {
    gap: spacing.xs,
  },
  cosmeticRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  rarityDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cosmeticText: {
    flex: 1,
  },
  cosmeticName: {
    color: colors.textPrimary,
  },
  revealBackdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  revealCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  rarityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
  rarityChipLabel: {
    color: colors.textOnPrimary,
  },
  revealName: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  revealSlot: {
    color: colors.textSecondary,
  },
  dupeNote: {
    color: colors.celebration,
    textAlign: 'center',
  },
});
