import { countVotesByPoster, votePlacement } from '../cvTally';

describe('votePlacement (egocentric, spec §7.7 / §7.10)', () => {
  it('most votes in your friend context places 1st', () => {
    expect(votePlacement(5, [3, 2, 1])).toBe(1);
  });

  it('competition ranking: 2nd and 3rd behind strictly-greater totals', () => {
    expect(votePlacement(3, [5, 2])).toBe(2);
    expect(votePlacement(2, [5, 3, 1])).toBe(3);
  });

  it('outside top-3 places nothing', () => {
    expect(votePlacement(1, [5, 4, 3, 2])).toBeNull();
  });

  it('ties share the higher placement; next place skips (LOCKED)', () => {
    // Two tied at 5 → both 1st…
    expect(votePlacement(5, [5, 2])).toBe(1);
    // …and the 2-vote poster is 3rd, not 2nd.
    expect(votePlacement(2, [5, 5])).toBe(3);
  });

  it('zero votes never places, even alone', () => {
    expect(votePlacement(0, [])).toBeNull();
    expect(votePlacement(0, [0, 0])).toBeNull();
  });
});

describe('countVotesByPoster', () => {
  it('aggregates votes through the submission → poster mapping', () => {
    const posters = new Map([
      ['sub-1', 'alice'],
      ['sub-2', 'bob'],
    ]);
    const votes = [
      { submissionId: 'sub-1' },
      { submissionId: 'sub-1' },
      { submissionId: 'sub-2' },
      { submissionId: 'sub-unknown' }, // ignored
    ];
    const counts = countVotesByPoster(votes, posters);
    expect(counts.get('alice')).toBe(2);
    expect(counts.get('bob')).toBe(1);
    expect(counts.size).toBe(2);
  });
});
