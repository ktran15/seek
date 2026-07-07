import { config } from '../../../../src/config';
import {
  pickCosmetic,
  rollRarity,
  validateDropRates,
  votePlacementReward,
  type DropRates,
  type Rarity,
} from '../economy';

const WOOD: DropRates = { common: 0.75, rare: 0.2, epic: 0.045, legendary: 0.005 };

describe('validateDropRates', () => {
  it('accepts a table that sums to 1', () => {
    expect(validateDropRates(WOOD)).toBe(true);
  });

  it('rejects tables that do not sum to 1', () => {
    expect(
      validateDropRates({ common: 0.5, rare: 0.2, epic: 0.2, legendary: 0.05 }),
    ).toBe(false);
  });

  it('rejects negative rates', () => {
    expect(
      validateDropRates({ common: 1.2, rare: -0.2, epic: 0, legendary: 0 }),
    ).toBe(false);
  });

  it('validates every TUNE tier in src/config (client/server mirror)', () => {
    for (const rates of Object.values(config.economy.crateDropRates)) {
      expect(validateDropRates(rates)).toBe(true);
    }
  });
});

describe('rollRarity', () => {
  it('maps the roll through cumulative buckets in rarity order', () => {
    expect(rollRarity(WOOD, () => 0)).toBe('common');
    expect(rollRarity(WOOD, () => 0.7499)).toBe('common');
    expect(rollRarity(WOOD, () => 0.75)).toBe('rare');
    expect(rollRarity(WOOD, () => 0.9499)).toBe('rare');
    expect(rollRarity(WOOD, () => 0.95)).toBe('epic');
    expect(rollRarity(WOOD, () => 0.9949)).toBe('epic');
    expect(rollRarity(WOOD, () => 0.995)).toBe('legendary');
    expect(rollRarity(WOOD, () => 0.9999)).toBe('legendary');
  });

  it('lands on legendary when float underflow leaves the roll ≈ 1', () => {
    expect(rollRarity(WOOD, () => 1 - Number.EPSILON)).toBe('legendary');
  });
});

describe('pickCosmetic', () => {
  const catalog = [
    { id: 'c1', rarity: 'common' as Rarity },
    { id: 'c2', rarity: 'common' as Rarity },
    { id: 'r1', rarity: 'rare' as Rarity },
  ];

  it('picks uniformly within the rolled rarity', () => {
    expect(pickCosmetic(catalog, 'common', () => 0)?.id).toBe('c1');
    expect(pickCosmetic(catalog, 'common', () => 0.99)?.id).toBe('c2');
    expect(pickCosmetic(catalog, 'rare', () => 0.5)?.id).toBe('r1');
  });

  it('degrades DOWN when the rolled rarity has no items — never up', () => {
    // Rolled legendary, catalog tops out at rare → falls to rare.
    expect(pickCosmetic(catalog, 'legendary', () => 0)?.id).toBe('r1');
    // Rolled common against a legendary-only catalog → nothing (no upgrade).
    const legendaryOnly = [{ id: 'l1', rarity: 'legendary' as Rarity }];
    expect(pickCosmetic(legendaryOnly, 'common', () => 0)).toBeNull();
  });

  it('returns null for an empty catalog', () => {
    expect(pickCosmetic([], 'common', () => 0)).toBeNull();
  });
});

describe('votePlacementReward', () => {
  const coins = { first: 50, second: 30, third: 20 };
  const points = { first: 5, second: 3, third: 2 };

  it('pays each placement its amounts with the right crate tier', () => {
    expect(votePlacementReward(1, coins, points)).toEqual({
      coins: 50,
      points: 5,
      crateTier: 'yellow', // vote WIN crate (spec §9.3)
    });
    expect(votePlacementReward(2, coins, points)).toEqual({
      coins: 30,
      points: 3,
      crateTier: 'red', // top-3 crate
    });
    expect(votePlacementReward(3, coins, points)).toEqual({
      coins: 20,
      points: 2,
      crateTier: 'red',
    });
  });
});
