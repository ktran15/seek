/**
 * "Peak so far" standout pick for the Trail Log stats page (founder-approved
 * direction): one auto-chosen most-impressive stat, celebrated. Pure and
 * unit-tested — the priority order below is the product behavior.
 */

export interface StandoutInput {
  wins: number;
  losses: number;
  votesWon: number;
  coinsEarned: number;
  stopsClimbed: number;
}

export interface Standout {
  title: string;
  detail: string;
}

/** Coins alone only impress at a haul (≈ two completions' worth). */
const COIN_HAUL_THRESHOLD = 100;

/**
 * Priority: winning H2H record → any vote win → a real coin haul → any
 * progress on the trail. `null` = nothing yet (caller shows the fresh-start
 * line instead of fake celebration).
 */
export function pickStandout(input: StandoutInput): Standout | null {
  const { wins, losses, votesWon, coinsEarned, stopsClimbed } = input;
  if (wins > 0 && wins > losses) {
    return { title: 'Rival slayer', detail: `${wins}–${losses} head-to-head` };
  }
  if (votesWon > 0) {
    return {
      title: 'Crowd favorite',
      detail: `${votesWon} community vote ${votesWon === 1 ? 'win' : 'wins'}`,
    };
  }
  if (coinsEarned >= COIN_HAUL_THRESHOLD) {
    return { title: 'Coin hauler', detail: `${coinsEarned} coins earned` };
  }
  if (stopsClimbed > 0) {
    return {
      title: 'On the trail',
      detail: `${stopsClimbed} ${stopsClimbed === 1 ? 'stop' : 'stops'} climbed`,
    };
  }
  return null;
}
