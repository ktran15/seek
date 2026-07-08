import {
  addDays,
  betaDayInTimezone,
  dateInTimezone,
  dayCloseInstant,
  inPreCloseWindow,
  utcInstantOfLocalMidnight,
} from '../betaDay';

const NY = 'America/New_York';

describe('dateInTimezone', () => {
  it('rolls the date at the timezone boundary, not UTC', () => {
    // 03:00 UTC on July 8 is still 23:00 July 7 in New York (EDT, UTC-4).
    const lateNight = new Date('2026-07-08T03:00:00Z');
    expect(dateInTimezone(NY, lateNight)).toBe('2026-07-07');
    expect(dateInTimezone('UTC', lateNight)).toBe('2026-07-08');
  });
});

describe('betaDayInTimezone (global beta clock, spec §7.7)', () => {
  const start = '2026-07-06';

  it('day 1 is the start date itself', () => {
    expect(betaDayInTimezone(start, NY, new Date('2026-07-06T16:00:00Z'))).toBe(1);
  });

  it('vote-window edge: still day 3 at 23:59 EST, day 4 at midnight', () => {
    // Day 3 = 2026-07-08 in NY. 23:59 EDT = 03:59 UTC next day.
    expect(betaDayInTimezone(start, NY, new Date('2026-07-09T03:59:00Z'))).toBe(3);
    expect(betaDayInTimezone(start, NY, new Date('2026-07-09T04:00:00Z'))).toBe(4);
  });

  it('before the start date is day 0 or negative', () => {
    expect(betaDayInTimezone(start, NY, new Date('2026-07-05T12:00:00Z'))).toBeLessThan(1);
  });

  it('after 7 days the beta is over', () => {
    expect(betaDayInTimezone(start, NY, new Date('2026-07-14T12:00:00Z'))).toBe(9);
  });
});

describe('dayCloseInstant (vote close, spec §7.7)', () => {
  const start = '2026-07-06';

  it('day 3 closes at NY midnight = 04:00 UTC in July (EDT)', () => {
    expect(dayCloseInstant(start, NY, 3).toISOString()).toBe(
      '2026-07-09T04:00:00.000Z',
    );
  });

  it('handles EST (winter, UTC-5)', () => {
    expect(utcInstantOfLocalMidnight('2026-01-15', NY).toISOString()).toBe(
      '2026-01-15T05:00:00.000Z',
    );
  });

  it('addDays crosses month boundaries', () => {
    expect(addDays('2026-07-30', 3)).toBe('2026-08-02');
  });
});

describe('inPreCloseWindow (vote-countdown push window, spec §13)', () => {
  const start = '2026-07-06';
  // Day 3 closes 2026-07-09T04:00:00Z (NY midnight, EDT) → window opens 02:00Z.

  it('opens exactly 2h before close and stays open until close', () => {
    expect(inPreCloseWindow(start, NY, 3, new Date('2026-07-09T01:59:59Z'))).toBe(false);
    expect(inPreCloseWindow(start, NY, 3, new Date('2026-07-09T02:00:00Z'))).toBe(true);
    expect(inPreCloseWindow(start, NY, 3, new Date('2026-07-09T03:30:00Z'))).toBe(true);
  });

  it('closes at the close instant itself (the result push takes over)', () => {
    expect(inPreCloseWindow(start, NY, 3, new Date('2026-07-09T04:00:00Z'))).toBe(false);
  });

  it('is a no-op on every other day of the beta', () => {
    expect(inPreCloseWindow(start, NY, 3, new Date('2026-07-08T03:00:00Z'))).toBe(false);
    expect(inPreCloseWindow(start, NY, 3, new Date('2026-07-10T03:00:00Z'))).toBe(false);
  });

  it('honors a custom lead time', () => {
    expect(inPreCloseWindow(start, NY, 3, new Date('2026-07-09T01:30:00Z'), 3)).toBe(true);
  });
});
