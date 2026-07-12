-- M13 security hardening (audit remediation, 2026-07-11)
--
-- APPLY (founder): `npx supabase db push`.
--
-- Addresses audit findings H1 (invite-mint), H2 (score fraud), M1 (award
-- double-pay race), and M2 (report dedupe + insert throttling). The M3
-- profiles-RLS finding is intentionally NOT here — it changes a SELECT
-- policy on a table read everywhere and is held for explicit founder review.
--
-- ⚠️ PRE-APPLY CHECK for the M1 unique indexes: if a past race already wrote
-- duplicate (ref_id, reason) ledger rows, the index build below will fail.
-- Verify first (expect zero rows):
--   select ref_id, reason, count(*) from public.coins_ledger
--     where ref_id is not null group by 1,2 having count(*) > 1;
--   select ref_id, reason, count(*) from public.points_ledger
--     where ref_id is not null group by 1,2 having count(*) > 1;
-- Do NOT delete ledger rows to force it through — the balance trigger already
-- applied those deltas; a failed build is itself a signal to investigate.

-- ===========================================================================
-- H1 — Invite reward can no longer be minted by direct inserts.
-- The client insert grant is revoked; the ONLY paid path is send_invite(),
-- a SECURITY DEFINER RPC with a per-user daily cap. Reward-on-send (spec §7.8)
-- is preserved; the unbounded scripted-insert loop is closed.
-- ===========================================================================
revoke insert on table public.invites from authenticated;

-- Founder-tunable anti-abuse cap (audit-chosen default; real sharing is a
-- handful/day, this only bounds automated abuse).
create or replace function public.send_invite(channel_in text default 'imessage')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
  daily_cap constant integer := 10;
  new_code text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if channel_in not in ('imessage', 'link') then
    raise exception 'Invalid channel';
  end if;

  select count(*) into recent
  from public.invites
  where inviter_id = auth.uid()
    and sent_at > now() - interval '1 day';
  if recent >= daily_cap then
    raise exception 'Daily invite limit reached — try again tomorrow';
  end if;

  insert into public.invites (inviter_id, channel)
  values (auth.uid(), channel_in)
  returning invite_code into new_code;
  return new_code;
end;
$$;
revoke all on function public.send_invite(text) from anon, public;
grant execute on function public.send_invite(text) to authenticated;

-- ===========================================================================
-- H2 — Server-side score bounds at submit time.
-- A modified client can still self-report proof (by design — the media is the
-- social check, backstopped by report→admin-moderate), but the trivial numeric
-- extremes (0-second times, 25 selfies with 2 photos, out-of-range counts) are
-- now rejected at the DB before any award trigger reads the value.
-- ===========================================================================
create or replace function public.validate_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ch public.challenges%rowtype;
  photo_count integer;
begin
  if new.state <> 'submitted' then
    return new;
  end if;

  select * into ch from public.challenges where id = new.challenge_id;
  if not found then
    raise exception 'Unknown challenge';
  end if;

  case ch.capture_type
    when 'timer_video' then
      -- Recording IS the timer; a score below 1s or above the cap is impossible.
      if new.score is null
         or new.score < 1
         or new.score > coalesce(ch.recording_cap_seconds, 60) then
        raise exception 'Invalid time for this challenge';
      end if;
    when 'screenshot_plus_count' then
      -- Wordle: 1–6 guesses, or 7 = X (fail).
      if new.score is null or new.score < 1 or new.score > 7 then
        raise exception 'Invalid guess count';
      end if;
    when 'multi_photo_count' then
      -- Count is the score AND must equal the number of proof photos (TUNE 25).
      photo_count := jsonb_array_length(new.media_paths);
      if new.score is null or new.score < 1 or new.score > 25 then
        raise exception 'Invalid selfie count';
      end if;
      if new.score <> photo_count then
        raise exception 'Selfie count must match the number of photos submitted';
      end if;
    when 'camera_video' then
      -- Day 4 Hard carries a made-count; Easy/Medium and Day 7 are pass/fail
      -- (score null). Bound the made-count only.
      if new.difficulty = 'hard'
         and (new.score is null or new.score < 0 or new.score > 99) then
        raise exception 'Invalid made count';
      end if;
    else
      -- camera_photo (pass/fail day 6, community-vote day 3): no numeric score.
      null;
  end case;

  return new;
end;
$$;
revoke all on function public.validate_submission() from anon, authenticated;

drop trigger if exists submissions_validate on public.submissions;
create trigger submissions_validate
  before insert or update of state on public.submissions
  for each row execute function public.validate_submission();

-- ===========================================================================
-- M1 — Award idempotence enforced by the DB, not check-then-insert.
-- coins/points ledgers get a partial unique index on (ref_id, reason): a
-- concurrent second award for the same match/submission fails cleanly instead
-- of double-paying. The Edge Functions treat 23505 as "already paid" and the
-- H2H resolver only awards when its status='pending' → 'resolved' update
-- actually claimed the row (see pairing.ts). Partial (ref_id not null) leaves
-- the ref-less weekly payout rows — deduped per user in weekly-payout — alone.
-- ===========================================================================
create unique index if not exists coins_ledger_ref_reason_uniq
  on public.coins_ledger (ref_id, reason) where ref_id is not null;
create unique index if not exists points_ledger_ref_reason_uniq
  on public.points_ledger (ref_id, reason) where ref_id is not null;

-- ===========================================================================
-- M2 — Report dedupe + insert throttling on the abuse-prone tables.
-- ===========================================================================
-- One report per user per target (post/comment) — can't spam the triage queue
-- against one victim.
create unique index if not exists reports_reporter_post_uniq
  on public.reports (reporter_id, post_id) where post_id is not null;
create unique index if not exists reports_reporter_comment_uniq
  on public.reports (reporter_id, comment_id) where comment_id is not null;

-- Lightweight per-user, per-minute insert caps (founder-tunable; generous for
-- real use, bounds flooding). One counter query per insert — fine at beta volume.
-- tg_argv[0] = per-minute limit, tg_argv[1] = the actor column on this table
-- (comments.user_id, reports.reporter_id). to_jsonb(new) reads it generically.
create or replace function public.throttle_inserts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
  window_limit integer := tg_argv[0]::integer;
  actor_col text := tg_argv[1];
  actor uuid := (to_jsonb(new) ->> actor_col)::uuid;
begin
  execute format(
    'select count(*) from public.%I where %I = $1 and created_at > now() - interval ''1 minute''',
    tg_table_name, actor_col
  ) into recent using actor;
  if recent >= window_limit then
    raise exception 'Slow down — you''re doing that too fast';
  end if;
  return new;
end;
$$;
revoke all on function public.throttle_inserts() from anon, authenticated;

drop trigger if exists comments_throttle on public.comments;
create trigger comments_throttle
  before insert on public.comments
  for each row execute function public.throttle_inserts('12', 'user_id');

drop trigger if exists reports_throttle on public.reports;
create trigger reports_throttle
  before insert on public.reports
  for each row execute function public.throttle_inserts('6', 'reporter_id');
