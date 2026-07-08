-- M10: admin moderation path (spec sec 12)
--
-- APPLY (founder): `npx supabase db push`, or paste in Dashboard -> SQL Editor.
--
-- The admin removal path is founder-only tooling: an open_reports triage view
-- (SQL Editor / service role) + the admin-moderate Edge Function that sets
-- removed=true on posts/comments and closes reports. Clients never gain any
-- new write surface here.

-- Triage view: every open report with enough context to act on it without
-- hand-joining. SECURITY DEFINER semantics (security_invoker = off) are
-- intentional -- the view must see rows across users; it is therefore
-- revoked from client roles below and readable only by postgres (SQL
-- Editor) and service_role (admin-moderate).
create view public.open_reports
with (security_invoker = off) as
select
  r.id as report_id,
  r.reason,
  r.details,
  r.created_at,
  reporter.username as reporter_username,
  r.post_id,
  post_author.username as post_author_username,
  fp.beta_day as post_beta_day,
  fp.removed as post_removed,
  r.comment_id,
  comment_author.username as comment_author_username,
  c.body as comment_body,
  c.removed as comment_removed,
  r.reported_user_id,
  reported.username as reported_username
from public.reports r
join public.profiles reporter on reporter.id = r.reporter_id
left join public.feed_posts fp on fp.id = r.post_id
left join public.profiles post_author on post_author.id = fp.author_id
left join public.comments c on c.id = r.comment_id
left join public.profiles comment_author on comment_author.id = c.user_id
left join public.profiles reported on reported.id = r.reported_user_id
where r.status = 'open'
order by r.created_at;

revoke all on public.open_reports from anon, authenticated;
grant select on public.open_reports to service_role;

-- Removed-content propagation hardening (spec sec 12: removed content
-- disappears from ALL surfaces immediately): cast_vote predates removal and
-- accepted votes for any submitted day-3 post. Recreated with a removed
-- check so a removed post can no longer receive votes. (The vote-feed and
-- day-close functions get the matching read-side filters in this milestone.)
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
  if exists (
    select 1 from public.feed_posts fp
    where fp.submission_id = target_submission_id and fp.removed
  ) then
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
