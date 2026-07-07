/**
 * Server-side beta-day math on the GLOBAL beta clock (spec §7.7, §8):
 * the vote window and day-close resolution run in the beta timezone
 * (America/New_York), unlike client availability which rolls at the user's
 * local midnight (src/lib/betaCalendar.ts). Dependency-free: runs under
 * Deno (Edge Functions) and Node (tests).
 */

/** The calendar date (YYYY-MM-DD) of `now` in the given IANA timezone. */
export function dateInTimezone(timezone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Beta day (1-based) on the global clock. Day 1 = startDate itself;
 * 0 or negative = beta not started; > lengthDays = beta over.
 */
export function betaDayInTimezone(
  startDate: string,
  timezone: string,
  now: Date = new Date(),
): number {
  const today = dateInTimezone(timezone, now);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff =
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
    msPerDay;
  return Math.round(diff) + 1;
}
