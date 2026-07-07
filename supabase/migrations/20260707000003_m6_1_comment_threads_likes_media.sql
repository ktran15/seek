-- M6.1 (founder review feedback): comment replies (one level, IG-style),
-- comment likes, and image comments (gallery or camera).
--
-- APPLY (founder): Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.

-- comments: one-level threading + optional image + denormalized like_count.
alter table public.comments
  add column parent_comment_id uuid references public.comments (id) on delete cascade,
  add column media_path text,
  add column like_count integer not null default 0 check (like_count >= 0);
create index comments_parent_idx on public.comments (parent_comment_id);

-- An image comment may have an empty body; text comments still need one.
alter table public.comments drop constraint comments_body_check;
alter table public.comments add constraint comments_body_check
  check (
    char_length(body) <= 500
    and (media_path is not null or char_length(body) >= 1)
  );

-- Replies are one level deep and stay on the parent's post; comment images
-- live in the commenter's own folder (upload RLS enforces the same rule --
-- this stops pointing a comment at someone else's file).
create or replace function public.validate_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_comment_id is not null then
    perform 1 from public.comments p
    where p.id = new.parent_comment_id
      and p.post_id = new.post_id
      and p.parent_comment_id is null;
    if not found then
      raise exception 'Replies must target a top-level comment on the same post';
    end if;
  end if;
  if new.media_path is not null
     and split_part(new.media_path, '/', 1) <> new.user_id::text then
    raise exception 'Comment media must live in your own folder';
  end if;
  return new;
end;
$$;
create trigger comments_validate
  before insert on public.comments
  for each row execute function public.validate_comment();

grant insert (post_id, user_id, body, parent_comment_id, media_path)
  on table public.comments to authenticated;

-- Visibility helper for comment reactions (mirror of can_view_post at the
-- comment level: live comment, visible post, no block between viewer+commenter).
create or replace function public.can_view_comment(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.comments c
    where c.id = cid
      and not c.removed
      and public.can_view_post(c.post_id)
      and not public.is_blocked_pair(c.user_id, auth.uid())
  );
$$;

-- comment_reactions: like toggle on comments (same shape as post reactions).
create table public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'like' check (type = 'like'),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
create index comment_reactions_comment_idx on public.comment_reactions (comment_id);

alter table public.comment_reactions enable row level security;
create policy "users read own comment reactions"
  on public.comment_reactions for select to authenticated
  using (user_id = auth.uid());
create policy "users like visible comments"
  on public.comment_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_comment(comment_id));
create policy "users unlike comments"
  on public.comment_reactions for delete to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on table public.comment_reactions from authenticated, anon;
grant insert (comment_id, user_id) on table public.comment_reactions to authenticated;
grant delete on table public.comment_reactions to authenticated;

create or replace function public.bump_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set like_count = like_count + 1 where id = new.comment_id;
    return new;
  else
    update public.comments
      set like_count = greatest(like_count - 1, 0) where id = old.comment_id;
    return old;
  end if;
end;
$$;
create trigger comment_reactions_bump_like_count
  after insert or delete on public.comment_reactions
  for each row execute function public.bump_comment_like_count();

-- comment-media bucket: private, owner-folder writes/reads (same pattern as
-- proofs); cross-user visibility only via server-minted signed URLs.
insert into storage.buckets (id, name, public)
values ('comment-media', 'comment-media', false)
on conflict (id) do nothing;

create policy "users upload own comment media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'comment-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "users read own comment media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'comment-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

revoke all on function public.can_view_comment(uuid) from anon;
revoke all on function public.validate_comment() from anon, authenticated;
revoke all on function public.bump_comment_like_count() from anon, authenticated;
