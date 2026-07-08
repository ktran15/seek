-- M11: push_tokens — Expo push tokens per device (spec §13)
--
-- APPLY (founder): npx supabase db push
--
-- One row per DEVICE (token is the PK): the Edge Functions look up every
-- token a user has and send via the Expo Push API. Registration goes through
-- a SECURITY DEFINER RPC because a device that switches accounts must
-- reassign its token row to the new user — a plain RLS upsert can never
-- touch the previous owner's row, and a stale assignment would push user A's
-- results to a device now signed in as user B.

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
create policy "users read own push tokens"
  on public.push_tokens for select to authenticated
  using (user_id = auth.uid());
-- Sign-out deregisters the device so a signed-out phone stops getting pushes.
create policy "users delete own push tokens"
  on public.push_tokens for delete to authenticated
  using (user_id = auth.uid());
revoke insert, update on table public.push_tokens from authenticated, anon;

create or replace function public.register_push_token(
  p_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  -- Expo tokens look like ExponentPushToken[…] and stay well under 512.
  if p_token is null or length(trim(p_token)) = 0 or length(p_token) > 512 then
    raise exception 'Invalid token';
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'Invalid platform';
  end if;

  insert into public.push_tokens (token, user_id, platform)
  values (trim(p_token), auth.uid(), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text) from anon, public;
grant execute on function public.register_push_token(text, text) to authenticated;
