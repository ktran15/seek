/**
 * Global fixed 7-day calendar (spec §8): day N is the same calendar date for
 * everyone; availability rolls at the USER'S LOCAL midnight. (Only day 3's
 * vote window runs on the global EST clock — that's M5, not here.)
 */
import { config } from '@/config';

export const PRE_BETA = 0;
export const POST_BETA = config.beta.lengthDays + 1;

/** Parse 'YYYY-MM-DD' as a LOCAL calendar date (not UTC). */
function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

function localDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The user's LOCAL midnight starting beta day N — the instant day N's
 * challenge goes live on this device (spec §8; the M11 "daily challenge
 * live" local notification fires here). Date-constructor overflow keeps it
 * DST-safe: midnight is always the calendar day's real 00:00.
 */
export function localMidnightOfBetaDay(
  day: number,
  startDate: string = config.beta.startDate,
): Date {
  const start = parseLocalDate(startDate);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + (day - 1));
}

/**
 * Current beta day for this user: 1..lengthDays during the beta,
 * PRE_BETA (0) before it starts, POST_BETA after it ends.
 */
export function currentBetaDay(
  now: Date = new Date(),
  startDate: string = config.beta.startDate,
): number {
  const start = parseLocalDate(startDate);
  const today = localDateOnly(now);
  // Round guards DST shifts (a local day is not always exactly 24h).
  const diffDays = Math.round((today.getTime() - start.getTime()) / 86_400_000);
  const day = diffDays + 1;
  if (day < 1) return PRE_BETA;
  if (day > config.beta.lengthDays) return POST_BETA;
  return day;
}

export type DayState = 'completed' | 'current' | 'missed' | 'locked';

/**
 * Mountain stop state for a beta day (spec §5/§8): past missed days are
 * locked/grayed with no makeups; future days locked until their date.
 */
export function dayState(
  day: number,
  currentDay: number,
  submittedDays: ReadonlySet<number>,
): DayState {
  if (submittedDays.has(day)) return 'completed';
  if (day === currentDay) return 'current';
  if (day < currentDay || currentDay === POST_BETA) return 'missed';
  return 'locked';
}
