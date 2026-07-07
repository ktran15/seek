import {
  weeklyPayout,
  weeklyRank,
  weeklyTierPayout,
  type WeeklyPayoutAmounts,
} from '../weekly';

const AMOUNTS: WeeklyPayoutAmounts = { first: 300, top3: 150, top10: 75 };
const SOLO = 75;

describe('weeklyRank', () => {
  it('is competition ranking against the friend circle', () => {
    expect(weeklyRank(50, [10, 20, 30])).toBe(1);
    expect(weeklyRank(20, [50, 10, 30])).toBe(3);
    expect(weeklyRank(5, [50, 40, 30, 20, 10])).toBe(6);
  });

  it('ties share the higher placement', () => {
    // Two tied at the top: both rank 1 (no one strictly greater).
    expect(weeklyRank(50, [50, 20])).toBe(1);
    // Next after a two-way tie above lands at 3.
    expect(weeklyRank(20, [50, 50])).toBe(3);
  });

  it('zero points never ranks (mirrors zero-votes-never-places)', () => {
    expect(weeklyRank(0, [])).toBeNull();
    expect(weeklyRank(0, [0, 0])).toBeNull();
  });
});

describe('weeklyTierPayout', () => {
  it('pays tier boundaries exactly (1 / 2–3 / 4–10 / 11+)', () => {
    expect(weeklyTierPayout(1, AMOUNTS)).toEqual({ coins: 300, goldCrate: true });
    expect(weeklyTierPayout(2, AMOUNTS)).toEqual({ coins: 150, goldCrate: false });
    expect(weeklyTierPayout(3, AMOUNTS)).toEqual({ coins: 150, goldCrate: false });
    expect(weeklyTierPayout(4, AMOUNTS)).toEqual({ coins: 75, goldCrate: false });
    expect(weeklyTierPayout(10, AMOUNTS)).toEqual({ coins: 75, goldCrate: false });
    expect(weeklyTierPayout(11, AMOUNTS)).toBeNull();
    expect(weeklyTierPayout(null, AMOUNTS)).toBeNull();
  });
});

describe('weeklyPayout', () => {
  it('qualified: rank drives the tier; gold crate only for 1st', () => {
    expect(
      weeklyPayout({
        qualified: true,
        myPoints: 60,
        friendPoints: [40, 30, 20],
        completedAny: true,
        amounts: AMOUNTS,
        soloAmount: SOLO,
      }),
    ).toEqual({ coins: 300, goldCrate: true, rank: 1, solo: false });
  });

  it('tied firsts each take the full first-place purse (tie-sharing)', () => {
    const tied = weeklyPayout({
      qualified: true,
      myPoints: 60,
      friendPoints: [60, 30, 10],
      completedAny: true,
      amounts: AMOUNTS,
      soloAmount: SOLO,
    });
    expect(tied).toEqual({ coins: 300, goldCrate: true, rank: 1, solo: false });
  });

  it('qualified but zero points: no payout (inactive circles pay nobody)', () => {
    expect(
      weeklyPayout({
        qualified: true,
        myPoints: 0,
        friendPoints: [0, 0, 0],
        completedAny: false,
        amounts: AMOUNTS,
        soloAmount: SOLO,
      }),
    ).toBeNull();
  });

  it('unqualified with ≥1 completion: flat solo payout, never a gold crate', () => {
    expect(
      weeklyPayout({
        qualified: false,
        myPoints: 999,
        friendPoints: [],
        completedAny: true,
        amounts: AMOUNTS,
        soloAmount: SOLO,
      }),
    ).toEqual({ coins: 75, goldCrate: false, rank: null, solo: true });
  });

  it('unqualified with no completions: nothing (closes friendless auto-1st)', () => {
    expect(
      weeklyPayout({
        qualified: false,
        myPoints: 0,
        friendPoints: [],
        completedAny: false,
        amounts: AMOUNTS,
        soloAmount: SOLO,
      }),
    ).toBeNull();
  });
});
