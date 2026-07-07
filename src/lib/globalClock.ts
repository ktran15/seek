/**
 * Global beta clock (spec §7.7): day math on the beta timezone
 * (America/New_York) — used for the vote window, unlike betaCalendar.ts
 * which rolls availability at the user's LOCAL midnight (spec §8).
 *
 * Re-exported from the Edge Functions' shared module so client and server
 * compute the window from one implementation (spec §2.1: share types/logic).
 */
export {
  addDays,
  betaDayInTimezone,
  dateInTimezone,
  dayCloseInstant,
  utcInstantOfLocalMidnight,
} from '../../supabase/functions/_shared/betaDay';
