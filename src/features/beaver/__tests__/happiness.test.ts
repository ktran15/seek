import {
  clampHappiness,
  happinessState,
  HAPPINESS_STATES,
} from '../happiness';

describe('happinessState (spec §10.3 LOCKED bands)', () => {
  it('maps each band to its state, including both edges', () => {
    expect(happinessState(100).id).toBe('thriving');
    expect(happinessState(81).id).toBe('thriving');
    expect(happinessState(80).id).toBe('content');
    expect(happinessState(61).id).toBe('content');
    expect(happinessState(60).id).toBe('okay');
    expect(happinessState(41).id).toBe('okay');
    expect(happinessState(40).id).toBe('unhappy');
    expect(happinessState(21).id).toBe('unhappy');
    expect(happinessState(20).id).toBe('neglected');
    expect(happinessState(0).id).toBe('neglected');
  });

  it('starts a new beaver Content (starting Happiness = 70)', () => {
    expect(happinessState(70).id).toBe('content');
  });

  it('covers 0–100 exhaustively with no gaps or overlaps', () => {
    for (let value = 0; value <= 100; value++) {
      const matches = HAPPINESS_STATES.filter(
        (s) => value >= s.min && value <= s.max,
      );
      expect(matches).toHaveLength(1);
    }
  });

  it('clamps out-of-range and garbage rather than blanking the beaver', () => {
    expect(happinessState(999).id).toBe('thriving');
    expect(happinessState(-50).id).toBe('neglected');
    expect(happinessState(Number.NaN).id).toBe('neglected');
  });

  it('clampHappiness rounds into 0–100', () => {
    expect(clampHappiness(70.4)).toBe(70);
    expect(clampHappiness(120)).toBe(100);
    expect(clampHappiness(-1)).toBe(0);
  });
});
