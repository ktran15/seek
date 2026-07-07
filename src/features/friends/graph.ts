/**
 * Pure friend-graph helpers (spec §7.10 — unit-tested set logic).
 *
 * Runtime split: queries that only need MY edges (visible under RLS) use these
 * helpers client-side; queries needing OTHER users' edges (FoF, block-aware
 * search) run in the SECURITY DEFINER SQL functions of migration
 * 20260706000002. `computeFofIds` is the unit-tested reference implementation
 * of `get_fof_profiles` — keep the two in sync when either changes.
 */

export interface FriendshipEdge {
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface BlockEdge {
  blocker_id: string;
  blocked_id: string;
}

export type Relationship =
  | 'none'
  | 'outgoing' // I requested, they haven't responded
  | 'incoming' // they requested me
  | 'friends'
  | 'declined';

/** Relationship between me and one other user, from my visible edges. */
export function relationshipWith(
  edges: FriendshipEdge[],
  myId: string,
  otherId: string,
): Relationship {
  const edge = edges.find(
    (e) =>
      (e.requester_id === myId && e.addressee_id === otherId) ||
      (e.requester_id === otherId && e.addressee_id === myId),
  );
  if (!edge) return 'none';
  if (edge.status === 'accepted') return 'friends';
  if (edge.status === 'declined') return 'declined';
  return edge.requester_id === myId ? 'outgoing' : 'incoming';
}

/** True if either user blocks the other (mirrors SQL is_blocked_pair). */
export function isBlockedPair(blocks: BlockEdge[], a: string, b: string): boolean {
  return blocks.some(
    (blockEdge) =>
      (blockEdge.blocker_id === a && blockEdge.blocked_id === b) ||
      (blockEdge.blocker_id === b && blockEdge.blocked_id === a),
  );
}

/** Accepted-friend ids of `userId`, minus blocked pairs (mirrors get_friend_ids). */
export function friendIdsOf(
  edges: FriendshipEdge[],
  userId: string,
  blocks: BlockEdge[] = [],
): string[] {
  return edges
    .filter(
      (e) =>
        e.status === 'accepted' &&
        (e.requester_id === userId || e.addressee_id === userId),
    )
    .map((e) => (e.requester_id === userId ? e.addressee_id : e.requester_id))
    .filter((friendId) => !isBlockedPair(blocks, userId, friendId));
}

/**
 * Friends-of-friends of `myId` (spec §7.10): one hop out, excluding self,
 * existing friends, and anyone in a blocked pair with me or with the bridging
 * friend. Reference implementation of the get_fof_profiles SQL function.
 */
export function computeFofIds(
  edges: FriendshipEdge[],
  myId: string,
  blocks: BlockEdge[] = [],
): string[] {
  const myFriends = friendIdsOf(edges, myId, blocks);
  const myFriendSet = new Set(myFriends);
  const fof = new Set<string>();

  for (const friendId of myFriends) {
    for (const candidate of friendIdsOf(edges, friendId, blocks)) {
      if (candidate === myId) continue;
      if (myFriendSet.has(candidate)) continue;
      if (isBlockedPair(blocks, myId, candidate)) continue;
      fof.add(candidate);
    }
  }
  return [...fof];
}
