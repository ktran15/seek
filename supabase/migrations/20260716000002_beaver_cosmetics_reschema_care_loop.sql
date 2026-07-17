-- M8 beaver rework — cosmetics reschema to the 4 beaver slots (spec §10.2) +
-- care-loop server settings/columns and the snack RPC (§10.4–10.5). The
-- care-loop *settle* (Happiness decay/restore + streak) runs in the day-close
-- Edge Function against the columns added here.
--
-- Beta data note: the old hiker cosmetics catalog (8 slots) is REPLACED. This
-- wipes user_cosmetics and clears stale equips — acceptable pre-launch (those
-- items no longer exist). Crates (tier-based) are unaffected.
--
-- APPLY (founder): `npx supabase db push`, then redeploy day-close (it now
-- settles the care loop): see PROGRESS.md.

-- 1. Server-side care-loop numbers (TUNE — mirror src/config careLoop). Starting
--    Happiness 70 is decided (§18); the rest are day-close/snack amounts.
insert into public.app_settings (key, value) values ('care_loop', '{
  "startingHappiness": 70,
  "dailyDecay": 10,
  "completionRestore": 20,
  "snack": {"cost": 25, "restore": 15}
}') on conflict (key) do nothing;

-- 2. Idempotency marker: the last beta day whose care loop was settled for this
--    profile. Server-authoritative; NO client update grant (never listed in the
--    M1 column grants), so it stays server-only like happiness/streak.
alter table public.profiles
  add column if not exists happiness_settled_day integer not null default 0;

-- 3. Allow the snack ledger reason (§10.5).
alter table public.coins_ledger drop constraint if exists coins_ledger_reason_check;
alter table public.coins_ledger add constraint coins_ledger_reason_check
  check (reason in
    ('completion', 'h2h_win', 'vote_placement', 'weekly_payout',
     'solo_weekly_payout', 'crate_purchase', 'dupe_refund', 'invite_reward',
     'snack_purchase'));

-- 4. Reschema cosmetics to the 4 beaver slots + reseed the LOCKED §10.2 catalog
--    (19 items). Wipe ownership first (FK), clear stale equips.
delete from public.user_cosmetics;
delete from public.cosmetics;
update public.profiles
  set avatar_config = avatar_config - 'equipped'
  where avatar_config ? 'equipped';

alter table public.cosmetics drop constraint if exists cosmetics_slot_check;
alter table public.cosmetics add constraint cosmetics_slot_check
  check (slot in ('hats', 'tails', 'gloves', 'eyes'));

insert into public.cosmetics (slot, name, rarity, asset_slot_name) values
  ('hats',   'Beanie',               'common',    'cosHatsBeanie'),
  ('hats',   'Baseball Cap',         'rare',      'cosHatsBaseballCap'),
  ('hats',   'Bow Hat',              'rare',      'cosHatsBowHat'),
  ('hats',   'Propeller Hat',        'epic',      'cosHatsPropeller'),
  ('hats',   'Crown',                'legendary', 'cosHatsCrown'),
  ('tails',  'Red Beaver Tail',      'common',    'cosTailsRed'),
  ('tails',  'Checkerboard Tail',    'rare',      'cosTailsCheckerboard'),
  ('tails',  'Beaver Tail w/ Bow',   'rare',      'cosTailsBow'),
  ('tails',  'Rainbow Tail',         'epic',      'cosTailsRainbow'),
  ('tails',  'Gold Tail',            'legendary', 'cosTailsGold'),
  ('gloves', 'Red Boxing Gloves',    'common',    'cosGlovesRedBoxing'),
  ('gloves', 'Blue Gloves',          'rare',      'cosGlovesBlue'),
  ('gloves', 'Pink Mitts',           'epic',      'cosGlovesPinkMitts'),
  ('gloves', 'Golden Boxing Gloves', 'legendary', 'cosGlovesGoldenBoxing'),
  ('eyes',   'Sunglasses',           'common',    'cosEyesSunglasses'),
  ('eyes',   'EyePatch',             'rare',      'cosEyesEyePatch'),
  ('eyes',   'Eye Shadow',           'rare',      'cosEyesShadow'),
  ('eyes',   'Ski Goggles',          'epic',      'cosEyesSkiGoggles'),
  ('eyes',   'Gold Monocle',         'legendary', 'cosEyesGoldMonocle');

-- 5. Vending-machine snack (§10.5): −cost coins + Happiness +restore (cap 100),
--    one transaction. The profile row lock serializes buys; the coins_ledger
--    trigger enforces the balance floor (raises 'Not enough coins' → rollback).
--    Server-authoritative — happiness is not client-updatable, so this DEFINER
--    RPC is the only way to move it up (spec §2.1).
create or replace function public.buy_snack()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  care jsonb;
  cost integer;
  restore integer;
  new_happiness integer;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select value into care from public.app_settings where key = 'care_loop';
  cost := (care->'snack'->>'cost')::int;
  restore := (care->'snack'->>'restore')::int;

  perform 1 from public.profiles where id = auth.uid() for update;

  -- Deduct first: a negative balance rolls the whole transaction back.
  insert into public.coins_ledger (user_id, delta, reason)
  values (auth.uid(), -cost, 'snack_purchase');

  update public.profiles
    set happiness = least(100, greatest(0, happiness + restore))
    where id = auth.uid()
    returning happiness into new_happiness;

  return new_happiness;
end;
$$;
revoke all on function public.buy_snack() from anon;
grant execute on function public.buy_snack() to authenticated;
