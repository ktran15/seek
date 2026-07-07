# Seek — Build Progress

> Session-continuity tracker (see CLAUDE.md). A fresh session resumes from here:
> re-read CLAUDE.md + the current milestone in `SEEK_MVP_BUILD_SPEC_V2.md` §15,
> run `git log` / `git status`, then continue from the "Next step" pointer below.

## Comment-sheet polish pass (founder-directed, pre-M9) — on `main`
1. **Tap-outside-to-dismiss** — backdrop now dimmed at every detent (removed `sheetLargestUndimmedDetentIndex: 0`): UIKit's scrim natively dismisses on tap with the same slide-down as a swipe. Trade-off: the post behind is dimmed (it was undimmed before) — that dimming is what makes the tap land on the scrim instead of the feed.
2. **Keyboard gap** — the dock no longer translates above the keyboard; the keyboard's height becomes dock **padding**, so the dock surface paints continuously down behind the keyboard (no seam possible at any size/mid-animation); layout change animates with the keyboard's own duration, skipped under reduced motion.
3. **Tap-to-expand** — focusing the input sets `sheetAllowedDetents: [0.95]` (native slide-up to full, keyboard already up); blur restores `[0.6, 0.95]` so the sheet stays large but can be dragged back down.

**On-device checks:** tap the dimmed post → sheet slides down; focus input at partial height → sheet slides to full with keyboard attached, zero gap above the keyboard while typing; dismiss keyboard → bar settles flush above the home indicator; iOS Reduce Motion on → no keyboard-ride animation, everything still lands in place.

### Round 2 refinements (founder-directed, pre-M9) — on `main`
1. **Smooth tap-to-expand** — the jump came from changing detents mid-keyboard-animation. Now UIKit's own keyboard-driven sheet slide (the same spring as the sheet open) does the expansion; the full-detent pin applies only after `keyboardDidShow` (visual no-op that keeps the sheet expanded).
2. **Two-stage collapse, in order** — while typing, the sheet's dismiss gesture is OFF and the list uses `keyboardDismissMode="on-drag"`: swipe #1 drops only the keyboard (sheet stays expanded). On blur the gesture returns and the sheet is pinned to the single full detent, so swipe #2 closes the whole sheet. Never both in one swipe.
3. **Posting feedback** — a sent comment appears immediately as a dimmed row with a spinner + "Posting…", placed in its thread (replies auto-expand their thread), then settles into the real row via an ease layout transition when the server thread catches up; failure removes it and alerts. Empty state suppressed while the first comment posts.
4. **Collapsed replies** — threads show the first reply only; "View X more replies" (with divider rule, IG-style) expands the rest with an ease transition.
All LayoutAnimation transitions are skipped under Reduce Motion (`useReducedMotion`); native sheet/keyboard animations follow the system setting.

**On-device checks (round 2):** tap input at partial height → one continuous slide to full, identical feel to the button-open; swipe down while typing → keyboard drops, sheet stays big; swipe down again → sheet closes; post a comment → dimmed "Posting…" row → settles solid; post a reply into a collapsed thread → thread expands and shows it; a thread with 3 replies shows 1 + "View 2 more replies".

## Current milestone: **M8 — Avatar & cosmetics** (spec §10, §15) — branch `m8-avatar-and-cosmetics`

| # | Sub-step | Status |
|---|----------|--------|
| 1 | Pure layer-resolution logic + unit tests: 8-slot z-order, jacket-closed rule (jacket occludes shirt), base shirt/pants/backpack fallbacks, stale-cosmetic-id safety (7 tests) | ✅ done |
| 2 | AvatarPreview v2: renders equipped cosmetics as placeholder layers (rarity-tinted, slot-shaped) over the base; onboarding usage unchanged | ✅ done |
| 3 | Inventory equip/preview: tap cosmetic → try-on modal → EQUIP/UNEQUIP persists to `avatar_config.equipped` (client-updatable column, M1 grants) | ✅ done |
| 4 | Settings → Edit avatar base screen (skin/eyes/hair/hair color pickers + live full-look preview, SAVE preserves equipped gear) | ✅ done |

**Next step:** M8 complete — founder review, then M9 after approval. **No migrations or function deploys needed for M8** (pure client; persistence uses the M1 avatar_config grant). The two M7 deploys (crate-open, day-close) are still open below and are needed to TEST M8 (you open crates to get cosmetics).

### M8 test guide
- **Get cosmetics:** deploy `crate-open` (below) → Inventory → open a few crates.
- **Equip:** Profile → Inventory → tap an owned cosmetic → modal shows it ON your avatar → EQUIP → row shows EQUIPPED; the Profile header avatar updates immediately and survives an app restart (persistence).
- **Layers render correctly:** equip boots/hat/sunglasses/pet → each draws in its own place (rarity-colored placeholder shapes until the M12 art pass); equip pants/shirt/backpack → the base gear recolors to the cosmetic.
- **Jacket-closed rule (LOCKED):** equip a shirt, then a jacket → the shirt layer disappears entirely (preview and Profile); unequip the jacket → shirt returns.
- **Unequip:** tap an equipped cosmetic → UNEQUIP → base gear returns (or the slot empties for hats/boots/etc.).
- **Edit base:** Settings → "Edit avatar base" → change skin/eyes/hair/hair color with live preview → SAVE → Profile reflects it and **equipped cosmetics stay on**.

### M8 decisions (flag for founder)
- Cosmetic layers are **code-drawn placeholder shapes tinted by rarity color** (same approach as the M1 base avatar) — real layer art replaces them in M12 per the Rig Bible; ids/slots are already wired.
- Onboarding's legacy `equipped: BASE_EQUIPPED` marker ids (`baseShirt` etc.) resolve as "nothing equipped" in the new resolver → base gear renders; no data migration needed.
- Layer z-order + jacket-closed rule live in pure, unit-tested `resolveLayers` (7 tests; 85 total).

<details><summary>M7 comment-section bug-fix pass (complete — merged to main via PR #1)</summary>

### was: **M7 comment-section bug-fix pass** (founder-directed) — branch `m7-comment-fixes`

Two founder-reported defects in the M6.1 comment sheet. No redesign — targeted fixes.

| # | Sub-step | Status |
|---|----------|--------|
| 1 | Root-cause Bug 1 ("comments don't load"): confirmed **ops state, not code** — `comments` Edge Fn was never deployed (404) and the M6.1 migration never applied (no `like_count`/`parent_comment_id`/`media_path`, no `comment_reactions`, no bucket). Text comments still inserted (M6 RLS), so counts rose while the sheet showed the error state | ✅ done |
| 2 | Remediate live project: migration history repaired (dashboard-applied 1–5 marked applied), `db push` applied M6.1 + M7 migrations, deployed `comments`, redeployed `h2h-pair` | ✅ done 2026-07-07 |
| 3 | Load hardening (client): distinct error state + PressButton Retry in the sheet, `refetchOnMount:'always'` + 15s poll on the open thread, React Query `focusManager` wired to AppState | ✅ done |
| 4 | Composer/keyboard fix: removed the inner KeyboardAvoidingView (the iOS formSheet already lifts onto the keyboard natively — KAV double-compensated → bar floated far above the keyboard); idle bar pinned flush via `useSafeAreaInsets().bottom` (was hard-coded padding); FlatList `flex:1` so short threads can't float the bar mid-sheet | ✅ done |
| 5 | Repair corrupted `node_modules` (reanimated missing `publicGlobals` — broke Metro); lockfile resolved + committed | ✅ done |
| 6 | Sheet layout fix (founder round 2): root cause = SDK 54 react-native-screens numeric-detent formSheet ignores flex from its wrapper (flex support lands SDK 55) AND force-frames a bare ScrollView child to the sheet bounds (RNS #3569) → list stretched under the title + composer stranded mid-sheet. Fix: single explicitly-sized root View (`height: '100%'`, commented for SDK 55 cleanup) restoring a reliable inner flex column | ✅ done |
| 7 | Dedicated header region: grabber-clearing top padding (`spacing.lg`) + centered title, normal flow — first comment can never sit under handle/title | ✅ done |

**Next step:** founder verifies the two-item layout checklist on a physical iPhone (guide below), then merge to `main`.

### ⚠️ Founder actions still open (2 commands — blocked for the agent by permissions)
```
npx supabase functions deploy crate-open --project-ref aducawlftwdowvsnryar
npx supabase functions deploy day-close --no-verify-jwt --project-ref aducawlftwdowvsnryar
```
Until day-close is redeployed it still runs the pre-M7 code: matches resolve but day-close-time H2H sweeps and the CV tally won't pay coins/points/crates (h2h-pair-time resolutions DO pay — it was redeployed). Award wiring is ref-deduped, so paying later never double-pays. crate-open is needed to open crates from Inventory.

### Layout-fix checklist (physical iPhone — round 2, do these two first)
1. **Header:** open comments on a post with several comments → grabber, then "Comments", then the first comment, each in its own space — the title never prints over a commenter's name. Drag between the ⅗ and full detents: still true at both.
2. **Composer:** open comments on a post with 0–2 comments → the "Add a comment…" bar sits flush at the very bottom of the sheet just above the home indicator, with the empty list area ABOVE it (no dead space below). Keyboard behavior unchanged: focus → bar rides directly on the keyboard; dismiss → settles back flush.

### Comment-fix test guide (physical iPhone)
- **Load:** open any post's comments → thread loads with author, text, images, likes; removed/blocked-user comments hidden; count on the card matches. Airplane-mode open → "Comments didn't load" + RETRY, which recovers after reconnect.
- **Fresh comments:** comment from account B while A's sheet is open → appears on A within ~15s; also on reopen and on app-foreground.
- **Idle composer:** bar sits flush at the sheet bottom, just above the home indicator — no dead gap, no hard-coded margin.
- **Keyboard:** tap the input → the sheet rises with the keyboard and the bar sits directly on top of it — no gap, no overshoot (iMessage feel). Dismiss → settles back flush.

</details>

<details><summary>M7 — Economy & crates (complete — merged to main; 2 founder deploys still open)</summary>

### was: **M7 — Economy & crates** (spec §9, §15) — on `main` (founder pre-approved 2026-07-07)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | DB migration: coins_ledger + points_ledger (append-only, balance trigger), crates, cosmetics catalog (seeded) + user_cosmetics, completion/invite award triggers, buy_crate + open_crate_apply RPCs, economy in app_settings, award backfill | ✅ authored — **founder must apply** |
| 2 | Pure logic, unit-tested: gacha rarity roll (injectable RNG), vote-placement → reward mapping, drop-rate validation, dupe refund (78 tests total) | ✅ done |
| 3 | Edge Functions: crate-open (CSPRNG roll + atomic open_crate_apply); award wiring into h2h-pair/day-close (ref-deduped — re-runs never double-pay) | ✅ authored — **founder must deploy** |
| 4 | Client: Shop grid (buy w/ live coin balance), Inventory (unopened crates → open reveal w/ dupe messaging, owned cosmetics), Profile stats live (H2H W-L, votes won, coins earned), post-submit copy updated | ✅ done |

**Next step:** M7 complete — founder review (actions below), then M8 after approval.

### ⚠️ Founder actions before testing M6/M6.1/M7 (consolidated — updated 2026-07-07 by the comment-fix pass)
1. ✅ **All migrations applied** (comment-fix pass, 2026-07-07): M6 was already live (dashboard-applied); M6.1 + M7 applied via `supabase db push` after `migration repair` synced the history. Future migrations can now use plain `db push`.
2. ✅ `feed`, `comments` deployed; `h2h-pair` redeployed (comment-fix pass, 2026-07-07).
3. ⬜ **Two deploys still yours** (agent permission-blocked):
   ```
   npx supabase functions deploy crate-open --project-ref aducawlftwdowvsnryar
   npx supabase functions deploy day-close --no-verify-jwt --project-ref aducawlftwdowvsnryar
   ```

### M7 test guide
- **Completion award:** submit a challenge → Profile coins +50, wooden crate in Inventory, `coins_ledger`/`points_ledger` rows (reason `completion`). Re-running/day-close never double-pays.
- **H2H win:** winner gets +30 coins, +5 points, a blue crate (check after a pairing resolves; beating the mascot pays too — losing to it pays nothing).
- **Vote placement (day 3 close):** 1st = +50/+5 + yellow crate; 2nd/3rd = +30/+3 / +20/+2 + red crate; tie-sharers each get the full purse.
- **Shop:** balance pill shows real coins; BUY confirms, deducts, crate appears in Inventory; buying beyond your balance fails server-side ("Not enough coins"); gold isn't purchasable anywhere.
- **Crate open:** Inventory → OPEN → reveal shows name + rarity color chip; a **duplicate** shows "Converted to +20 coins" and the balance rises; the crate is gone either way (check `crates.opened`). Rolls are server-side — repeat opens to sanity-check rarity spread.
- **Stats:** Profile → Stats now shows live H2H W-L, votes won, coins earned.
- **Invite reward:** sharing an invite pays +50 (ledger reason `invite_reward`). Past invites/submissions were retro-paid by the migration backfill.

### M7 decisions so far (flag for founder)
- **Completion award pays on submission, pass or fail** (a failed day-2 Wordle or missed day-6 photo still "did the challenge"; spec §9.1 says "complete daily challenge"). Easy to flip to passed-only — say the word.
- **Invite reward is uncapped** per spec §7.8 (reward on send). A determined user could farm +50s by re-sharing; beta-acceptable, flagged for v1.1.
- Crate purchases run through a `buy_crate` RPC (SECURITY DEFINER, row-locked, balance floor enforced by the ledger trigger) — server-side per §2.1; the gacha **roll** stays in the crate-open Edge Function per §9.4 LOCKED.
- Migration retro-awards completions/invites that predate the ledgers (the client had been showing "+50 coins" from config since M4).

</details>

<details><summary>M6 — Feed & interactions (complete — founder retesting M6.1) </summary>

### was: **M6 — Feed & interactions** (spec §5, §11, §15) — branch `m6-feed-and-interactions`

| # | Sub-step | Status |
|---|----------|--------|
| 1 | DB migration: feed_posts (auto-created from submissions + backfill), reactions w/ counter triggers, comments, reports — RLS + grants | ✅ authored — **founder must apply** |
| 2 | `feed` Edge Function: friends / FoF / explore visibility, explore like-count sort (current-day) w/ recency tiebreak, block-aware, signs ALL media paths | ✅ authored — **founder must deploy** |
| 3 | Client: useFeed hook, PostCard v2 (like toggle, comment count, day-5 carousel + tap-to-gallery, overflow report/block, day-3 vote chip) | ✅ done |
| 4 | Comments screen, friend suggestions woven into feeds, Home wired to real 3 feeds | ✅ done |
| 5 | M6.1 founder feedback: double-tap like, comment bottom sheet (formSheet detents), comment replies + likes, image/camera comment replies, keyboard fix | ✅ done — needs migration + `comments` fn deploy |

**Next step:** founder retests M6.1, M7 underway (founder pre-approved continuing).

### ⚠️ Founder actions before testing M6 / M6.1
1. ⬜ **Apply BOTH migrations** — Dashboard → SQL Editor → paste + Run, in order:
   `supabase/migrations/20260707000002_m6_feed_reactions_comments_reports.sql`, then
   `supabase/migrations/20260707000003_m6_1_comment_threads_likes_media.sql`.
2. ⬜ **Deploy both functions** (after `npx supabase login` if needed):
   `npx supabase functions deploy feed --project-ref aducawlftwdowvsnryar`
   `npx supabase functions deploy comments --project-ref aducawlftwdowvsnryar`

### M6.1 retest list (on top of the M6 guide below)
- **Double-tap like:** double-tap a photo post → heart pops on the media, like sticks (double-tap never unlikes; the heart button toggles). On a day-5 carousel a single tap still opens the gallery, slightly delayed. Videos keep native play controls (no double-tap there).
- **Comment sheet:** tapping the bubble opens comments as a ~60%-height sheet — the post stays visible above; drag the grabber down to see more of the post or dismiss; drag up for near-full height. Scroll inside for long threads.
- **Keyboard:** tapping the input raises the keyboard WITHOUT covering the input or send control.
- **Composer:** left = your mini avatar; empty input shows gallery + camera icons inside the bar; typing (or attaching) swaps them for the orange send arrow. Gallery asks photo permission → pick → preview thumb with ✕ → send. Camera asks permission → shoot → iOS retake/use-photo → send. Image-only comments (no text) allowed.
- **Replies + comment likes:** "Reply" under any comment → "Replying to …" bar (✕ cancels) → reply lands indented under the thread (one level, IG-style). Small heart on each comment toggles with count.

### M6 test guide (3 accounts: A + B friends, C friends B only)
- **Friends feed:** A sees A's own + B's posts with real media (photos render, videos play). C's posts do NOT appear for A.
- **FoF feed:** C's posts appear in A's Friends-of-friends feed (C is B's friend). Nothing of A's own shows there.
- **Explore:** shows everyone's posts from the CURRENT beta day only, most-liked first, newest first on ties. (Beta start is 2026-07-06, so "today" moves — day 2 on 07-07.)
- **Like:** heart toggles instantly and survives refresh; `feed_posts.like_count` updates in the table; unlike decrements.
- **Comments:** tap the bubble → comments screen; add one; the card's count bumps; the other account sees it.
- **Day-5 carousel/gallery:** a multi-photo post auto-advances (stops once you touch it or with reduced motion on), swipes, dots track the page; tap a photo → fullscreen gallery with swipe + "n / N" counter + ✕.
- **Day-3 vote chip:** on beta day 3, friends' day-3 posts show a blue VOTE chip → opens the Community Vote screen. Own post shows no chip.
- **Report:** overflow (⋯) → Report post → pick a reason → row lands in `reports` (status `open`).
- **Block:** overflow → Block user → their posts vanish from all three feeds, suggestions, and vote surfaces — both directions (check from the other account too).
- **Suggestions:** "Suggestions to add" strip woven into Friends/FoF feeds (after the 2nd post, or in the empty state); ADD sends a request and flips to REQUESTED.

</details>

<details><summary>M5 — H2H & community vote (complete) — branch merged to main</summary>

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
3. ✅ **day-close scheduled** (verified in cron.job 2026-07-07 — `seek-day-close`, daily 04:05 UTC). Original SQL kept below for reference. Replace `PASTE_KEY_HERE` with the `service_role` key (Project Settings → API keys; the long `eyJ…` one). The key is stored encrypted in the DB vault, never in the repo:
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
- M5: **complete** — all founder actions done (migration, functions, cron)
- M6: **complete — awaiting founder review** (incl. M6.1 feedback pass)
- M7: **complete — awaiting founder review** (apply migrations + deploy/redeploy functions, see actions above)
- M8–M14: not started (do not work ahead — founder reviews after each milestone)

## Visible stubs (reported per spec §2.1)
- Badges tab is still a visual placeholder (no badge award logic yet — catalog is spec §6; no milestone owns it explicitly, flagged).
- Weekly leaderboard payout + gold crate are M9 (points ledger already accumulates).
- Post-submit "+50 coins" screen shows the config amount rather than reading the ledger row it just triggered (amounts always match; purely cosmetic shortcut).
- Comments/users are reportable at the DB level (reports table takes post/comment/user targets); the client UI reports **posts** — comment-report UI + the admin removal path are M10.
- Blocked-users list w/ unblock in Settings is M10 (blocks themselves fully enforced since M3; block UI on posts shipped in M6).
- vote-feed still reads day-3 submissions directly (it predates feed_posts and its vote semantics are per-submission) — harmless duplication, unify if it ever drifts.
- Post-submit stages are static screens; expressive animation (climb, crate pop, confetti) is M13.
- Push notifications (incl. "voting closes in 2h") are M11 — in-app Notifications screen carries results today.
- Profile header shows a single mutual **Friends** count (mutual friendship model; flagged for founder).
- Declined requests show as "REQUESTED" to the requester (silent decline — no re-request in v1).
- Invite coin reward (+50) not paid yet (M7); invite row recorded now. Share URL is a founder-set placeholder until TestFlight (M14).
- joined_beta_day + vote window compute from app_settings.beta — keep in sync with src/config beta.startDate. Mascot targets likewise (app_settings.mascot ↔ src/config mascot.targets).

## Notes / decisions this milestone (M6)
- **Post visibility is global-except-blocks at the row level** (RLS): Explore is global per spec §5, so friends/FoF scoping is feed *shape* (which posts the Edge Fn returns per tab), not row secrecy. Removed posts and blocked pairs are invisible everywhere.
- **Explore = current-beta-day posts only**, like_count desc → created_at desc (reading of spec §5 "sorted: like-count within current beta day, recency tiebreak").
- like_count / comment_count are **denormalized via SECURITY DEFINER counter triggers** (comment_count counts non-removed only) so the Explore sort is one index scan; clients never write feed_posts.
- feed_posts.created_at = submitted_at (trigger), so recency ties follow submit time.
- Likes: unique(post_id,user_id); the client toggle is optimistic across all three feed caches with rollback; a double-tap 23505 counts as success.
- Day-3 posts carry a **VOTE chip** (→ /vote) while the EST window is open — the persistent countdown itself stays pinned on Challenge per spec §5.
- Day-5 carousel auto-advance (3s) stops on first touch and under reduced motion; tap opens the fullscreen gallery.
- New `colors.scrim` token for gallery chrome (no inline rgba on screens).
- **M6.1 (founder-directed):** comment replies are **one level deep** (IG model — replying to a reply lands in the same thread, no @mention); **double-tap only ever likes**, never unlikes; videos keep native controls so no double-tap on video posts; comment sheet = native formSheet, detents [0.6, 0.95], feed undimmed at the low detent; comment images live in a private `comment-media` bucket (owner-folder RLS) and are signed by the new `comments` Edge Function; image-only comments allowed (body may be empty when media present).

## Earlier notes / decisions (M5) (✅ founder-approved 2026-07-07)
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
