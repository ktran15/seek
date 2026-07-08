/**
 * notifyAndPush — insert in-app notification rows AND fan the same event out
 * to every registered device via the Expo Push API (spec §13). Shared by
 * h2h-pair, day-close, weekly-payout and vote-countdown so a result can
 * never reach the in-app list without also attempting the push (and the
 * copy for both comes from the one unit-tested builder in push.ts).
 *
 * The insert is authoritative and throws on failure (callers already treat
 * notification rows as part of the resolution). The push is best-effort
 * garnish: any failure is logged and swallowed — a push outage must never
 * fail an award or make a re-run double-pay.
 */
import {
  pushContentFor,
  sendExpoPush,
  toExpoPushMessages,
  type ExpoPushMessage,
  type PushKind,
} from './push.ts';

// Structural stand-in for SupabaseClient — same sanctioned `any` as
// pairing.ts (justification: spec §2.1; the jsr: import only resolves under
// Deno and the builder chain is impractical to type structurally).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = { from: (table: string) => any };

/** The server-sent §13 triggers (the client-local kinds never hit this path). */
export type ServerPushKind = Extract<
  PushKind,
  'h2h_result' | 'vote_result' | 'weekly_result' | 'vote_countdown'
>;

export interface NotificationInsert {
  user_id: string;
  type: ServerPushKind;
  payload: Record<string, unknown>;
}

/** Every push token per user, one query. */
export async function pushTokensByUser(
  db: Db,
  userIds: readonly string[],
): Promise<Map<string, string[]>> {
  const byUser = new Map<string, string[]>();
  if (userIds.length === 0) return byUser;
  const { data, error } = await db
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', [...new Set(userIds)]);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as Array<{ user_id: string; token: string }>) {
    const tokens = byUser.get(row.user_id) ?? [];
    tokens.push(row.token);
    byUser.set(row.user_id, tokens);
  }
  return byUser;
}

/** Best-effort remote push for already-persisted events. Never throws. */
export async function pushToUsers(
  db: Db,
  rows: readonly NotificationInsert[],
): Promise<void> {
  try {
    const byUser = await pushTokensByUser(
      db,
      rows.map((r) => r.user_id),
    );
    const messages: ExpoPushMessage[] = rows.flatMap((row) =>
      toExpoPushMessages(
        byUser.get(row.user_id) ?? [],
        pushContentFor(row.type, row.payload),
      ),
    );
    if (messages.length > 0) {
      await sendExpoPush(messages, fetch);
    }
  } catch (e) {
    console.error('[push] best-effort send failed', e);
  }
}

/** Insert notification rows (throws on failure), then push (best-effort). */
export async function notifyAndPush(
  db: Db,
  rows: readonly NotificationInsert[],
): Promise<void> {
  const { error } = await db.from('notifications').insert(rows);
  if (error) throw new Error(error.message);
  await pushToUsers(db, rows);
}
