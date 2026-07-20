import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getAsset, type AssetSlot } from '@/assets/registry';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { HappinessMeter } from '@/features/beaver/HappinessMeter';
import { useBuyCrate, useBuySnack } from '@/features/economy/useEconomy';
import { useMyCoins, useProfile } from '@/features/profile/useProfile';
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
  const { data: coins } = useMyCoins(userId);
  const { data: profile } = useProfile(userId);
  const buyCrate = useBuyCrate(userId);
  const buySnack = useBuySnack(userId);
  const balance = coins ?? 0;
  const happiness = profile?.happiness ?? config.careLoop.startingHappiness;
  const snack = config.careLoop.snack;

  const buyTheSnack = () => {
    Alert.alert(
      'Snack',
      `Feed your beaver for ${snack.cost} coins? (+${snack.restore} Happiness)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () =>
            buySnack.mutate(undefined, {
              onSuccess: (newHappiness) =>
                Alert.alert('Yum!', `Happiness is now ${newHappiness}/100.`),
              onError: (e) =>
                Alert.alert(
                  'Purchase failed',
                  e instanceof Error ? e.message : 'Try again.',
                ),
            }),
        },
      ],
    );
  };

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
          <Ionicons name="cash" size={16} color={colors.celebration} />
          <Text style={[textStyles.bodyEmphasis, styles.balanceLabel]}>
            {balance}
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

      <Text style={[textStyles.header, styles.sectionTitle]}>Vending machine</Text>
      <View style={[styles.snackCard, elevation.card]}>
        <View style={styles.snackHeader}>
          <Image source={getAsset('snackTreat')} style={styles.snackArt} />
          <View style={styles.snackText}>
            <Text style={[textStyles.headerS, styles.crateName]}>Snack</Text>
            <Text style={[textStyles.caption, styles.snackNote]}>
              +{snack.restore} Happiness · {snack.cost} coins
            </Text>
          </View>
        </View>
        <HappinessMeter happiness={happiness} />
        <PressButton
          label={balance >= snack.cost ? 'BUY SNACK' : 'NOT ENOUGH'}
          disabled={balance < snack.cost || buySnack.isPending}
          onPress={buyTheSnack}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
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
  sectionTitle: {
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  snackCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  snackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  snackArt: { width: 48, height: 48 },
  snackText: { flex: 1, gap: spacing.xxs },
  snackNote: { color: colors.textSecondary },
});
