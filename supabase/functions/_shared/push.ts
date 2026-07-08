/**
 * Push-notification copy + Expo Push API plumbing (spec §13) — pure and
 * dependency-free: the client imports the same copy builders for LOCAL
 * scheduled notifications (daily live, evening reminder, invite nudge) that
 * the Edge Functions use for REMOTE pushes (H2H, vote, weekly), so wording
 * and tap-routes can never drift between the two delivery paths.
 */

/** Every §13 trigger. The first four are server-sent; the rest client-local. */
export type PushKind =
  | 'h2h_result'
  | 'vote_result'
  | 'vote_countdown'
  | 'weekly_result'
  | 'daily_challenge'
  | 'evening_reminder'
  | 'invite_nudge';

export interface PushContent {
  title: string;
  body: string;
  /** In-app route the tap lands on (expo-router path). */
  url: string;
}

/** Message shape the Expo Push API accepts (exp.host/--/api/v2/push/send). */
export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  data: { url: string };
}

const ORDINAL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };

/**
 * §13 copy, one place. Payloads are the exact `notifications.payload` shapes
 * the Edge Functions already write (M5/M9) — missing fields degrade to the
 * generic branch rather than throwing mid-award.
 */
export function pushContentFor(
  kind: PushKind,
  payload: Record<string, unknown> = {},
): PushContent {
  switch (kind) {
    case 'h2h_result': {
      const won = payload.won === true;
      const vsMascot = payload.vs_mascot === true;
      if (won) {
        return {
          title: vsMascot ? '⚔️ You beat the mascot!' : '⚔️ Rival defeated!',
          body: 'You won today’s head-to-head — go claim your spoils.',
          url: '/notifications',
        };
      }
      return {
        title: vsMascot
          ? '⚔️ The mascot takes this one'
          : '⚔️ Your rival edged it',
        body: 'Today’s head-to-head slipped away. Reset and go again.',
        url: '/notifications',
      };
    }
    case 'vote_result': {
      const placement =
        typeof payload.placement === 'number' ? payload.placement : null;
      if (placement === 1) {
        return {
          title: '🥇 Best dish of the day!',
          body: 'Your friends crowned your food #1 — rewards inside.',
          url: '/notifications',
        };
      }
      if (placement === 2 || placement === 3) {
        return {
          title: `${placement === 2 ? '🥈' : '🥉'} You took ${ORDINAL[placement]} in the vote!`,
          body: 'Your dish placed with your friends — rewards inside.',
          url: '/notifications',
        };
      }
      return {
        title: '🍽️ The votes are in',
        body: 'See how your dish stacked up with your friends.',
        url: '/notifications',
      };
    }
    case 'vote_countdown':
      return {
        title: '⏳ Voting closes in 2 hours',
        body: 'Crown today’s best dish before the window shuts.',
        url: '/vote',
      };
    case 'weekly_result': {
      const coins = typeof payload.coins === 'number' ? payload.coins : 0;
      if (payload.solo === true) {
        return {
          title: `🏔️ Week complete: +${coins} coins`,
          body: 'You showed up all week — your payout just landed.',
          url: '/notifications',
        };
      }
      if (payload.gold_crate === true) {
        return {
          title: '👑 You topped your leaderboard!',
          body: `+${coins} coins and a GOLD crate are yours.`,
          url: '/notifications',
        };
      }
      const rank = typeof payload.rank === 'number' ? payload.rank : null;
      return {
        title: '🏅 Weekly results are in',
        body:
          rank !== null
            ? `You placed ${ORDINAL[rank] ?? `#${rank}`} — +${coins} coins.`
            : `Your weekly payout landed: +${coins} coins.`,
        url: '/notifications',
      };
    }
    case 'daily_challenge':
      return {
        title: 'Today’s challenge is live — one shot.',
        body: 'One challenge. One attempt. Go get it.',
        url: '/challenge',
      };
    case 'evening_reminder':
      return {
        title: '⛰️ Still one shot left today',
        body: 'Today’s challenge is waiting — it disappears at midnight.',
        url: '/challenge',
      };
    case 'invite_nudge':
      return {
        title: 'Your leaderboard needs rivals',
        body: 'Seek is better with friends — invite one and race them up the mountain.',
        url: '/add-friends',
      };
  }
}

/** Fan one content payload out to every device token a user registered. */
export function toExpoPushMessages(
  tokens: readonly string[],
  content: PushContent,
): ExpoPushMessage[] {
  return tokens.map((to) => ({
    to,
    title: content.title,
    body: content.body,
    sound: 'default',
    data: { url: content.url },
  }));
}

/** The Expo Push API caps requests at 100 messages. */
export function chunkMessages<T>(items: readonly T[], size = 100): T[][] {
  if (size < 1) throw new Error('chunk size must be >= 1');
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export interface PushSendResult {
  sent: number;
  failed: number;
}

/**
 * POST messages to the Expo Push API in 100-message chunks. Never throws:
 * a push is best-effort garnish on an award/resolution — a delivery outage
 * must not fail the caller's DB work. Per-chunk failures are counted, not
 * raised.
 */
export async function sendExpoPush(
  messages: readonly ExpoPushMessage[],
  fetchImpl: FetchLike,
): Promise<PushSendResult> {
  let sent = 0;
  let failed = 0;
  for (const chunk of chunkMessages(messages)) {
    try {
      const res = await fetchImpl(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        failed += chunk.length;
        continue;
      }
      const body = (await res.json()) as {
        data?: Array<{ status?: string }>;
      };
      const tickets = body.data ?? [];
      for (let i = 0; i < chunk.length; i++) {
        if (tickets[i]?.status === 'ok') sent++;
        else failed++;
      }
    } catch {
      failed += chunk.length;
    }
  }
  return { sent, failed };
}
