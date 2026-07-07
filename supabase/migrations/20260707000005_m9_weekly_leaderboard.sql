-- M9: weekly leaderboard RPC + weekly payout amounts (spec sec 9.1, 9.2)
--
-- APPLY (founder): `npx supabase db push` (history was repaired in the M7
-- comment-fix pass), or paste in Dashboard -> SQL Editor.

-- Weekly amounts join the server-side economy settings (TUNE -- keep in sync
-- with src/config economy). Guarded so a re-run never clobbers tuned values.
update public.app_settings
set value = value || '{
      "weeklyPayout": {"first": 300, "top3": 150, "top10": 75},
      "soloWeeklyPayout": 75,
      "weeklyPayoutMinFriends": 3
    }'::jsonb,
    updated_at = now()
where key = 'economy'
  and not (value ? 'weeklyPayout');

-- Egocentric weekly board (spec sec 9.2, sec 7.10): me + my accepted,
-- unblocked friends with our summed weekly points. SECURITY DEFINER because
-- points_ledger RLS is select-own by design -- friends' totals are only
-- visible through this shaped, block-aware view of them.
create or replace function public.get_weekly_leaderboard(week_in integer default 1)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_config jsonb,
  points bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with circle as (
    select auth.uid() as uid
    union
    select public.get_friend_ids() as uid
  )
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_config,
    coalesce(sum(pl.delta), 0)::bigint as points
  from circle c
  join public.profiles p on p.id = c.uid
  left join public.points_ledger pl
    on pl.user_id = p.id and pl.beta_week = week_in
  group by p.id, p.username, p.display_name, p.avatar_config
  order by points desc, p.username asc;
$$;
revoke all on function public.get_weekly_leaderboard(integer) from anon;
