import {
  computeFofIds,
  friendIdsOf,
  isBlockedPair,
  relationshipWith,
  type BlockEdge,
  type FriendshipEdge,
} from '../graph';

const edge = (
  requester: string,
  addressee: string,
  status: FriendshipEdge['status'] = 'accepted',
): FriendshipEdge => ({
  requester_id: requester,
  addressee_id: addressee,
  status,
});

const block = (blocker: string, blocked: string): BlockEdge => ({
  blocker_id: blocker,
  blocked_id: blocked,
});

describe('relationshipWith', () => {
  it('returns none when no edge exists', () => {
    expect(relationshipWith([], 'me', 'x')).toBe('none');
  });

  it('distinguishes outgoing vs incoming pending requests', () => {
    expect(relationshipWith([edge('me', 'x', 'pending')], 'me', 'x')).toBe('outgoing');
    expect(relationshipWith([edge('x', 'me', 'pending')], 'me', 'x')).toBe('incoming');
  });

  it('returns friends for accepted in either direction', () => {
    expect(relationshipWith([edge('me', 'x')], 'me', 'x')).toBe('friends');
    expect(relationshipWith([edge('x', 'me')], 'me', 'x')).toBe('friends');
  });

  it('returns declined regardless of direction', () => {
    expect(relationshipWith([edge('me', 'x', 'declined')], 'me', 'x')).toBe('declined');
  });

  it('ignores edges involving other users', () => {
    expect(relationshipWith([edge('a', 'b')], 'me', 'x')).toBe('none');
  });
});

describe('isBlockedPair', () => {
  it('detects blocks in both directions', () => {
    expect(isBlockedPair([block('a', 'b')], 'a', 'b')).toBe(true);
    expect(isBlockedPair([block('a', 'b')], 'b', 'a')).toBe(true);
    expect(isBlockedPair([block('a', 'b')], 'a', 'c')).toBe(false);
  });
});

describe('friendIdsOf', () => {
  it('returns accepted friends from either edge direction', () => {
    const edges = [edge('me', 'a'), edge('b', 'me'), edge('me', 'c', 'pending')];
    expect(friendIdsOf(edges, 'me').sort()).toEqual(['a', 'b']);
  });

  it('excludes pending and declined edges', () => {
    const edges = [edge('me', 'a', 'pending'), edge('b', 'me', 'declined')];
    expect(friendIdsOf(edges, 'me')).toEqual([]);
  });

  it('excludes blocked pairs in either direction', () => {
    const edges = [edge('me', 'a'), edge('me', 'b')];
    expect(friendIdsOf(edges, 'me', [block('a', 'me')])).toEqual(['b']);
    expect(friendIdsOf(edges, 'me', [block('me', 'b')])).toEqual(['a']);
  });
});

describe('computeFofIds (egocentric FoF, spec §7.10)', () => {
  // me — a — x ; me — b — y ; a — b (friends with each other)
  const edges = [
    edge('me', 'a'),
    edge('b', 'me'),
    edge('a', 'x'),
    edge('y', 'b'),
    edge('a', 'b'),
  ];

  it('finds one-hop-out users through any accepted friend', () => {
    expect(computeFofIds(edges, 'me').sort()).toEqual(['x', 'y']);
  });

  it('excludes self and existing friends', () => {
    const ids = computeFofIds(edges, 'me');
    expect(ids).not.toContain('me');
    expect(ids).not.toContain('a');
    expect(ids).not.toContain('b');
  });

  it('excludes pending bridges', () => {
    const withPending = [...edges, edge('x', 'z', 'pending')];
    expect(computeFofIds(withPending, 'me')).not.toContain('z');
  });

  it('excludes candidates in a blocked pair with me', () => {
    expect(computeFofIds(edges, 'me', [block('x', 'me')])).toEqual(['y']);
  });

  it('excludes candidates whose bridge friend is in a blocked pair with them', () => {
    // a—x blocked: x unreachable through a, and there is no other bridge.
    expect(computeFofIds(edges, 'me', [block('a', 'x')])).toEqual(['y']);
  });

  it('deduplicates candidates reachable through multiple friends', () => {
    const diamond = [edge('me', 'a'), edge('me', 'b'), edge('a', 'x'), edge('b', 'x')];
    expect(computeFofIds(diamond, 'me')).toEqual(['x']);
  });

  it('returns empty for a friendless user', () => {
    expect(computeFofIds(edges, 'loner')).toEqual([]);
  });
});
