import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { config } from '@/config';
import { useMySubmissions } from '@/features/challenge/useChallenge';
import { useFriendCount } from '@/features/friends/useFriends';

import { pushContentFor } from '../../../supabase/functions/_shared/push';
import { planLocalNotifications } from './localPlan';

/**
 * Replace everything scheduled with the current plan. Cancel-all is safe:
 * this module is the only scheduler in the app. No-op without permission
 * (spec §13: degrade gracefully — never re-prompt outside onboarding).
 */
async function syncLocalNotifications(
  submittedDays: ReadonlySet<number>,
  friendCount: number,
): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;

    const plans = planLocalNotifications({
      now: new Date(),
      startDate: config.beta.startDate,
      lengthDays: config.beta.lengthDays,
      eveningHour: config.notifications.eveningReminderHour,
      submittedDays,
      friendCount,
      nudge: config.invites.nudge,
    });

    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const plan of plans) {
      const content = pushContentFor(plan.kind);
      await Notifications.scheduleNotificationAsync({
        identifier: plan.id,
        content: {
          title: content.title,
          body: content.body,
          data: { url: content.url },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: plan.fireDate,
        },
      });
    }
  } catch (e) {
    // Local scheduling is garnish — never surface a failure.
    console.warn('[push] local notification sync failed', e);
  }
}

/** Everything already fired or scheduled goes when the account leaves. */
export async function clearLocalNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Best-effort.
  }
}

/**
 * Keeps the device's local notification schedule in step with reality
 * (spec §13): re-syncs when the submissions/friends data changes (completing
 * today drops today's reminder; reaching the friend threshold drops the
 * nudge) and on every app foreground (day rollover while backgrounded).
 */
export function useLocalNotificationSync(userId: string | undefined): void {
  const { data: submissions } = useMySubmissions(userId);
  const friendCount = useFriendCount(userId);

  // Derived deps: a stable string so the effect fires on real changes, not
  // on every refetch's fresh array identity.
  const submittedKey = (submissions ?? [])
    .filter((s) => s.state === 'submitted')
    .map((s) => s.beta_day)
    .sort((a, b) => a - b)
    .join(',');

  useEffect(() => {
    if (!userId || submissions === undefined) return;

    const submittedDays = new Set(
      submittedKey.length > 0 ? submittedKey.split(',').map(Number) : [],
    );
    syncLocalNotifications(submittedDays, friendCount);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncLocalNotifications(submittedDays, friendCount);
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, submissions === undefined, submittedKey, friendCount]);
}
