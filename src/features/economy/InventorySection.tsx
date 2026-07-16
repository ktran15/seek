import { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAsset, type AssetSlot } from '@/assets/registry';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { BeaverPreview } from '@/features/beaver/BeaverPreview';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import type { AvatarConfig } from '@/lib/database.types';
import { colors, elevation, radii, spacing, textStyles } from '@/theme';

import {
  useCosmeticsCatalog,
  useMyCosmetics,
  useMyCrates,
  useOpenCrate,
  type Cosmetic,
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
 * Equip preview (spec §10): tap a cosmetic → see it ON the beaver →
 * confirm = equip (persists to avatar_config.equipped); unequip empties the
 * slot (the beaver starts plain, §18 — no base gear). The preview shows the
 * full current look with this one slot swapped, so the layered z-order is
 * what you'll get.
 */
function EquipPreviewModal({
  cosmetic,
  avatar,
  happiness,
  catalog,
  saving,
  onEquip,
  onUnequip,
  onClose,
}: {
  cosmetic: Cosmetic;
  avatar: AvatarConfig;
  happiness: number;
  catalog: Cosmetic[];
  saving: boolean;
  onEquip: () => void;
  onUnequip: () => void;
  onClose: () => void;
}) {
  const isEquipped = avatar.equipped?.[cosmetic.slot] === cosmetic.id;
  const draft: AvatarConfig = {
    ...avatar,
    equipped: { ...(avatar.equipped ?? {}), [cosmetic.slot]: cosmetic.id },
  };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.revealBackdrop}>
        <View style={[styles.revealCard, elevation.card]}>
          <View style={[styles.rarityChip, { backgroundColor: colors.rarity[cosmetic.rarity] }]}>
            <Text style={[textStyles.caption, styles.rarityChipLabel]}>
              {cosmetic.rarity.toUpperCase()}
            </Text>
          </View>
          <Text style={[textStyles.headerL, styles.revealName]}>{cosmetic.name}</Text>
          <BeaverPreview config={draft} happiness={happiness} cosmetics={catalog} />
          <PressButton
            label={saving ? 'SAVING…' : isEquipped ? 'UNEQUIP' : 'EQUIP'}
            disabled={saving}
            onPress={isEquipped ? onUnequip : onEquip}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            onPress={onClose}
            style={styles.cancelButton}
          >
            <Text style={[textStyles.bodyEmphasis, styles.cancelLabel]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Profile → Inventory (spec §9.3 LOCKED gacha pattern, §10): unopened crates
 * open deliberately here; owned cosmetics below — tap to preview/equip.
 */
export function InventorySection({ userId }: { userId: string | undefined }) {
  const { data: crates } = useMyCrates(userId);
  const { data: cosmetics } = useMyCosmetics(userId);
  const { data: catalog } = useCosmeticsCatalog();
  const { data: profile } = useProfile(userId);
  const updateProfile = useUpdateProfile(userId);
  const openCrate = useOpenCrate(userId);
  const [reveal, setReveal] = useState<CrateOpenResult | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Cosmetic | null>(null);
  const [saving, setSaving] = useState(false);

  const unopened = (crates ?? []).filter((c) => !c.opened);
  const avatarConfig = profile?.avatar_config ?? {};

  const setEquipped = async (slot: string, cosmeticId: string | undefined) => {
    setSaving(true);
    try {
      const equipped = { ...(avatarConfig.equipped ?? {}) };
      if (cosmeticId) {
        equipped[slot] = cosmeticId;
      } else {
        delete equipped[slot];
      }
      await updateProfile({ avatar_config: { ...avatarConfig, equipped } });
      setPreviewing(null);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

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
          Low on crates? Complete challenges, win matchups, or visit the Shop.
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
          Open crates to collect cosmetics.
        </Text>
      ) : (
        <View style={styles.cosmeticList}>
          {(cosmetics ?? []).map(({ id, cosmetic }) => {
            const equipped = avatarConfig.equipped?.[cosmetic.slot] === cosmetic.id;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`Preview ${cosmetic.name}`}
                accessibilityState={{ selected: equipped }}
                onPress={() => setPreviewing(cosmetic)}
                style={styles.cosmeticRow}
              >
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
                {equipped && (
                  <View style={styles.equippedBadge}>
                    <Text style={[textStyles.caption, styles.equippedLabel]}>
                      EQUIPPED
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {reveal && (
        <RevealModal result={reveal} onClose={() => setReveal(null)} />
      )}
      {previewing && (
        <EquipPreviewModal
          cosmetic={previewing}
          avatar={avatarConfig}
          happiness={profile?.happiness ?? config.careLoop.startingHappiness}
          catalog={catalog ?? []}
          saving={saving}
          onEquip={() => void setEquipped(previewing.slot, previewing.id)}
          onUnequip={() => void setEquipped(previewing.slot, undefined)}
          onClose={() => setPreviewing(null)}
        />
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
  equippedBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  equippedLabel: {
    color: colors.textPrimary,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  cancelLabel: {
    color: colors.textSecondary,
  },
});
