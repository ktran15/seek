import {
  clampHappiness,
  happinessState,
  HAPPINESS_STATES,
} from '../happiness';

describe('happinessState band selection (§10.3)', () => {
  it('maps each band to the right state', () => {
    expect(happinessState(100).id).toBe('thriving');
    expect(happinessState(81).id).toBe('thriving');
    expect(happinessState(80).id).toBe('content');
    expect(happinessState(70).id).toBe('content'); // starting value
    expect(happinessState(61).id).toBe('content');
    expect(happinessState(60).id).toBe('okay');
    expect(happinessState(41).id).toBe('okay');
    expect(happinessState(40).id).toBe('unhappy');
    expect(happinessState(21).id).toBe('unhappy');
    expect(happinessState(20).id).toBe('neglected');
    expect(happinessState(0).id).toBe('neglected');
  });

  it('clamps out-of-range input before selecting', () => {
    expect(happinessState(-10).id).toBe('neglected');
    expect(happinessState(200).id).toBe('thriving');
  });

  it('has 5 contiguous bands covering 0–100 with no gaps', () => {
    expect(HAPPINESS_STATES).toHaveLength(5);
    for (let h = 0; h <= 100; h++) {
      expect(happinessState(h)).toBeDefined();
    }
  });
});

describe('clampHappiness', () => {
  it('rounds and bounds to 0–100', () => {
    expect(clampHappiness(70.4)).toBe(70);
    expect(clampHappiness(-1)).toBe(0);
    expect(clampHappiness(101)).toBe(100);
    expect(clampHappiness(NaN)).toBe(0);
  });
});
