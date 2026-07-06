-- M1: profiles, app_settings, invites — RLS on every table (spec §2.1, §6)
--
-- APPLY (founder): Supabase Dashboard → SQL Editor → paste this whole file →
-- Run. (Or: `npx supabase login`, `npx supabase link --project-ref
-- aducawlftwdowvsnryar`, `npx supabase db push`.)

create extension if not exists pgcrypto with schema extensions;

-- Server-side copy of beta calendar config (kept in sync with src/config).
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "app_settings readable by authenticated"
  on public.app_settings for select to authenticated using (true);
-- no insert/update/delete policies: service role only
revoke insert, update, delete on table public.app_settings from authenticated, anon;

insert into public.app_settings (key, value) values
  ('beta', '{"start_date": "2026-07-13", "timezone": "America/New_York", "length_days": 7}');

-- profiles (spec §6)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) between 1 and 40),
  avatar_config jsonb not null default '{}'::jsonb,
  coins integer not null default 100, -- starting balance (TUNE); ledger-driven from M7
  joined_beta_day integer,
  bio text check (char_length(bio) <= 200),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;
create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Server-authoritative columns: clients may update ONLY these columns.
revoke insert, update, delete on table public.profiles from authenticated, anon;
grant update (username, display_name, avatar_config, bio, onboarding_completed_at)
  on table public.profiles to authenticated;

-- Signup trigger: creates the profile row; joined_beta_day computed server-side.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  beta jsonb;
  day_num integer;
begin
  select value into beta from public.app_settings where key = 'beta';
  if beta is not null then
    day_num := greatest(0, least(
      (beta->>'length_days')::int,
      ((now() at time zone (beta->>'timezone'))::date - (beta->>'start_date')::date) + 1
    ));
  end if;
  insert into public.profiles (id, joined_beta_day) values (new.id, day_num);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- invites (spec §6, §7.8)
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null check (channel in ('imessage', 'link')),
  invite_code text not null unique
    default upper(encode(extensions.gen_random_bytes(4), 'hex')),
  sent_at timestamptz not null default now(),
  redeemed_by uuid references public.profiles (id) on delete set null,
  redeemed_at timestamptz
);
create index invites_inviter_idx on public.invites (inviter_id);

alter table public.invites enable row level security;
create policy "users read own invites"
  on public.invites for select to authenticated using (inviter_id = auth.uid());
create policy "users create own invites"
  on public.invites for insert to authenticated with check (inviter_id = auth.uid());
-- Clients supply only inviter/channel; code + timestamps come from defaults.
-- Redemption (redeemed_by/redeemed_at) is a server-side flow (M3+).
revoke insert, update, delete on table public.invites from authenticated, anon;
grant insert (inviter_id, channel) on table public.invites to authenticated;
