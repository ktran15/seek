import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getAsset, type AssetSlot } from '@/assets/registry';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { colors, elevation, radii, spacing, textStyles } from '@/theme';

interface ShopCrate {
  name: string;
  slot: AssetSlot;
  price: number | undefined;
}

/** Buyable crates only — gold is prize-only (spec §9.3). Static grid (§9.5). */
const CRATES: ShopCrate[] = [
  { name: 'Wooden Crate', slot: 'crateWooden', price: config.economy.cratePrices.wood },
  { name: 'Blue Crate', slot: 'crateBlue', price: config.economy.cratePrices.blue },
  { name: 'Red Crate', slot: 'crateRed', price: config.economy.cratePrices.red },
  { name: 'Yellow Crate', slot: 'crateYellow', price: config.economy.cratePrices.yellow },
];

/** Shop skeleton (spec §9.5): Fortnite-style crate grid. Buying lands in M7. */
export function ShopView() {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={[textStyles.hero, styles.title]}>Shop</Text>
      <Text style={[textStyles.caption, styles.note]}>
        Crates only, earned-coin economy. Buying lands in M7.
      </Text>
      <View style={styles.grid}>
        {CRATES.map((crate) => (
          <View key={crate.slot} style={[styles.card, elevation.card]}>
            <Image source={getAsset(crate.slot)} style={styles.crateImage} />
            <Text style={[textStyles.headerS, styles.crateName]}>{crate.name}</Text>
            <Text style={[textStyles.bodyEmphasis, styles.price]}>
              {crate.price} coins
            </Text>
            <PressButton
              label="BUY"
              onPress={() => Alert.alert(crate.name, 'Purchases land in M7.')}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
  },
  note: {
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  crateImage: {
    width: 88,
    height: 88,
    borderRadius: radii.sm,
  },
  crateName: {
    color: colors.textPrimary,
  },
  price: {
    color: colors.celebration,
  },
});
