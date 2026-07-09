import { BADGES, deriveBadges } from '../badges';

const base = {
  submittedDays: new Set<number>(),
  lengthDays: 7,
  h2hWins: 0,
  voteFirsts: 0,
};

function earned(inputs: Partial<typeof base> = {}) {
  return Object.fromEntries(
    deriveBadges({ ...base, ...inputs }).map((b) => [b.id, b.earned]),
  );
}

describe('deriveBadges (spec §6 catalog)', () => {
  it('a brand-new account has earned nothing', () => {
    expect(earned()).toEqual({
      summitReached: false,
      firstWin: false,
      voteWinner: false,
      perfectWeek: false,
    });
  });

  it('Summit Reached = the FINAL day submitted, regardless of others', () => {
    expect(earned({ submittedDays: new Set([7]) }).summitReached).toBe(true);
    expect(earned({ submittedDays: new Set([1, 2, 3, 4, 5, 6]) }).summitReached).toBe(false);
  });

  it('First Win flips on the first H2H win (mascot wins count)', () => {
    expect(earned({ h2hWins: 1 }).firstWin).toBe(true);
    expect(earned({ h2hWins: 3 }).firstWin).toBe(true);
  });

  it('Vote Winner needs a 1st placement, not just entering', () => {
    expect(earned({ voteFirsts: 0 }).voteWinner).toBe(false);
    expect(earned({ voteFirsts: 1 }).voteWinner).toBe(true);
  });

  it('Perfect Week needs EVERY day 1..7 — six of seven is not perfect', () => {
    expect(earned({ submittedDays: new Set([1, 2, 3, 4, 5, 6]) }).perfectWeek).toBe(false);
    expect(earned({ submittedDays: new Set([1, 2, 3, 4, 5, 6, 7]) }).perfectWeek).toBe(true);
  });

  it('Perfect Week implies Summit Reached (day 7 is part of the week)', () => {
    const all = earned({ submittedDays: new Set([1, 2, 3, 4, 5, 6, 7]) });
    expect(all.perfectWeek).toBe(true);
    expect(all.summitReached).toBe(true);
  });

  it('a zero-length beta earns no completion badges (degenerate config)', () => {
    const result = earned({ lengthDays: 0, submittedDays: new Set([1]) });
    expect(result.summitReached).toBe(false);
    expect(result.perfectWeek).toBe(false);
  });

  it('the catalog is exactly the four spec §6 badges with registry slots', () => {
    expect(BADGES.map((b) => b.id)).toEqual([
      'summitReached',
      'firstWin',
      'voteWinner',
      'perfectWeek',
    ]);
    for (const b of BADGES) {
      expect(b.slot.startsWith('badge')).toBe(true);
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.hint.length).toBeGreaterThan(0);
    }
  });
});
