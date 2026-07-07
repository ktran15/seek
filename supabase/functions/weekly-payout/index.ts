/**
 * weekly-payout — the week-end settlement (spec §9.1, §9.2, §15 M9), run
 * once after the beta's final day closes. Service-to-service like day-close:
 * deploy with --no-verify-jwt; the caller must present the service-role key.
 *
 * Per user (egocentric, spec §7.10): qualified (≥3 accepted friends) →
 * tier payout by weekly rank + gold crate for 1st; unqualified with ≥1
 * completed challenge → flat solo payout. Zero points never pays. Decision
 * math is pure and jest-covered (_shared/weekly.ts). Idempotent per user:
 * an existing weekly ledger row skips them, so re-runs never double-pay.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { friendIdsOf } from '../_shared/pairing.ts';
import { weeklyPayout, type WeeklyPayoutAmounts } from '../_shared/weekly.ts';

const BETA_WEEK = 1;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!serviceKey || token !== serviceKey) {
      return json({ error: 'Service calls only' }, 401);
    }
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

    const { data: ecoSetting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'economy')
      .single();
    const eco = (ecoSetting?.value ?? {}) as {
      weeklyPayout?: WeeklyPayoutAmounts;
      soloWeeklyPayout?: number;
      weeklyPayoutMinFriends?: number;
    };
    const amounts = eco.weeklyPayout;
    const soloAmount = eco.soloWeeklyPayout;
    const minFriends = eco.weeklyPayoutMinFriends;
    if (!amounts || soloAmount === undefined || minFriends === undefined) {
      return json({ error: 'Economy settings missing weekly amounts (run the M9 migration)' }, 500);
    }

    const [{ data: profiles }, { data: pointRows }, { data: submitted }] =
      await Promise.all([
        admin.from('profiles').select('id'),
        admin.from('points_ledger').select('user_id, delta').eq('beta_week', BETA_WEEK),
        admin.from('submissions').select('user_id').eq('state', 'submitted'),
      ]);

    const pointsBy = new Map<string, number>();
    for (const row of pointRows ?? []) {
      const id = row.user_id as string;
      pointsBy.set(id, (pointsBy.get(id) ?? 0) + (row.delta as number));
    }
    const completedIds = new Set((submitted ?? []).map((s) => s.user_id as string));

    let paid = 0;
    let skipped = 0;
    for (const profile of profiles ?? []) {
      const userId = profile.id as string;

      // Idempotence: one weekly settlement per user, ever (single beta week).
      const { data: existing } = await admin
        .from('coins_ledger')
        .select('id')
        .eq('user_id', userId)
        .in('reason', ['weekly_payout', 'solo_weekly_payout'])
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }

      const friends = await friendIdsOf(admin, userId);
      const decision = weeklyPayout({
        qualified: friends.length >= minFriends,
        myPoints: pointsBy.get(userId) ?? 0,
        friendPoints: friends.map((f) => pointsBy.get(f) ?? 0),
        completedAny: completedIds.has(userId),
        amounts,
        soloAmount,
      });
      if (!decision) continue;

      const { error: coinsError } = await admin.from('coins_ledger').insert({
        user_id: userId,
        delta: decision.coins,
        reason: decision.solo ? 'solo_weekly_payout' : 'weekly_payout',
      });
      if (coinsError) throw new Error(coinsError.message);

      if (decision.goldCrate) {
        const { error: crateError } = await admin.from('crates').insert({
          user_id: userId,
          tier: 'gold',
          source: 'weekly_prize',
        });
        if (crateError) throw new Error(crateError.message);
      }

      const { error: notifyError } = await admin.from('notifications').insert({
        user_id: userId,
        type: 'weekly_result',
        payload: {
          beta_week: BETA_WEEK,
          rank: decision.rank,
          points: pointsBy.get(userId) ?? 0,
          coins: decision.coins,
          gold_crate: decision.goldCrate,
          solo: decision.solo,
        },
      });
      if (notifyError) throw new Error(notifyError.message);
      paid++;
    }

    return json({ beta_week: BETA_WEEK, paid, skipped });
  } catch (e) {
    console.error('[weekly-payout]', e);
    return json({ error: 'Weekly payout failed' }, 500);
  }
});
