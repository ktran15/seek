-- M4: challenges (seeded) + submissions (attempt state machine) + proofs bucket
-- (spec sec 6, sec 7.1, sec 7.4)
--
-- APPLY (founder): Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.

-- challenges: seeded catalog, one row per beta day. Read-only for clients.
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  beta_day integer not null unique check (beta_day between 1 and 7),
  title text not null,
  description text not null,
  explainer text not null,
  mode text not null check (mode in ('SP', 'H2H', 'CV')),
  capture_type text not null check (capture_type in
    ('timer_video', 'camera_photo', 'camera_video',
     'screenshot_plus_count', 'multi_photo_count')),
  has_difficulty boolean not null default false,
  difficulty_modes jsonb,
  victor_rule text check (victor_rule in
    ('lower_time', 'fewer_guesses', 'community_vote',
     'higher_count', 'higher_made_count', 'pass_fail')),
  recording_cap_seconds integer,
  vote_window jsonb,
  proof_required boolean not null default true
);

alter table public.challenges enable row level security;
create policy "challenges readable by authenticated"
  on public.challenges for select to authenticated using (true);
revoke insert, update, delete on table public.challenges from authenticated, anon;

-- Day -> challenge mapping is LOCKED (spec sec 7.1).
insert into public.challenges
  (beta_day, title, description, explainer, mode, capture_type,
   has_difficulty, difficulty_modes, victor_rule, recording_cap_seconds, vote_window)
values
  (1, 'Bottoms Up',
   'Fastest to drink a full water bottle.',
   'Grab a full water bottle. Recording IS the timer -- hit Begin, chug, tap Stop. Lower time wins your head-to-head. Auto-stops at 60s.',
   'H2H', 'timer_video', false, null, 'lower_time', 60, null),
  (2, 'Word Nerd',
   'Solve today''s Wordle in the fewest guesses.',
   'Play today''s Wordle, screenshot your result, and upload it with your guess count. Fewer guesses wins; an X loses to any solve.',
   'H2H', 'screenshot_plus_count', false, null, 'fewer_guesses', null, null),
  (3, 'Chef''s Kiss',
   'Best food of the day.',
   'Snap the best-looking food you eat today. Your friends vote; voting closes for everyone at the same time (EST). Top 3 earn rewards.',
   'CV', 'camera_photo', false, null, 'community_vote', null,
   '{"scope": "global_est", "closes": "end_of_day_3"}'),
  (4, 'Buckets',
   'Basketball -- pick your difficulty.',
   'Easy: paper ball into a trash can. Medium: make a free throw. Hard: 30 seconds of 3-pointers, most makes wins -- HARD IS THE ONLY WAY TO GO HEAD-TO-HEAD TODAY.',
   'SP', 'camera_video', true,
   '{"easy": "SP", "medium": "SP", "hard": "H2H"}',
   'higher_made_count', 30, null),
  (5, 'Squad Up',
   'Most selfies with different people.',
   'Take selfies with as many different people as you can (family and friends count). Up to 25 photos. Higher count wins; ties go to whoever submitted first.',
   'H2H', 'multi_photo_count', false, null, 'higher_count', null, null),
  (6, 'Slice of Life',
   'Photo of you and a slice of pizza.',
   'You + one slice of pizza, one photo. That''s it. That''s the challenge.',
   'SP', 'camera_photo', false, null, 'pass_fail', null, null),
  (7, 'Hold the Line',
   'Hold a 2-minute plank.',
   'Set up, hit record, and hold a plank for 2 minutes. Your video is the proof; your friends are the referees.',
   'SP', 'camera_video', false, null, 'pass_fail', null, null);

-- submissions: ONE attempt per user per challenge (spec sec 7.4).
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id),
  beta_day integer not null check (beta_day between 1 and 7),
  state text not null default 'in_progress'
    check (state in ('in_progress', 'submitted')),
  submitted_at timestamptz,
  passed boolean,
  score numeric check (score is null or score >= 0),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  media_paths jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id),
  check (state <> 'submitted' or submitted_at is not null)
);
create index submissions_user_idx on public.submissions (user_id);
create index submissions_day_idx on public.submissions (beta_day);

alter table public.submissions enable row level security;
create policy "users read own submissions"
  on public.submissions for select to authenticated
  using (user_id = auth.uid());
create policy "users start own attempts"
  on public.submissions for insert to authenticated
  with check (user_id = auth.uid() and state = 'in_progress');
-- Crash-safe retry (spec sec 7.4 LOCKED): while in_progress the row may be
-- reset/re-begun; once submitted it is terminal (no UPDATE passes this policy).
create policy "users update own in-progress attempts"
  on public.submissions for update to authenticated
  using (user_id = auth.uid() and state = 'in_progress')
  with check (user_id = auth.uid());

revoke insert, update, delete on table public.submissions from authenticated, anon;
grant insert (user_id, challenge_id, beta_day, difficulty)
  on table public.submissions to authenticated;
grant update (state, submitted_at, passed, score, difficulty, media_paths)
  on table public.submissions to authenticated;

-- proofs bucket: private; owner-folder access. Friend visibility arrives in
-- M6 via signed URLs minted server-side.
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

create policy "users upload own proofs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "users read own proofs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
