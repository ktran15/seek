-- M8 review fix — atomic care-loop settle (spec §10.4/§10.7).
--
-- The first cut of the day-close settle read every profile's happiness up
-- front, computed new values in TS, then wrote them back per profile. A
-- buy_snack() committing between that read and the write was CLOBBERED (the
-- settle overwrote happiness with a value computed from the stale read — the
-- user paid 25 coins and lost the +15). This RPC replaces the loop with ONE
-- set-based UPDATE: each row's happiness is computed from its CURRENT value
-- under the row lock, so a concurrent snack serializes with the settle and
-- both always land, in either commit order.
--
-- Idempotency is unchanged: the happiness_settled_day gate is in the WHERE, so
-- re-runs (and the concurrent-close race) settle each profile exactly once.
-- Side benefit: one statement settles EVERY profile — the old loop silently
-- capped at PostgREST's 1000-row default read.
--
-- The math mirrors _shared/careLoop.ts (settleCareRow — the jest-tested
-- reference): completed → +restore_in, missed → −decay_in, clamped 0–100;
-- streak +1 on completion, reset to 0 on a miss. Keep the two in sync.
--
-- Service-only: called by the day-close Edge Function with the service key.
-- No client role may execute it.
--
-- APPLY (founder): `npx supabase db push` (with the other two M8 migrations),
-- then redeploy day-close: see PROGRESS.md.

create or replace function public.settle_care_day(
  day_in integer,
  completed_ids uuid[],
  decay_in integer,
  restore_in integer
)
returns integer
language sql
set search_path = public
as $$
  with settled as (
    update public.profiles p
    set happiness = least(100, greatest(0,
          p.happiness + case when p.id = any (completed_ids)
                             then restore_in else -decay_in end)),
        streak_count = case when p.id = any (completed_ids)
                            then p.streak_count + 1 else 0 end,
        happiness_settled_day = day_in
    where p.happiness_settled_day < day_in
    returning p.id
  )
  select count(*)::integer from settled;
$$;

revoke all on function public.settle_care_day(integer, uuid[], integer, integer)
  from public, anon, authenticated;
grant execute on function public.settle_care_day(integer, uuid[], integer, integer)
  to service_role;
