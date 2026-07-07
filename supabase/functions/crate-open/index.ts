/**
 * crate-open — the gacha roll (spec §9.4 LOCKED: rolls happen in an Edge
 * Function; the client cannot influence outcomes). Rolls rarity from the
 * crate tier's drop table, picks a cosmetic, then applies the outcome
 * atomically via the open_crate_apply RPC (claim + award/dupe-refund in one
 * transaction — a crash can never eat a crate or double-award).
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  pickCosmetic,
  rollRarity,
  validateDropRates,
  type CrateTier,
  type DropRates,
  type Rarity,
} from '../_shared/economy.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Uniform [0, 1) from the platform CSPRNG. */
function cryptoRng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] as number) / 2 ** 32;
}

interface CosmeticRow {
  id: string;
  slot: string;
  name: string;
  rarity: Rarity;
  asset_slot_name: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    if (authError || !userData.user) return json({ error: 'Not signed in' }, 401);
    const userId = userData.user.id;

    const { crate_id: crateId } = (await req.json().catch(() => ({}))) as {
      crate_id?: string;
    };
    if (!crateId) return json({ error: 'crate_id required' }, 400);

    const { data: crate } = await admin
      .from('crates')
      .select('id, tier, opened')
      .eq('id', crateId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!crate) return json({ error: 'Crate not found' }, 404);
    if (crate.opened) return json({ error: 'Crate already opened' }, 409);

    const { data: ecoSetting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'economy')
      .single();
    const eco = (ecoSetting?.value ?? {}) as {
      crateDropRates?: Record<CrateTier, DropRates>;
      coins?: { dupeCosmeticRefund?: number };
    };
    const rates = eco.crateDropRates?.[crate.tier as CrateTier];
    if (!rates || !validateDropRates(rates)) {
      console.error('[crate-open] bad drop table for tier', crate.tier);
      return json({ error: 'Crate open failed' }, 500);
    }

    const { data: catalog } = await admin
      .from('cosmetics')
      .select('id, slot, name, rarity, asset_slot_name');
    const cosmetics = (catalog ?? []) as CosmeticRow[];

    const rarity = rollRarity(rates, cryptoRng);
    const cosmetic = pickCosmetic(cosmetics, rarity, cryptoRng);
    if (!cosmetic) {
      console.error('[crate-open] empty cosmetics catalog');
      return json({ error: 'Crate open failed' }, 500);
    }

    const { data: outcome, error: applyError } = await admin.rpc('open_crate_apply', {
      crate_id_in: crateId,
      user_id_in: userId,
      cosmetic_id_in: cosmetic.id,
    });
    if (applyError) {
      // Raced double-open lands here via the claim guard.
      return json({ error: 'Crate already opened' }, 409);
    }

    return json({
      outcome: outcome as 'awarded' | 'dupe',
      cosmetic: {
        id: cosmetic.id,
        slot: cosmetic.slot,
        name: cosmetic.name,
        rarity: cosmetic.rarity,
        asset_slot_name: cosmetic.asset_slot_name,
      },
      refund_coins:
        outcome === 'dupe' ? (eco.coins?.dupeCosmeticRefund ?? 0) : null,
    });
  } catch (e) {
    console.error('[crate-open]', e);
    return json({ error: 'Crate open failed' }, 500);
  }
});
