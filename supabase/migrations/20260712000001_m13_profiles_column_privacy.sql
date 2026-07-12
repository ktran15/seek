-- M13 audit M3 — Option A: coins balance + joined_beta_day become owner-only
-- (founder-approved 2026-07-12).
--
-- APPLY (founder): `npx supabase db push` (bundles with the M13 hardening
-- migration). Reload the app after applying — the client no longer selects
-- `*` on profiles (see useProfile.ts) and reads its own balance via my_coins().
--
-- Finding: `profiles` SELECT is using(true), so any authenticated user could
-- read another user's `coins` balance (and joined_beta_day) by fetching their
-- row directly. Fix keeps profiles rows publicly readable for the columns that
-- are meant to be public (username/display_name/avatar/bio — Supabase's
-- sanctioned "public profiles" pattern) and removes the two sensitive columns
-- from the client-selectable set via COLUMN privileges. RLS is unchanged;
-- column grants do the hiding. The owner reads their own balance through the
-- SECURITY DEFINER my_coins() RPC.
--
-- Unaffected: every server-side SECURITY DEFINER function (leaderboard, FoF,
-- search, public-profile-stats, award triggers) and the service-role Edge
-- Functions bypass these grants and keep full column access.

-- Replace the blanket table-level SELECT with a column-scoped grant. Postgres
-- checks column privileges before RLS, so coins/joined_beta_day are now
-- unreadable by client roles for EVERY row, including one's own — the owner's
-- balance comes from my_coins() below.
revoke select on table public.profiles from authenticated, anon;
grant select (id, username, display_name, avatar_config, bio,
              onboarding_completed_at, created_at)
  on table public.profiles to authenticated;

-- Owner-only balance read (the Shop's live coin count). SECURITY DEFINER so it
-- can read the now-restricted coins column; scoped to auth.uid() so it only
-- ever returns the caller's own balance.
create or replace function public.my_coins()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coins from public.profiles where id = auth.uid();
$$;
revoke all on function public.my_coins() from anon, public;
grant execute on function public.my_coins() to authenticated;
