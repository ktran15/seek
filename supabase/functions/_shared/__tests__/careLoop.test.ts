import { config } from '../../../../src/config';
import { clampHappiness, settleHappiness, settleStreak } from '../careLoop';

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

describe('config care-loop TUNE values (decided §18)', () => {
  it('starts a beaver at 70 with the decided amounts', () => {
    expect(startingHappiness).toBe(70);
    expect(dailyDecay).toBe(10);
    expect(completionRestore).toBe(20);
    expect(snack).toEqual({ cost: 25, restore: 15 });
  });
});
