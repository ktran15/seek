# Seek — Build Progress

> Session-continuity tracker (see CLAUDE.md). A fresh session resumes from here:
> re-read CLAUDE.md + the current milestone in `SEEK_MVP_BUILD_SPEC_V2.md` §15,
> run `git log` / `git status`, then continue from the "Next step" pointer below.

## Current milestone: **M6 — Feed & interactions** (spec §5, §11, §15) — branch `m6-feed-and-interactions`

| # | Sub-step | Status |
|---|----------|--------|
| 1 | DB migration: feed_posts (auto-created from submissions + backfill), reactions w/ counter triggers, comments, reports — RLS + grants | ✅ authored — **founder must apply** |
| 2 | `feed` Edge Function: friends / FoF / explore visibility, explore like-count sort (current-day) w/ recency tiebreak, block-aware, signs ALL media paths | ✅ authored — **founder must deploy** |
| 3 | Client: useFeed hook, PostCard v2 (like toggle, comment count, day-5 carousel + tap-to-gallery, overflow report/block, day-3 vote chip) | ⬜ not started |
| 4 | Comments screen, friend suggestions woven into feeds, Home wired to real 3 feeds | ⬜ not started |

**Next step:** M6 sub-step 3 — client useFeed hook + PostCard v2.

<details><summary>M5 — H2H & community vote (complete — awaiting founder review) — branch merged to main</summary>

| # | Sub-step | Status |
|---|----------|--------|
| 0 | M4 review fixes: camera flip toggle, status-bar safe-area in challenge flow, own posts render in Friends feed | ✅ done |
| 1 | DB migration: h2h_matches, h2h_history, votes + cast_vote RPC, notifications, mascot targets in app_settings | ✅ authored — **founder must apply** |
| 2 | Pure logic, unit-tested: victor rules per day, friend cycling w/ pool reset, mascot targets, CV tie-sharing tally, EST clock math (31 new tests; 68 total) | ✅ done |
| 3 | Edge Functions: h2h-pair (submit-time pairing + friend sweep), day-close (re-pair sweep → mascot fallback; CV tally) | ✅ authored — **founder must deploy** |
| 4 | CV day 3: vote-feed Edge Fn (signed friend posts), pinned EST countdown on Challenge, /vote screen w/ one changeable vote | ✅ done |
| 5 | Client H2H surfaces: pairing call on submit, H2H status card on Challenge, results in Notifications (auto mark-read) | ✅ done |

**Next step:** M5 complete — founder review (apply migration + deploy functions + schedule cron below), then M6 after approval.

### ⚠️ Founder actions before testing M5
1. ✅ **Migration applied** (founder, 2026-07-07).
2. ✅ **Edge Functions deployed** (2026-07-07): h2h-pair + vote-feed (JWT-verified), day-close (no-verify-jwt; validates the service-role key itself). Redeploy after any change: `npx supabase functions deploy <name>` (day-close adds `--no-verify-jwt`).
3. ⬜ **Schedule day-close** — one paste in Dashboard → SQL Editor. Replace `PASTE_KEY_HERE` with the `service_role` key (Project Settings → API keys; the long `eyJ…` one). The key is stored encrypted in the DB vault, never in the repo:
   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;

   select vault.create_secret('PASTE_KEY_HERE', 'service_role_key');

   select cron.schedule(
     'seek-day-close',
     '5 4 * * *',  -- 04:05 UTC = 00:05 America/New_York during EDT (the beta)
     $$
     select net.http_post(
       url := 'https://aducawlftwdowvsnryar.supabase.co/functions/v1/day-close',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
       ),
       body := '{}'::jsonb,
       timeout_milliseconds := 30000
     );
     $$
   );
   ```
4. **Manual close for testing** (don't wait for midnight — run in SQL Editor after step 3; change beta_day as needed):
   ```sql
   select net.http_post(
     url := 'https://aducawlftwdowvsnryar.supabase.co/functions/v1/day-close',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
     ),
     body := '{"beta_day": 1}'::jsonb,
     timeout_milliseconds := 30000
   );
   ```

### M5 test guide (3 accounts: A + B friends, C friendless)
- **H2H pairing:** on an H2H day (1, 2, 5 — or 4 choosing Hard), A submits → Challenge screen shows "Rival search…". B submits → both resolve; Challenge shows victory/defeat per the day's rule; both get a Notifications entry. Verify the winner matches the rule (day 1 lower time, day 2 fewer guesses / X loses, day 5 higher count w/ earlier-submit tiebreak).
- **Cycling:** with A friending both B and C', A's next H2H day should pair the not-yet-faced friend (check `h2h_history`).
- **Mascot:** C (no friends) submits → stays pending → run the manual day-close curl → C resolves vs. mascot target and gets notified.
- **Vote (day 3):** blue countdown banner pinned on Challenge all day (EST clock). Tap → friends' food photos; vote, then change the vote (last write wins; `votes` has one row per voter). After close, cast_vote errors ("Voting is closed"); day-close writes vote_result notifications with tie-sharing placements.
- **M4 fixes:** camera flip button on day-1/photo/video capture (hidden while recording); reveal screen no longer under the status bar; your own submitted proof appears as a real post card in Home → Friends (photos render, videos play, day-5 strip swipes).

<details><summary>M4 — Challenge engine (complete; review fixes shipped in M5 sub-step 0)</summary>

DB migration (challenges seeded, submissions one-attempt + crash-safe, proofs
bucket), beta calendar + attempt state machine (unit-tested), reveal→begin
flow w/ day-4 difficulty, all 5 capture types, upload retry, post-submit
sequence, mountain on real calendar state. Founder feedback fixed: camera
flip, safe-area bleed, own posts in Friends feed.

</details>

<details><summary>M3 — Friend graph & social core (complete)</summary>

friendships+blocks migration (applied), block-aware graph SQL functions,
16 unit tests, Add Friends search+requests, Notifications accept/decline,
Profile friends count + invite entry.

</details>

<details><summary>M2 — Navigation & skeletons (complete, founder-verified; tabs reordered Challenge/Home/Profile)</summary>

Tab shell + top bar, Home 3-feed swipe, Challenge Mountain<->Leaderboard swipe
w/ data-driven 7-stop mountain, Profile skeleton + swipe->Shop, error
boundaries, stub screens (add-friends / notifications / settings).

</details>

<details><summary>M1 — Auth & onboarding (complete, founder-verified)</summary>

M1 exit criteria confirmed by founder 2026-07-06. DB migration applied.
Sub-steps: DB schema+RLS / session plumbing / email auth / Apple+Google /
onboarding steps 1-3 + username / avatar creation / invite (soft) + begin.

</details>

<details><summary>M0 — Foundation & scaffolding (complete)</summary>

Repo hygiene, Expo+TS strict+Router init, Supabase wiring, typed config
module, design tokens + 3D-press button, asset registry + placeholders,
EAS pipeline config. Founder still owes the interactive EAS login steps:
`npx eas-cli login`, `npx eas-cli init`, then a development build when ready.

</details>

## Milestone status
- M0: **complete** (founder still owes the 3 interactive EAS login steps)
- M1: **complete — founder-verified**
- M2: **complete — founder-verified**
- M3: **complete**
- M4: **complete — founder-verified** (review feedback fixed in M5 branch)
- M5: **complete — awaiting founder review** (apply migration, deploy functions, schedule cron)
- M6–M14: not started (do not work ahead — founder reviews after each milestone)

## Visible stubs (reported per spec §2.1)
- **H2H/vote rewards not paid yet:** resolution records win/placement + notification; bonus coins, blue crate, and points ledger writes are M7 (server-authoritative). UI says so.
- Post-submit sequence shows +50 coins and "wooden crate added" from config — ledger + crate rows are M7 (display only).
- Friends feed shows **own** posts only (M4 review ask); friends'/FoF/Explore posts, likes, comments, carousel gallery, report/block UI land in M6 (feed_posts rows too — vote-feed reads submissions directly until then).
- Day-3 countdown is pinned on the Challenge screen; the "countdown on day-3 feed posts" half arrives with the feed in M6.
- Post-submit stages are static screens; expressive animation (climb, crate pop, confetti) is M13.
- Push notifications (incl. "voting closes in 2h") are M11 — in-app Notifications screen carries results today.
- Profile header shows a single mutual **Friends** count (mutual friendship model; flagged for founder).
- Declined requests show as "REQUESTED" to the requester (silent decline — no re-request in v1).
- Invite coin reward (+50) not paid yet (M7); invite row recorded now. Share URL is a founder-set placeholder until TestFlight (M14).
- joined_beta_day + vote window compute from app_settings.beta — keep in sync with src/config beta.startDate. Mascot targets likewise (app_settings.mascot ↔ src/config mascot.targets).

## Notes / decisions this milestone (✅ founder-approved 2026-07-07)
- **Friend-match ties → earlier submission wins** (extends the day-5 LOCKED tie rule to all H2H days; a resolved match must always have a winner — the schema has no draw state).
- **Ties vs. the mascot's target → user wins** (spec §7.9 framing: friendly rival, never punishment).
- **Zero votes never places** in the CV tally (otherwise a friend group where nobody voted would all "win 1st").
- Pairing runs at submit (h2h-pair, which also fulfills friends' pending matches) AND at day close (sweep) — a client crash can never orphan a match.
- day-close is idempotent: resolved matches are never re-resolved; the CV tally is skipped if results already exist.
- Edge Functions share pure logic from `supabase/functions/_shared/` (jest-covered); Deno entry files are excluded from the app's tsc and get type-checked at deploy.
- expo-video added (proof playback in feed cards; needed for M6 anyway).

## Earlier notes (M0–M4)
- Git save system: commit per sub-step; `a815b86 Initial commit`.
- App name `"Seek"` lives ONCE in `app-name.json`. Bundle ID `com.smokeysummit.seek`.
- Expo SDK **54** (Expo Go compatible: RN 0.81.5, React 19.1, expo-router 6).
- Supabase project `aducawlftwdowvsnryar`, `sb_publishable_` key client-side (RLS is the boundary).
- Beta start date currently **2026-07-06** in BOTH `src/config` and `app_settings` (set for M4 testing).
- Zustand installed but still unused (React Query covers everything so far).
