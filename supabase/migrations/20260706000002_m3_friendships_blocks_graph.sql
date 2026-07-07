-- M3: friendships + blocks + block-aware graph functions (spec sec 6, sec 7.10)
--
-- APPLY (founder): Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.

-- blocks (spec sec 6): removes the pair from feeds, suggestions, H2H pools,
-- vote visibility -- both directions. Enforced inside the graph functions.
-- (Created first: friendships policies depend on is_blocked_pair below.)
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);
create index blocks_blocker_idx on public.blocks (blocker_id);
create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;
create policy "users read own blocks"
  on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "users create own blocks"
  on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "users remove own blocks"
  on public.blocks for delete to authenticated using (blocker_id = auth.uid());

revoke insert, update, delete on table public.blocks from authenticated, anon;
grant insert (blocker_id, blocked_id) on table public.blocks to authenticated;
grant delete on table public.blocks to authenticated;

-- True if either user blocks the other. SECURITY DEFINER so policies and
-- graph functions can see both directions (RLS hides the other side's row).
create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- friendships (spec sec 6): mutual when accepted; FoF derived by query.
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
-- One edge per pair regardless of direction.
create unique index friendships_pair_uniq on public.friendships
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;
create policy "participants read own friendships"
  on public.friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "users send friend requests"
  on public.friendships for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'pending'
    and not public.is_blocked_pair(requester_id, addressee_id)
  );
create policy "addressee responds to pending requests"
  on public.friendships for update to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status in ('accepted', 'declined'));

revoke insert, update, delete on table public.friendships from authenticated, anon;
grant insert (requester_id, addressee_id) on table public.friendships to authenticated;
grant update (status, responded_at) on table public.friendships to authenticated;

-- Accepted-friend ids of the caller, minus blocked pairs.
create or replace function public.get_friend_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select case when f.requester_id = auth.uid() then f.addressee_id
              else f.requester_id end
  from public.friendships f
  where f.status = 'accepted'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
    and not public.is_blocked_pair(f.requester_id, f.addressee_id);
$$;

-- Friends-of-friends (spec sec 7.10): one hop out, excluding self, existing
-- friends, and blocked pairs. Returns profile rows for direct display.
create or replace function public.get_fof_profiles()
returns table (id uuid, username text, display_name text, avatar_config jsonb)
language sql
stable
security definer
set search_path = public
as $$
  with my_friends as (select public.get_friend_ids() as fid)
  select distinct p.id, p.username, p.display_name, p.avatar_config
  from my_friends mf
  join public.friendships f
    on f.status = 'accepted'
   and (f.requester_id = mf.fid or f.addressee_id = mf.fid)
  join public.profiles p
    on p.id = case when f.requester_id = mf.fid then f.addressee_id
                   else f.requester_id end
  where p.id <> auth.uid()
    and p.id not in (select fid from my_friends)
    and not public.is_blocked_pair(p.id, mf.fid)
    and not public.is_blocked_pair(p.id, auth.uid());
$$;

-- Username search (Add Friends): prefix match, excluding self and blocked
-- pairs (either direction -- a user you blocked or who blocked you is gone).
create or replace function public.search_profiles(term text)
returns table (id uuid, username text, display_name text, avatar_config jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_config
  from public.profiles p
  where p.username ilike (term || '%')
    and p.id <> auth.uid()
    and p.username is not null
    and not public.is_blocked_pair(p.id, auth.uid())
  order by p.username
  limit 20;
$$;

revoke all on function public.is_blocked_pair(uuid, uuid) from anon;
revoke all on function public.get_friend_ids() from anon;
revoke all on function public.get_fof_profiles() from anon;
revoke all on function public.search_profiles(text) from anon;
