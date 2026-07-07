import {
  pickOpponent,
  resolveFriendMatch,
  resolveMascotMatch,
  type H2HEntry,
} from '../h2hLogic';

function entry(overrides: Partial<H2HEntry>): H2HEntry {
  return {
    userId: 'user-a',
    score: null,
    passed: true,
    submittedAt: '2026-07-06T12:00:00Z',
    ...overrides,
  };
}

describe('resolveFriendMatch', () => {
  const A = 'user-a';
  const B = 'user-b';

  describe('lower_time (day 1)', () => {
    it('lower time wins', () => {
      const a = entry({ userId: A, score: 8 });
      const b = entry({ userId: B, score: 12 });
      expect(resolveFriendMatch('lower_time', a, b)).toBe(A);
      expect(resolveFriendMatch('lower_time', b, a)).toBe(A);
    });

    it('tie goes to the earlier submission', () => {
      const a = entry({ userId: A, score: 10, submittedAt: '2026-07-06T15:00:00Z' });
      const b = entry({ userId: B, score: 10, submittedAt: '2026-07-06T11:00:00Z' });
      expect(resolveFriendMatch('lower_time', a, b)).toBe(B);
    });
  });

  describe('fewer_guesses (day 2)', () => {
    it('fewer guesses wins', () => {
      const a = entry({ userId: A, score: 3 });
      const b = entry({ userId: B, score: 5 });
      expect(resolveFriendMatch('fewer_guesses', a, b)).toBe(A);
    });

    it('an X loses to any solve, even a 6', () => {
      const x = entry({ userId: A, score: 7, passed: false, submittedAt: '2026-07-06T09:00:00Z' });
      const solve = entry({ userId: B, score: 6, passed: true, submittedAt: '2026-07-06T22:00:00Z' });
      expect(resolveFriendMatch('fewer_guesses', x, solve)).toBe(B);
      expect(resolveFriendMatch('fewer_guesses', solve, x)).toBe(B);
    });

    it('both X falls back to the earlier submission', () => {
      const a = entry({ userId: A, score: 7, passed: false, submittedAt: '2026-07-06T10:00:00Z' });
      const b = entry({ userId: B, score: 7, passed: false, submittedAt: '2026-07-06T11:00:00Z' });
      expect(resolveFriendMatch('fewer_guesses', a, b)).toBe(A);
    });
  });

  describe('higher_made_count (day 4 Hard)', () => {
    it('more makes wins', () => {
      const a = entry({ userId: A, score: 5 });
      const b = entry({ userId: B, score: 3 });
      expect(resolveFriendMatch('higher_made_count', a, b)).toBe(A);
    });
  });

  describe('higher_count (day 5)', () => {
    it('higher count wins', () => {
      const a = entry({ userId: A, score: 12 });
      const b = entry({ userId: B, score: 20 });
      expect(resolveFriendMatch('higher_count', a, b)).toBe(B);
    });

    it('tie goes to the earlier submission (spec §7.1 LOCKED)', () => {
      const a = entry({ userId: A, score: 9, submittedAt: '2026-07-06T18:00:00Z' });
      const b = entry({ userId: B, score: 9, submittedAt: '2026-07-06T18:30:00Z' });
      expect(resolveFriendMatch('higher_count', a, b)).toBe(A);
    });
  });

  describe('degenerate scores', () => {
    it('a missing score loses to a real one', () => {
      const a = entry({ userId: A, score: null });
      const b = entry({ userId: B, score: 1 });
      expect(resolveFriendMatch('higher_count', a, b)).toBe(B);
      expect(resolveFriendMatch('lower_time', a, b)).toBe(B);
    });

    it('identical everything resolves deterministically', () => {
      const a = entry({ userId: A, score: 4 });
      const b = entry({ userId: B, score: 4 });
      expect(resolveFriendMatch('lower_time', a, b)).toBe(
        resolveFriendMatch('lower_time', b, a),
      );
    });
  });
});

describe('resolveMascotMatch', () => {
  it('lower_time: beat or match the target', () => {
    expect(resolveMascotMatch('lower_time', entry({ score: 10 }), 12)).toBe(true);
    expect(resolveMascotMatch('lower_time', entry({ score: 12 }), 12)).toBe(true); // tie → user
    expect(resolveMascotMatch('lower_time', entry({ score: 15 }), 12)).toBe(false);
  });

  it('fewer_guesses: an X never beats the mascot', () => {
    expect(
      resolveMascotMatch('fewer_guesses', entry({ score: 7, passed: false }), 4),
    ).toBe(false);
    expect(resolveMascotMatch('fewer_guesses', entry({ score: 3 }), 4)).toBe(true);
  });

  it('higher rules: meet or beat the target', () => {
    expect(resolveMascotMatch('higher_made_count', entry({ score: 3 }), 3)).toBe(true);
    expect(resolveMascotMatch('higher_count', entry({ score: 5 }), 8)).toBe(false);
  });

  it('missing score loses', () => {
    expect(resolveMascotMatch('higher_count', entry({ score: null }), 8)).toBe(false);
  });
});

describe('pickOpponent (friend cycling, spec §7.6)', () => {
  const first = () => 0; // deterministic: always picks pool[0]

  it('returns null with zero friends (mascot path)', () => {
    expect(pickOpponent([], [], first)).toBeNull();
  });

  it('draws only from un-faced friends', () => {
    expect(pickOpponent(['f1', 'f2', 'f3'], ['f1'], first)).toBe('f2');
  });

  it('with one friend they are the rival every H2H day (cycle resets)', () => {
    expect(pickOpponent(['only'], ['only'], first)).toBe('only');
  });

  it('resets the cycle when everyone has been faced', () => {
    const picked = pickOpponent(['f1', 'f2'], ['f1', 'f2'], first);
    expect(picked).toBe('f1');
  });

  it('with two friends you face both across the week', () => {
    const one = pickOpponent(['f1', 'f2'], [], first);
    const two = pickOpponent(['f1', 'f2'], [one as string], first);
    expect(new Set([one, two])).toEqual(new Set(['f1', 'f2']));
  });

  it('never picks an already-faced friend while un-faced remain', () => {
    for (let i = 0; i < 20; i++) {
      const picked = pickOpponent(['f1', 'f2', 'f3', 'f4'], ['f2', 'f4']);
      expect(['f1', 'f3']).toContain(picked);
    }
  });
});
