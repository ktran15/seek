/**
 * vote-countdown — the day-3 "voting closes in 2h" push (spec §13). Push-only:
 * the in-app countdown is the persistent banner pinned on the Challenge screen
 * (spec §7.7), so no notifications row is written — an hours-stale "closes in
 * 2h" line in the Results list would be noise.
 *
 * Scheduled via pg_cron DAILY at the window-open time (see PROGRESS.md);
 * every run outside [close − 2h, close) on the CV day is a no-op, and an
 * app_settings marker makes the send once-only even if the cron misfires
 * twice inside the window. Body {"force": true} skips the window guard for
 * testing (the marker still applies — delete it to resend).
 *
 * Invoked service-to-service: deploy with --no-verify-jwt; the caller must
 * present a server key, checked explicitly below.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { betaDayInTimezone, inPreCloseWindow } from '../_shared/betaDay.ts';
import { pushContentFor, sendExpoPush, toExpoPushMessages } from '../_shared/push.ts';
import { bearerToken, isServiceToken, serviceKeySet } from '../_shared/serviceAuth.ts';

const COUNTDOWN_HOURS = 2;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const keys = serviceKeySet({
      serviceRoleKey: serviceKey,
      secretKeysJson: Deno.env.get('SUPABASE_SECRET_KEYS'),
    });
    if (!isServiceToken(bearerToken(req.headers.get('Authorization')), keys)) {
      return json({ error: 'Service calls only' }, 401);
    }
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

    const { data: betaSetting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'beta')
      .single();
    const beta = (betaSetting?.value ?? {}) as {
      start_date?: string;
      timezone?: string;
    };
    const startDate = beta.start_date ?? '';
    const timezone = beta.timezone ?? 'America/New_York';

    // The CV day comes from the seeded calendar, not a hard-coded 3.
    const { data: cvChallenge } = await admin
      .from('challenges')
      .select('beta_day')
      .eq('mode', 'CV')
      .single();
    if (!cvChallenge) return json({ error: 'No CV challenge seeded' }, 400);
    const cvDay = cvChallenge.beta_day as number;

    const body = (await req.json().catch(() => ({}))) as { force?: boolean };
    const now = new Date();
    if (
      body.force !== true &&
      !inPreCloseWindow(startDate, timezone, cvDay, now, COUNTDOWN_HOURS)
    ) {
      return json({
        skipped: true,
        reason: `Outside the day-${cvDay} countdown window`,
        beta_day: betaDayInTimezone(startDate, timezone, now),
      });
    }

    // Once-only marker (idempotence across cron misfires and re-runs).
    const markerKey = `vote_countdown_sent_day_${cvDay}`;
    const { data: marker, error: markerError } = await admin
      .from('app_settings')
      .upsert(
        { key: markerKey, value: { sent_at: now.toISOString() } },
        { onConflict: 'key', ignoreDuplicates: true },
      )
      .select('key');
    if (markerError) throw new Error(markerError.message);
    if (!marker || marker.length === 0) {
      return json({ skipped: true, reason: 'Countdown already sent' });
    }

    // Everyone with a registered device hears the 2h warning — voting is
    // open to all users (friends' tallies), not just day-3 posters.
    const { data: tokens, error: tokensError } = await admin
      .from('push_tokens')
      .select('token');
    if (tokensError) throw new Error(tokensError.message);

    const messages = toExpoPushMessages(
      (tokens ?? []).map((t) => t.token as string),
      pushContentFor('vote_countdown', { beta_day: cvDay }),
    );
    const result = await sendExpoPush(messages, fetch);

    return json({ beta_day: cvDay, devices: messages.length, ...result });
  } catch (e) {
    console.error('[vote-countdown]', e);
    return json({ error: 'Vote countdown failed' }, 500);
  }
});
