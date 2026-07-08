import { localMidnightOfBetaDay } from '@/lib/betaCalendar';

import type { PushKind } from '../../../supabase/functions/_shared/push';

/**
 * Pure planner for the client-LOCAL scheduled notifications (spec §13):
 * - daily challenge live at the user's local-day boundary,
 * - evening reminder while today's challenge is incomplete (`TUNE` hour),
 * - the one-time invite nudge (`TUNE` day/threshold).
 *
 * Every plan is an ABSOLUTE fire date on the fixed beta calendar, which is
 * what makes the sync idempotent with no stored state: each sync cancels all
 * scheduled notifications and re-schedules exactly this plan, and a date in
 * the past is simply never planned again — so nothing can fire twice, the
 * nudge included ("one nudge max; don't nag", spec §7.8).
 */

export type LocalPushKind = Extract<
  PushKind,
  'daily_challenge' | 'evening_reminder' | 'invite_nudge'
>;

export interface PlannedLocalNotification {
  /** Stable identifier (deterministic per slot) for schedule bookkeeping. */
  id: string;
  kind: LocalPushKind;
  fireDate: Date;
}

/**
 * The nudge's time-of-day. Spec §7.8/§13 fix the day (`TUNE`) but not the
 * hour; midday reaches people without competing with the midnight reveal or
 * the evening reminder. Flagged as an M11 decision.
 */
const NUDGE_HOUR = 12;

export interface LocalPlanInput {
  now: Date;
  /** Beta start 'YYYY-MM-DD' (config.beta.startDate). */
  startDate: string;
  lengthDays: number;
  /** TUNE: local hour (24h) of the incomplete-challenge reminder. */
  eveningHour: number;
  /** Beta days with a submitted attempt (suppresses their reminder). */
  submittedDays: ReadonlySet<number>;
  friendCount: number;
  /** TUNE: config.invites.nudge. */
  nudge: { betaDay: number; friendThreshold: number };
}

export function planLocalNotifications(input: LocalPlanInput): PlannedLocalNotification[] {
  const { now, startDate, lengthDays, eveningHour, submittedDays, friendCount, nudge } =
    input;
  const plans: PlannedLocalNotification[] = [];

  for (let day = 1; day <= lengthDays; day++) {
    const midnight = localMidnightOfBetaDay(day, startDate);
    if (midnight.getTime() > now.getTime()) {
      plans.push({
        id: `daily-challenge-day-${day}`,
        kind: 'daily_challenge',
        fireDate: midnight,
      });
    }

    // Future days are always planned (completion is unknowable ahead of
    // time); completing a day re-syncs and drops that day's reminder.
    const evening = new Date(
      midnight.getFullYear(),
      midnight.getMonth(),
      midnight.getDate(),
      eveningHour,
    );
    if (evening.getTime() > now.getTime() && !submittedDays.has(day)) {
      plans.push({
        id: `evening-reminder-day-${day}`,
        kind: 'evening_reminder',
        fireDate: evening,
      });
    }
  }

  // Threshold is checked at scheduling time (a local notification can't
  // evaluate conditions when it fires); crossing it before the nudge fires
  // re-syncs and cancels. Once the date passes it can never re-plan.
  if (friendCount < nudge.friendThreshold) {
    const nudgeMidnight = localMidnightOfBetaDay(nudge.betaDay, startDate);
    const fireDate = new Date(
      nudgeMidnight.getFullYear(),
      nudgeMidnight.getMonth(),
      nudgeMidnight.getDate(),
      NUDGE_HOUR,
    );
    if (fireDate.getTime() > now.getTime()) {
      plans.push({ id: 'invite-nudge', kind: 'invite_nudge', fireDate });
    }
  }

  return plans.sort((a, b) => a.fireDate.getTime() - b.fireDate.getTime());
}
