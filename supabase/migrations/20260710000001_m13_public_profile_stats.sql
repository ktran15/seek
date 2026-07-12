-- M13 polish: public profile stats (founder-directed, 2026-07-10)
--
-- APPLY (founder): `npx supabase db push`.
--
-- Another user's profile now shows the spec sec 11 LOCKED stat set + badges,
-- fully public to any authenticated viewer (founder call — supersedes the
-- pre-M12 "stats stay owner-private" default). The underlying tables keep
-- their select-own RLS; this SECURITY DEFINER function is the ONLY window
-- into another user's numbers, and it is block-aware: a blocked pair (either
-- direction) gets no row — the client renders "profile unavailable".
--
-- Stat definitions mirror the client's own-profile hooks exactly, so the
-- numbers a user sees on their own profile match what everyone else sees:
--   submitted_days → submissions state='submitted' (stops climbed =
--                    challenges completed = array length; badge inputs too)
--   h2h wins/losses → resolved h2h_matches WHERE I am the protagonist
--                     (one row per protagonist per day — the rival's copy
--                     would double-count; winner null = mascot won = loss)
--   votes_won      → crates from source 'vote_win' (Profile stat since M7)
--   coins_earned   → sum of positive coins_ledger deltas (lifetime earned)
--   vote_firsts    → vote_result notifications with placement 1 (badge input)
create or replace function public.get_public_profile_stats(target uuid)
returns table (
  submitted_days integer[],
  h2h_wins integer,
  h2h_losses integer,
  votes_won integer,
  coins_earned bigint,
  vote_firsts integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(
      (select array_agg(distinct s.beta_day)
         from public.submissions s
        where s.user_id = target and s.state = 'submitted'),
      '{}'::integer[]
    ) as submitted_days,
    (select count(*)
       from public.h2h_matches m
      where m.protagonist_id = target
        and m.status = 'resolved'
        and m.winner_user_id = target)::integer as h2h_wins,
    (select count(*)
       from public.h2h_matches m
      where m.protagonist_id = target
        and m.status = 'resolved'
        and m.winner_user_id is distinct from target)::integer as h2h_losses,
    (select count(*)
       from public.crates c
      where c.user_id = target and c.source = 'vote_win')::integer as votes_won,
    coalesce(
      (select sum(greatest(cl.delta, 0))
         from public.coins_ledger cl
        where cl.user_id = target),
      0
    )::bigint as coins_earned,
    (select count(*)
       from public.notifications n
      where n.user_id = target
        and n.type = 'vote_result'
        and n.payload ->> 'placement' = '1')::integer as vote_firsts
  where exists (select 1 from public.profiles p where p.id = target)
    and not public.is_blocked_pair(auth.uid(), target);
$$;

revoke all on function public.get_public_profile_stats(uuid) from anon;
