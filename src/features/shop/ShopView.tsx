import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getAsset, type AssetSlot } from '@/assets/registry';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { useBuyCrate } from '@/features/economy/useEconomy';
import { useProfile } from '@/features/profile/useProfile';
import { colors, elevation, radii, spacing, textStyles } from '@/theme';

type BuyableTier = 'wood' | 'blue' | 'red' | 'yellow';

interface ShopCrate {
  name: string;
  tier: BuyableTier;
  slot: AssetSlot;
  price: number;
}

/** Buyable crates only — gold is prize-only (spec §9.3). Static grid (§9.5). */
const CRATES: ShopCrate[] = [
  { name: 'Wooden Crate', tier: 'wood', slot: 'crateWooden', price: config.economy.cratePrices.wood ?? 0 },
  { name: 'Blue Crate', tier: 'blue', slot: 'crateBlue', price: config.economy.cratePrices.blue ?? 0 },
  { name: 'Red Crate', tier: 'red', slot: 'crateRed', price: config.economy.cratePrices.red ?? 0 },
  { name: 'Yellow Crate', tier: 'yellow', slot: 'crateYellow', price: config.economy.cratePrices.yellow ?? 0 },
];

/** Shop (spec §9.5): crate grid, earned-coin economy — no IAP, no ads. */
export function ShopView() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: profile } = useProfile(userId);
  const buyCrate = useBuyCrate(userId);
  const balance = profile?.coins ?? 0;

  const buy = (crate: ShopCrate) => {
    Alert.alert(crate.name, `Buy for ${crate.price} coins?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Buy',
        onPress: () =>
          buyCrate.mutate(crate.tier, {
            onSuccess: () =>
              Alert.alert(
                'Added to inventory',
                `${crate.name} is waiting in Profile → Inventory.`,
              ),
            onError: (e) =>
              Alert.alert(
                'Purchase failed',
                e instanceof Error ? e.message : 'Try again.',
              ),
          }),
      },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[textStyles.hero, styles.title]}>Shop</Text>
        <View style={styles.balancePill}>
          <Text style={[textStyles.bodyEmphasis, styles.balanceLabel]}>
            🪙 {balance}
          </Text>
        </View>
      </View>
      <View style={styles.grid}>
        {CRATES.map((crate) => {
          const affordable = balance >= crate.price;
          return (
            <View key={crate.slot} style={[styles.card, elevation.card]}>
              <Image source={getAsset(crate.slot)} style={styles.crateImage} />
              <Text style={[textStyles.headerS, styles.crateName]}>{crate.name}</Text>
              <Text style={[textStyles.bodyEmphasis, styles.price]}>
                {crate.price} coins
              </Text>
              <PressButton
                label={affordable ? 'BUY' : 'NOT ENOUGH'}
                disabled={!affordable || buyCrate.isPending}
                onPress={() => buy(crate)}
              />
            </View>
          );
        })}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
  },
  balancePill: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  balanceLabel: {
    color: colors.celebration,
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
