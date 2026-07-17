-- 20260713000001 — m14_beaver_care_loop
--
-- PROVENANCE (recovered 2026-07-17): this migration was applied DIRECTLY to the
-- remote database on 2026-07-13 (during the character pivot) and its source file
-- was never committed to git, so the repo could not reproduce production. The
-- SQL below was recovered verbatim from the remote migration history
-- (supabase_migrations.schema_migrations, name `m14_beaver_care_loop`) via the
-- dashboard SQL editor and restored here. It replaces the temporary no-op
-- reconcile stub.
--
-- It is ALREADY APPLIED on the linked project, so `supabase db push` skips it
-- (the version is present in the remote history). The later 20260716000001
-- migration re-adds the same three columns with `if not exists` guards, so a
-- fresh `db reset` and the live DB converge on the same schema. Kept as-is for a
-- faithful, replayable history.
--
-- ============================ recovered SQL ============================

-- M14 character pivot: beaver identity + care loop (spec §10)
--
-- APPLY (founder): `npx supabase db push`.
--
-- Adds the beaver's name, Happiness (0–100, starting 70) and streak to
-- profiles. Happiness + streak are SERVER-AUTHORITATIVE (spec §2.1): the
-- client gets NO update grant on them — the day-close settlement and the
-- buy_snack RPC (both later sub-steps) own those writes. `beaver_name` and
-- `avatar_config` (which now carries bodySex + bodyColor) are client-writable
-- at onboarding, like username/display_name already are.
--
-- Column privacy (M13 audit M3): the profiles SELECT grant is column-scoped.
-- beaver_name / happiness / streak_count are PUBLIC (another user's profile
-- shows their beaver at its Happiness state, and the 🔥 streak sits next to
-- the username). `coins` stays owner-only via my_coins().

alter table public.profiles
  add column if not exists beaver_name text
    check (beaver_name is null or char_length(trim(beaver_name)) between 1 and 20),
  add column if not exists happiness integer not null default 70
    check (happiness between 0 and 100),
  add column if not exists streak_count integer not null default 0
    check (streak_count >= 0);

-- Client may name its beaver; it may NOT write happiness or streak_count.
grant update (beaver_name) on table public.profiles to authenticated;

-- Re-grant the column-scoped SELECT with the three new public columns
-- (superseding the M13 grant; coins + joined_beta_day remain excluded).
revoke select on table public.profiles from authenticated, anon;

grant select (id, username, display_name, avatar_config, bio,
  onboarding_completed_at, created_at,
  beaver_name, happiness, streak_count)
  on table public.profiles to authenticated;
