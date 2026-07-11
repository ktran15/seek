import { pickStandout } from '../standout';

const base = { wins: 0, losses: 0, votesWon: 0, coinsEarned: 0, stopsClimbed: 0 };

describe('pickStandout', () => {
  it('returns null for a fresh account (no fake celebration)', () => {
    expect(pickStandout(base)).toBeNull();
  });

  it('picks a winning H2H record first', () => {
    expect(
      pickStandout({ ...base, wins: 3, losses: 1, votesWon: 2, coinsEarned: 500 }),
    ).toEqual({ title: 'Rival slayer', detail: '3–1 head-to-head' });
  });

  it('an even or losing record is not a winning record', () => {
    expect(pickStandout({ ...base, wins: 2, losses: 2 })).toBeNull();
    expect(pickStandout({ ...base, wins: 1, losses: 3 })).toBeNull();
  });

  it('falls to vote wins when the record does not lead', () => {
    expect(pickStandout({ ...base, wins: 1, losses: 1, votesWon: 1 })).toEqual({
      title: 'Crowd favorite',
      detail: '1 community vote win',
    });
    expect(pickStandout({ ...base, votesWon: 2 })?.detail).toBe(
      '2 community vote wins',
    );
  });

  it('celebrates a coin haul only at the threshold', () => {
    expect(pickStandout({ ...base, coinsEarned: 99 })).toBeNull();
    expect(pickStandout({ ...base, coinsEarned: 100 })).toEqual({
      title: 'Coin hauler',
      detail: '100 coins earned',
    });
  });

  it('any trail progress beats nothing', () => {
    expect(pickStandout({ ...base, stopsClimbed: 1, coinsEarned: 50 })).toEqual({
      title: 'On the trail',
      detail: '1 stop climbed',
    });
    expect(pickStandout({ ...base, stopsClimbed: 4 })?.detail).toBe('4 stops climbed');
  });
});
