-- M6: feed_posts + reactions + comments + reports (spec sec 5, sec 6, sec 11, sec 12)
--
-- feed_posts rows are created by a trigger when a submission is submitted
-- (plus a backfill below) -- clients never write posts. like_count and
-- comment_count are denormalized via counter triggers so the Explore sort
-- (like-count within current beta day, recency tiebreak) is a single index
-- scan. Visibility: every post is readable by any authenticated user except
-- across a block (Explore is global, spec sec 5); friends/FoF scoping is a
-- feed-shape concern handled by the feed Edge Function, not row secrecy.

-- feed_posts (spec sec 6)
create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  beta_day integer not null check (beta_day between 1 and 7),
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  removed boolean not null default false,
  created_at timestamptz not null default now()
);
create index feed_posts_explore_idx
  on public.feed_posts (beta_day, like_count desc, created_at desc);
create index feed_posts_author_idx on public.feed_posts (author_id);

alter table public.feed_posts enable row level security;
create policy "posts visible unless removed or blocked"
  on public.feed_posts for select to authenticated
  using (
    author_id = auth.uid()
    or (not removed and not public.is_blocked_pair(author_id, auth.uid()))
  );
-- no insert/update/delete policies: trigger + service role only
revoke insert, update, delete on table public.feed_posts from authenticated, anon;

-- Auto-create the post when a submission reaches 'submitted' (spec sec 7.4:
-- submitted is terminal, so one fire per submission; on conflict guards
-- re-runs anyway). SECURITY DEFINER: the submitting user has no insert
-- grant on feed_posts.
create or replace function public.create_feed_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.state = 'submitted' then
    insert into public.feed_posts (submission_id, author_id, beta_day, created_at)
    values (new.id, new.user_id, new.beta_day, coalesce(new.submitted_at, now()))
    on conflict (submission_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger submissions_create_feed_post
  after insert or update of state on public.submissions
  for each row execute function public.create_feed_post();

-- Backfill posts for submissions that predate this table.
insert into public.feed_posts (submission_id, author_id, beta_day, created_at)
select s.id, s.user_id, s.beta_day, coalesce(s.submitted_at, s.created_at)
from public.submissions s
where s.state = 'submitted'
on conflict (submission_id) do nothing;

-- Visibility helper for reactions/comments policies (SECURITY DEFINER so the
-- check sees the post row regardless of the caller's RLS view of it).
create or replace function public.can_view_post(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.feed_posts fp
    where fp.id = pid
      and (fp.author_id = auth.uid()
        or (not fp.removed and not public.is_blocked_pair(fp.author_id, auth.uid())))
  );
$$;

-- reactions (spec sec 6): like toggle. Counter trigger maintains like_count.
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'like' check (type = 'like'),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index reactions_post_idx on public.reactions (post_id);

alter table public.reactions enable row level security;
create policy "users read own reactions"
  on public.reactions for select to authenticated using (user_id = auth.uid());
create policy "users like visible posts"
  on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_post(post_id));
create policy "users unlike"
  on public.reactions for delete to authenticated using (user_id = auth.uid());

revoke insert, update, delete on table public.reactions from authenticated, anon;
grant insert (post_id, user_id) on table public.reactions to authenticated;
grant delete on table public.reactions to authenticated;

create or replace function public.bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  else
    update public.feed_posts
      set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end;
$$;
create trigger reactions_bump_like_count
  after insert or delete on public.reactions
  for each row execute function public.bump_like_count();

-- comments (spec sec 6, sec 11). No client edit/delete in v1 (no
-- hard-delete policy, spec sec 6); admin removal sets removed=true.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  removed boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;
create policy "comments visible with their post"
  on public.comments for select to authenticated
  using (
    public.can_view_post(post_id)
    and (not removed or user_id = auth.uid())
    and not public.is_blocked_pair(user_id, auth.uid())
  );
create policy "users comment on visible posts"
  on public.comments for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_post(post_id));

revoke insert, update, delete on table public.comments from authenticated, anon;
grant insert (post_id, user_id, body) on table public.comments to authenticated;

-- comment_count counts live (non-removed) comments only.
create or replace function public.bump_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not new.removed then
      update public.feed_posts set comment_count = comment_count + 1 where id = new.post_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if old.removed and not new.removed then
      update public.feed_posts set comment_count = comment_count + 1 where id = new.post_id;
    elsif not old.removed and new.removed then
      update public.feed_posts
        set comment_count = greatest(comment_count - 1, 0) where id = new.post_id;
    end if;
    return new;
  else
    if not old.removed then
      update public.feed_posts
        set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    end if;
    return old;
  end if;
end;
$$;
create trigger comments_bump_comment_count
  after insert or update of removed or delete on public.comments
  for each row execute function public.bump_comment_count();

-- reports (spec sec 6, sec 12): any post/comment (or a user directly) can be
-- reported. Feeds the founder admin path (service role reads; sets
-- removed=true on posts/comments). Targets use set null so the report
-- survives content deletion.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.feed_posts (id) on delete set null,
  comment_id uuid references public.comments (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  reason text not null check (reason in
    ('inappropriate', 'spam', 'fake_proof', 'harassment', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null or reported_user_id is not null)
);
create index reports_status_idx on public.reports (status, created_at);

alter table public.reports enable row level security;
create policy "users read own reports"
  on public.reports for select to authenticated using (reporter_id = auth.uid());
create policy "users file reports"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
-- status changes are the admin path (service role) only
revoke insert, update, delete on table public.reports from authenticated, anon;
grant insert (reporter_id, post_id, comment_id, reported_user_id, reason, details)
  on table public.reports to authenticated;

revoke all on function public.can_view_post(uuid) from anon;
revoke all on function public.create_feed_post() from anon, authenticated;
revoke all on function public.bump_like_count() from anon, authenticated;
revoke all on function public.bump_comment_count() from anon, authenticated;
