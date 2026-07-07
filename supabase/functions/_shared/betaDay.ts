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

/** The local wall-clock datetime of `now` in a timezone, as ISO-ish string. */
function wallClockInTimezone(timezone: string, now: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(now)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  );
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`;
}

/** startDate (YYYY-MM-DD) shifted by n calendar days. */
export function addDays(date: string, days: number): string {
  const ts = Date.parse(`${date}T00:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(ts).toISOString().slice(0, 10);
}

/**
 * The UTC instant of local midnight starting `date` in `timezone`
 * (DST-safe: converges via the zone's actual offset at the instant).
 */
export function utcInstantOfLocalMidnight(date: string, timezone: string): Date {
  const target = Date.parse(`${date}T00:00:00Z`);
  let ts = target;
  for (let i = 0; i < 2; i++) {
    ts += target - Date.parse(`${wallClockInTimezone(timezone, new Date(ts))}Z`);
  }
  return new Date(ts);
}

/**
 * When beta day N ends on the global clock (spec §7.7): local midnight in
 * the beta timezone at the start of day N+1. Day 3's value IS the vote close.
 */
export function dayCloseInstant(
  startDate: string,
  timezone: string,
  betaDay: number,
): Date {
  return utcInstantOfLocalMidnight(addDays(startDate, betaDay), timezone);
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
