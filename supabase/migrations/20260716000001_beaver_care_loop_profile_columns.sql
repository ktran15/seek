-- Beaver care-loop + identity columns on profiles (spec §10; §18 decisions
-- finalized 2026-07-16). Adds the player beaver's chosen NAME plus the two
-- server-authoritative care-loop stats: Happiness (0-100, starts at 70) and
-- streak_count. RLS is unchanged; column grants follow the M13 privacy model
-- (SELECT is column-scoped). Only beaver_name is client-updatable — happiness
-- and streak_count are settled server-side at day close (§10.4/§10.7), never
-- written by the client, consistent with the economy standard (§2.1).
--
-- The care-loop *behavior* (decay/restore at day close, the snack RPC, the
-- 5-state selection + streak logic) is the M8 beaver rework and is NOT in this
-- migration — this only lands the columns onboarding + that rework will use.
--
-- APPLY (founder): `npx supabase db push`.

alter table public.profiles
  add column if not exists beaver_name text
    check (beaver_name is null or char_length(beaver_name) between 1 and 20),
  add column if not exists happiness integer not null default 70
    check (happiness between 0 and 100),
  add column if not exists streak_count integer not null default 0
    check (streak_count >= 0);

-- Public-readable (Supabase public-profiles pattern, same set as
-- username/display_name/avatar_config): the beaver's name, its current
-- Happiness (the profile renders the beaver at its Happiness state + a meter,
-- §11), and the streak count (🔥N beside the username, §10.7) all show on any
-- user's profile. Extend the M13 column-scoped SELECT grant to include them.
grant select (beaver_name, happiness, streak_count)
  on table public.profiles to authenticated;

-- Client may set only its beaver's NAME (like display_name). happiness and
-- streak_count get NO client update grant — server-authoritative only.
grant update (beaver_name) on table public.profiles to authenticated;
