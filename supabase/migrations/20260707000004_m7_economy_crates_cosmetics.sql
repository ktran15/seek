-- M7: coins/points ledgers, crates, cosmetics catalog, award plumbing
-- (spec sec 6, sec 9). Server-authoritative throughout (spec sec 2.1):
-- clients READ their own rows; every write happens in SECURITY DEFINER
-- functions, triggers, or service-role Edge Functions.
--
-- APPLY (founder): Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.

-- Server-side economy numbers (TUNE -- keep in sync with src/config economy).
insert into public.app_settings (key, value) values ('economy', '{
  "coins": {
    "challengeCompletion": 50, "h2hWin": 30,
    "votePlacement": {"first": 50, "second": 30, "third": 20},
    "inviteSent": 50, "dupeCosmeticRefund": 20
  },
  "points": {
    "challengeCompletion": 10, "h2hWin": 5,
    "votePlacement": {"first": 5, "second": 3, "third": 2}
  },
  "cratePrices": {"wood": 100, "blue": 250, "red": 500, "yellow": 1000},
  "crateDropRates": {
    "wood":   {"common": 0.75, "rare": 0.20, "epic": 0.045, "legendary": 0.005},
    "blue":   {"common": 0.60, "rare": 0.30, "epic": 0.08,  "legendary": 0.02},
    "red":    {"common": 0.45, "rare": 0.35, "epic": 0.16,  "legendary": 0.04},
    "yellow": {"common": 0.30, "rare": 0.40, "epic": 0.22,  "legendary": 0.08},
    "gold":   {"common": 0.10, "rare": 0.35, "epic": 0.35,  "legendary": 0.20}
  }
}') on conflict (key) do nothing;

-- coins_ledger (spec sec 6, sec 9.1): append-only. profiles.coins is
-- maintained transactionally by the trigger below -- never written directly.
create table public.coins_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (reason in
    ('completion', 'h2h_win', 'vote_placement', 'weekly_payout',
     'solo_weekly_payout', 'crate_purchase', 'dupe_refund', 'invite_reward')),
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index coins_ledger_user_idx on public.coins_ledger (user_id, created_at desc);
create index coins_ledger_ref_idx on public.coins_ledger (ref_id);

alter table public.coins_ledger enable row level security;
create policy "users read own coins ledger"
  on public.coins_ledger for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on table public.coins_ledger from authenticated, anon;

-- Balance follows the ledger in the same transaction. Spending guard: a
-- negative delta may never take the balance below zero.
create or replace function public.apply_coins_delta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.profiles
    set coins = coins + new.delta
    where id = new.user_id
    returning coins into new_balance;
  if new_balance is null then
    raise exception 'Unknown user for coins ledger entry';
  end if;
  if new_balance < 0 then
    raise exception 'Not enough coins';
  end if;
  return new;
end;
$$;
create trigger coins_ledger_apply
  after insert on public.coins_ledger
  for each row execute function public.apply_coins_delta();

-- points_ledger (spec sec 6, sec 9.2 LOCKED separation): leaderboard rank =
-- sum per user per beta_week. Never touches coins.
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  beta_week integer not null default 1,
  delta integer not null check (delta > 0),
  reason text not null check (reason in ('completion', 'h2h_win', 'vote_placement')),
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index points_ledger_user_week_idx on public.points_ledger (user_id, beta_week);

alter table public.points_ledger enable row level security;
create policy "users read own points ledger"
  on public.points_ledger for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on table public.points_ledger from authenticated, anon;

-- crates (spec sec 6, sec 9.3 LOCKED): awarded unopened to inventory; opened
-- deliberately (gacha roll in the crate-open Edge Function only).
create table public.crates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tier text not null check (tier in ('wood', 'blue', 'red', 'yellow', 'gold')),
  source text not null check (source in
    ('completion', 'h2h_win', 'vote_top3', 'vote_win', 'weekly_prize',
     'purchase', 'invite_reward')),
  opened boolean not null default false,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  check (not opened or opened_at is not null)
);
create index crates_user_idx on public.crates (user_id, opened, created_at desc);

alter table public.crates enable row level security;
create policy "users read own crates"
  on public.crates for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on table public.crates from authenticated, anon;

-- cosmetics catalog (spec sec 6, sec 10): seeded, read-only. asset_slot_name
-- points at the central asset registry (placeholder art until M12).
create table public.cosmetics (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in
    ('boots', 'pants', 'backpack', 'hats', 'sunglasses', 'shirts', 'jacket', 'pet')),
  name text not null unique,
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  asset_slot_name text not null
);

alter table public.cosmetics enable row level security;
create policy "cosmetics readable by authenticated"
  on public.cosmetics for select to authenticated using (true);
revoke insert, update, delete on table public.cosmetics from authenticated, anon;

insert into public.cosmetics (slot, name, rarity, asset_slot_name) values
  ('boots',      'Trail Runners',      'common',    'cosBootsCommon'),
  ('boots',      'Moss Striders',      'rare',      'cosBootsRare'),
  ('boots',      'Summit Spikes',      'epic',      'cosBootsEpic'),
  ('boots',      'Skyline Soles',      'legendary', 'cosBootsLegendary'),
  ('pants',      'Canvas Hikers',      'common',    'cosPantsCommon'),
  ('pants',      'River Rolls',        'rare',      'cosPantsRare'),
  ('pants',      'Cliffside Cargos',   'epic',      'cosPantsEpic'),
  ('pants',      'Aurora Trousers',    'legendary', 'cosPantsLegendary'),
  ('backpack',   'Daypack',            'common',    'cosBackpackCommon'),
  ('backpack',   'Ranger Rucksack',    'rare',      'cosBackpackRare'),
  ('backpack',   'Expedition Pack',    'epic',      'cosBackpackEpic'),
  ('backpack',   'Balloon Bundle',     'legendary', 'cosBackpackLegendary'),
  ('hats',       'Bucket Hat',         'common',    'cosHatsCommon'),
  ('hats',       'Scout Beanie',       'rare',      'cosHatsRare'),
  ('hats',       'Falcon Feather Cap', 'epic',      'cosHatsEpic'),
  ('hats',       'Golden Summit Crown','legendary', 'cosHatsLegendary'),
  ('sunglasses', 'Camp Shades',        'common',    'cosSunglassesCommon'),
  ('sunglasses', 'Riverbend Rounds',   'rare',      'cosSunglassesRare'),
  ('sunglasses', 'Glacier Goggles',    'epic',      'cosSunglassesEpic'),
  ('sunglasses', 'Eclipse Aviators',   'legendary', 'cosSunglassesLegendary'),
  ('shirts',     'Basecamp Tee',       'common',    'cosShirtsCommon'),
  ('shirts',     'Flannel Scout',      'rare',      'cosShirtsRare'),
  ('shirts',     'Storm Windbreaker',  'epic',      'cosShirtsEpic'),
  ('shirts',     'Constellation Jersey','legendary','cosShirtsLegendary'),
  ('jacket',     'Trail Shell',        'common',    'cosJacketCommon'),
  ('jacket',     'Pine Parka',         'rare',      'cosJacketRare'),
  ('jacket',     'Ridge Runner Coat',  'epic',      'cosJacketEpic'),
  ('jacket',     'Comet Puffer',       'legendary', 'cosJacketLegendary'),
  ('pet',        'Pocket Frog',        'common',    'cosPetCommon'),
  ('pet',        'Marmot Buddy',       'rare',      'cosPetRare'),
  ('pet',        'Hawk Companion',     'epic',      'cosPetEpic'),
  ('pet',        'Tiny Yeti',          'legendary', 'cosPetLegendary');

-- user_cosmetics: ownership; unique pair -> the second copy is a dupe and
-- auto-converts to coins in the open flow (spec sec 9.4).
create table public.user_cosmetics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cosmetic_id uuid not null references public.cosmetics (id),
  created_at timestamptz not null default now(),
  unique (user_id, cosmetic_id)
);
create index user_cosmetics_user_idx on public.user_cosmetics (user_id);

alter table public.user_cosmetics enable row level security;
create policy "users read own cosmetics"
  on public.user_cosmetics for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on table public.user_cosmetics from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Award plumbing
-- ---------------------------------------------------------------------------

-- Challenge completion award (spec sec 9.1/9.2/9.3): +coins, +points, wood
-- crate -- fires once when a submission reaches its terminal 'submitted'
-- state (completion = submitted proof, pass or fail; a failed day-2 Wordle
-- still did the challenge). Idempotent via the ledger ref check.
create or replace function public.award_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  eco jsonb;
begin
  if new.state <> 'submitted' then
    return new;
  end if;
  if exists (
    select 1 from public.coins_ledger
    where ref_id = new.id and reason = 'completion'
  ) then
    return new;
  end if;

  select value into eco from public.app_settings where key = 'economy';
  insert into public.coins_ledger (user_id, delta, reason, ref_id)
  values (new.user_id, (eco->'coins'->>'challengeCompletion')::int, 'completion', new.id);
  insert into public.points_ledger (user_id, beta_week, delta, reason, ref_id)
  values (new.user_id, 1, (eco->'points'->>'challengeCompletion')::int, 'completion', new.id);
  insert into public.crates (user_id, tier, source)
  values (new.user_id, 'wood', 'completion');
  return new;
end;
$$;
create trigger submissions_award_completion
  after insert or update of state on public.submissions
  for each row execute function public.award_completion();

-- Invite reward (spec sec 7.8, sec 9.1): +coins on send. One reward per
-- invite row; the client can only insert invites for itself (M1 RLS).
create or replace function public.award_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  eco jsonb;
begin
  select value into eco from public.app_settings where key = 'economy';
  insert into public.coins_ledger (user_id, delta, reason, ref_id)
  values (new.inviter_id, (eco->'coins'->>'inviteSent')::int, 'invite_reward', new.id);
  return new;
end;
$$;
create trigger invites_award_invite
  after insert on public.invites
  for each row execute function public.award_invite();

-- Buy a crate (spec sec 9.3/9.5): price from app_settings; gold is prize-only
-- (not in cratePrices, so it errors here). The profile row lock serializes
-- concurrent buys; the ledger trigger enforces the balance floor.
create or replace function public.buy_crate(tier_in text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  eco jsonb;
  price integer;
  crate_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select value into eco from public.app_settings where key = 'economy';
  price := (eco->'cratePrices'->>tier_in)::int;
  if price is null then
    raise exception 'That crate cannot be bought';
  end if;

  perform 1 from public.profiles where id = auth.uid() for update;

  insert into public.crates (user_id, tier, source)
  values (auth.uid(), tier_in, 'purchase')
  returning id into crate_id;
  insert into public.coins_ledger (user_id, delta, reason, ref_id)
  values (auth.uid(), -price, 'crate_purchase', crate_id);

  return crate_id;
end;
$$;
revoke all on function public.buy_crate(text) from anon;

-- Atomic apply of a crate-open outcome. Called ONLY by the crate-open Edge
-- Function (service role) after it rolls the cosmetic (spec sec 9.4 LOCKED:
-- rolls happen server-side; this makes claim+award one transaction).
-- Returns 'awarded' or 'dupe' (dupe -> refund coins instead of the item).
create or replace function public.open_crate_apply(
  crate_id_in uuid,
  user_id_in uuid,
  cosmetic_id_in uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  eco jsonb;
  claimed integer;
begin
  -- Service-role only: no client grant (revoked below).
  update public.crates
    set opened = true, opened_at = now()
    where id = crate_id_in and user_id = user_id_in and opened = false;
  get diagnostics claimed = row_count;
  if claimed = 0 then
    raise exception 'Crate not found or already opened';
  end if;

  begin
    insert into public.user_cosmetics (user_id, cosmetic_id)
    values (user_id_in, cosmetic_id_in);
  exception when unique_violation then
    select value into eco from public.app_settings where key = 'economy';
    insert into public.coins_ledger (user_id, delta, reason, ref_id)
    values (user_id_in, (eco->'coins'->>'dupeCosmeticRefund')::int, 'dupe_refund', crate_id_in);
    return 'dupe';
  end;
  return 'awarded';
end;
$$;
revoke all on function public.open_crate_apply(uuid, uuid, uuid) from anon, authenticated;

revoke all on function public.apply_coins_delta() from anon, authenticated;
revoke all on function public.award_completion() from anon, authenticated;
revoke all on function public.award_invite() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Backfill: submissions + invites that predate the ledgers get their promised
-- awards now (the M4/M5 client showed "+50 coins / wooden crate added" from
-- config -- this makes those real). Ref-deduped, safe to re-run.
-- ---------------------------------------------------------------------------
do $$
declare
  eco jsonb;
  sub record;
  inv record;
begin
  select value into eco from public.app_settings where key = 'economy';

  for sub in
    select s.id, s.user_id from public.submissions s
    where s.state = 'submitted'
      and not exists (
        select 1 from public.coins_ledger cl
        where cl.ref_id = s.id and cl.reason = 'completion'
      )
  loop
    insert into public.coins_ledger (user_id, delta, reason, ref_id)
    values (sub.user_id, (eco->'coins'->>'challengeCompletion')::int, 'completion', sub.id);
    insert into public.points_ledger (user_id, beta_week, delta, reason, ref_id)
    values (sub.user_id, 1, (eco->'points'->>'challengeCompletion')::int, 'completion', sub.id);
    insert into public.crates (user_id, tier, source)
    values (sub.user_id, 'wood', 'completion');
  end loop;

  for inv in
    select i.id, i.inviter_id from public.invites i
    where not exists (
      select 1 from public.coins_ledger cl
      where cl.ref_id = i.id and cl.reason = 'invite_reward'
    )
  loop
    insert into public.coins_ledger (user_id, delta, reason, ref_id)
    values (inv.inviter_id, (eco->'coins'->>'inviteSent')::int, 'invite_reward', inv.id);
  end loop;
end $$;
