import { currentBetaDay, dayState, POST_BETA, PRE_BETA } from '../betaCalendar';

const START = '2026-07-13';

describe('currentBetaDay (local-midnight availability, spec §8)', () => {
  it('is PRE_BETA before the start date', () => {
    expect(currentBetaDay(new Date(2026, 6, 12, 23, 59), START)).toBe(PRE_BETA);
  });

  it('rolls to day 1 at local midnight of the start date', () => {
    expect(currentBetaDay(new Date(2026, 6, 13, 0, 1), START)).toBe(1);
  });

  it('maps each date to its day through day 7', () => {
    expect(currentBetaDay(new Date(2026, 6, 15, 12, 0), START)).toBe(3);
    expect(currentBetaDay(new Date(2026, 6, 19, 23, 59), START)).toBe(7);
  });

  it('is POST_BETA after day 7', () => {
    expect(currentBetaDay(new Date(2026, 6, 20, 0, 1), START)).toBe(POST_BETA);
  });
});

describe('dayState (spec §5/§8)', () => {
  const submitted = new Set([1, 2]);

  it('marks submitted days completed regardless of position', () => {
    expect(dayState(1, 3, submitted)).toBe('completed');
    expect(dayState(2, 3, submitted)).toBe('completed');
  });

  it('marks today current when not submitted', () => {
    expect(dayState(3, 3, submitted)).toBe('current');
  });

  it('marks today completed once submitted (one attempt done)', () => {
    expect(dayState(3, 3, new Set([3]))).toBe('completed');
  });

  it('marks past unsubmitted days missed — no makeups', () => {
    expect(dayState(1, 3, new Set())).toBe('missed');
  });

  it('marks future days locked', () => {
    expect(dayState(4, 3, submitted)).toBe('locked');
    expect(dayState(7, 3, submitted)).toBe('locked');
  });

  it('locks everything pre-beta', () => {
    expect(dayState(1, PRE_BETA, new Set())).toBe('locked');
    expect(dayState(7, PRE_BETA, new Set())).toBe('locked');
  });

  it('marks unsubmitted days missed post-beta', () => {
    expect(dayState(5, POST_BETA, submitted)).toBe('missed');
    expect(dayState(1, POST_BETA, submitted)).toBe('completed');
  });
});
