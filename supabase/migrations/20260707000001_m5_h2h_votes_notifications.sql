-- M5: h2h_matches + h2h_history + votes + notifications (spec sec 6, sec 7.6, sec 7.7)
--
-- APPLY (founder): Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
--
-- Server-authoritative boundary (spec sec 2.1): clients can READ their own
-- rows below but never write matches/history/notifications -- Edge Functions
-- (service role) own those writes. Votes go through the cast_vote RPC only.

-- h2h_matches (spec sec 6, sec 7.6): one row per protagonist per H2H day.
-- opponent_id null + vs_mascot = mascot match; winner null + resolved = mascot won.
create table public.h2h_matches (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id),
  beta_day integer not null check (beta_day between 1 and 7),
  protagonist_id uuid not null references public.profiles (id) on delete cascade,
  opponent_id uuid references public.profiles (id) on delete set null,
  vs_mascot boolean not null default false,
  protagonist_submission uuid not null references public.submissions (id) on delete cascade,
  opponent_submission uuid references public.submissions (id) on delete set null,
  mascot_target_score numeric,
  winner_user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (protagonist_id, beta_day),
  check (not vs_mascot or opponent_id is null),
  check (status <> 'resolved' or resolved_at is not null)
);
create index h2h_matches_day_idx on public.h2h_matches (beta_day, status);
create index h2h_matches_opponent_idx on public.h2h_matches (opponent_id);

alter table public.h2h_matches enable row level security;
create policy "participants read own matches"
  on public.h2h_matches for select to authenticated
  using (protagonist_id = auth.uid() or opponent_id = auth.uid());
-- no insert/update/delete policies: Edge Functions (service role) only
revoke insert, update, delete on table public.h2h_matches from authenticated, anon;

-- h2h_history (spec sec 6, sec 7.6): powers no-repeat friend cycling.
-- beta_week always 1 for the 7-day beta; column kept per spec for v2 weeks.
create table public.h2h_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  faced_user_id uuid not null references public.profiles (id) on delete cascade,
  beta_week integer not null default 1,
  created_at timestamptz not null default now()
);
create index h2h_history_user_week_idx on public.h2h_history (user_id, beta_week);

alter table public.h2h_history enable row level security;
create policy "users read own h2h history"
  on public.h2h_history for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on table public.h2h_history from authenticated, anon;

-- votes (spec sec 6, sec 7.7): one vote per voter per CV day, changeable
-- until close. All writes go through cast_vote below (window + friendship
-- validation); the table itself accepts no direct client writes.
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  beta_day integer not null check (beta_day between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (voter_id, beta_day)
);
create index votes_submission_idx on public.votes (submission_id);

alter table public.votes enable row level security;
create policy "voters read own votes"
  on public.votes for select to authenticated
  using (voter_id = auth.uid());
revoke insert, update, delete on table public.votes from authenticated, anon;

-- Cast (or change) the day-3 community vote (spec sec 7.7 LOCKED):
-- window = beta day 3 on the global beta clock (America/New_York);
-- voter must be an accepted, unblocked friend of the poster; last write wins.
create or replace function public.cast_vote(target_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.submissions%rowtype;
  v_beta jsonb;
  v_day integer;
begin
  select * into v_sub
  from public.submissions
  where id = target_submission_id and state = 'submitted';
  if not found then
    raise exception 'Submission not found';
  end if;
  if v_sub.user_id = auth.uid() then
    raise exception 'You cannot vote for your own post';
  end if;
  if v_sub.beta_day <> 3 then
    raise exception 'This post is not part of the community vote';
  end if;

  select value into v_beta from public.app_settings where key = 'beta';
  v_day := ((now() at time zone coalesce(v_beta->>'timezone', 'America/New_York'))::date
            - (v_beta->>'start_date')::date) + 1;
  if v_day <> 3 then
    raise exception 'Voting is closed';
  end if;

  if public.is_blocked_pair(auth.uid(), v_sub.user_id) then
    raise exception 'You can only vote on friends'' posts';
  end if;
  if not exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = v_sub.user_id)
        or (f.addressee_id = auth.uid() and f.requester_id = v_sub.user_id))
  ) then
    raise exception 'You can only vote on friends'' posts';
  end if;

  insert into public.votes (submission_id, voter_id, beta_day)
  values (target_submission_id, auth.uid(), v_sub.beta_day)
  on conflict (voter_id, beta_day)
  do update set submission_id = excluded.submission_id, updated_at = now();
end;
$$;
revoke all on function public.cast_vote(uuid) from anon;

-- notifications (spec sec 6, sec 13): written by Edge Functions; the client
-- reads its own rows and may only flip the read flag.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in
    ('h2h_result', 'vote_result', 'vote_countdown', 'weekly_result',
     'daily_challenge', 'invite_nudge', 'friend_accepted')),
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "users read own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "users mark own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
revoke insert, update, delete on table public.notifications from authenticated, anon;
grant update (read) on table public.notifications to authenticated;

-- Server-side mascot config (spec sec 7.9): fixed beatable-but-not-trivial
-- targets per H2H day (day 4 = Hard bracket). TUNE -- keep in sync with
-- src/config mascot.targets.
insert into public.app_settings (key, value) values
  ('mascot', '{"enabled": true, "targets": {"1": 12, "2": 4, "4": 3, "5": 8}}')
on conflict (key) do nothing;
