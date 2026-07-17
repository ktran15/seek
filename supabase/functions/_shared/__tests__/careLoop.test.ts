import { config } from '../../../../src/config';
import {
  clampHappiness,
  settleCareRow,
  settleHappiness,
  settleStreak,
  type CareRow,
} from '../careLoop';

const { dailyDecay, completionRestore, snack, startingHappiness } =
  config.careLoop;

describe('clampHappiness', () => {
  it('keeps values inside 0–100 and rounds', () => {
    expect(clampHappiness(-5)).toBe(0);
    expect(clampHappiness(140)).toBe(100);
    expect(clampHappiness(70.6)).toBe(71);
  });
  it('is safe against non-finite input', () => {
    expect(clampHappiness(NaN)).toBe(0);
    expect(clampHappiness(Infinity)).toBe(100);
  });
});

describe('settleHappiness (day close, §10.4)', () => {
  it('adds the restore on a completed day, capped at 100', () => {
    expect(
      settleHappiness(70, { completed: true, decay: dailyDecay, restore: completionRestore }),
    ).toBe(90);
    expect(
      settleHappiness(95, { completed: true, decay: dailyDecay, restore: completionRestore }),
    ).toBe(100); // additive, does not overflow
  });
  it('subtracts the decay on a missed day, floored at 0', () => {
    expect(
      settleHappiness(70, { completed: false, decay: dailyDecay, restore: completionRestore }),
    ).toBe(60);
    expect(
      settleHappiness(5, { completed: false, decay: dailyDecay, restore: completionRestore }),
    ).toBe(0);
  });
  it("completing does not necessarily refill to 100 (it's additive)", () => {
    expect(
      settleHappiness(30, { completed: true, decay: dailyDecay, restore: completionRestore }),
    ).toBe(50);
  });
});

describe('settleStreak (§10.7)', () => {
  it('increments on a completed day', () => {
    expect(settleStreak(0, true)).toBe(1);
    expect(settleStreak(4, true)).toBe(5);
  });
  it('resets to 0 on a missed day', () => {
    expect(settleStreak(6, false)).toBe(0);
  });
});

/**
 * settleCareRow mirrors the `settle_care_day()` SQL UPDATE (migration
 * 20260716000003) — one transform of the row's CURRENT state, gated by
 * happiness_settled_day. These tests pin the two properties the old
 * read-all-then-loop-write day-close code violated.
 */
describe('settleCareRow (settle_care_day SQL mirror)', () => {
  const day = 2;
  const opts = { day, decay: dailyDecay, restore: completionRestore };

  /** buy_snack()'s happiness effect (its SQL: least(100, happiness + restore)). */
  const eatSnack = (row: CareRow): CareRow => ({
    ...row,
    happiness: Math.min(100, row.happiness + snack.restore),
  });

  it('a snack landing mid-settlement is preserved, not clobbered (the race)', () => {
    // Day-close starts: the OLD code snapshotted happiness=70 here and later
    // wrote absolute values computed from that snapshot, erasing anything
    // that committed in between. The SQL settle instead transforms the row
    // as it is WHEN THE UPDATE RUNS — so a snack bought after day-close
    // kicked off but before this profile settled must survive.
    let row: CareRow = { happiness: 70, streak_count: 2, happiness_settled_day: 1 };

    row = eatSnack(row); // concurrent buy_snack commits first: 70 + 15 = 85
    row = settleCareRow(row, { ...opts, completed: true });

    expect(row.happiness).toBe(100); // 85 + 20, capped — snack NOT lost
    expect(row.streak_count).toBe(3);
    expect(row.happiness_settled_day).toBe(day);
  });

  it('same race on a missed day: snack survives alongside the decay', () => {
    let row: CareRow = { happiness: 70, streak_count: 2, happiness_settled_day: 1 };

    row = eatSnack(row); // 85
    row = settleCareRow(row, { ...opts, completed: false });

    expect(row.happiness).toBe(75); // 70 + 15 − 10: both effects land
    expect(row.streak_count).toBe(0);
  });

  it('snack committing AFTER the settle also compounds (either order works)', () => {
    let row: CareRow = { happiness: 70, streak_count: 2, happiness_settled_day: 1 };

    row = settleCareRow(row, { ...opts, completed: true }); // 90
    row = eatSnack(row);

    expect(row.happiness).toBe(100); // 90 + 15, capped
  });

  it('re-settling an already-settled day is a no-op (idempotency gate)', () => {
    const settled: CareRow = { happiness: 90, streak_count: 3, happiness_settled_day: day };

    // A re-run of day-close for the same day, and a stale re-run for an
    // EARLIER day, must both leave the row untouched.
    expect(settleCareRow(settled, { ...opts, completed: true })).toEqual(settled);
    expect(settleCareRow(settled, { ...opts, day: day - 1, completed: false })).toEqual(
      settled,
    );
  });

  it('settles an unsettled row (gate passes when behind)', () => {
    const row = settleCareRow(
      { happiness: 40, streak_count: 0, happiness_settled_day: 0 },
      { ...opts, completed: false },
    );
    expect(row).toEqual({ happiness: 30, streak_count: 0, happiness_settled_day: day });
  });
});

describe('config care-loop TUNE values (decided §18)', () => {
  it('starts a beaver at 70 with the decided amounts', () => {
    expect(startingHappiness).toBe(70);
    expect(dailyDecay).toBe(10);
    expect(completionRestore).toBe(20);
    expect(snack).toEqual({ cost: 25, restore: 15 });
  });
});
