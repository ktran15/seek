# Seek — Build Progress

> Session-continuity tracker (see CLAUDE.md). A fresh session resumes from here:
> re-read CLAUDE.md + the current milestone in `SEEK_MVP_BUILD_SPEC_V2.md` §15,
> run `git log` / `git status`, then continue from the "Next step" pointer below.

## Current milestone: **M13 — Polish & animation** (spec §15, aesthetic §8) — branch `m12-real-assets` (continues; founder approved starting while the artist works)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | Badge system (spec §6 catalog — previously an unowned stub): pure `deriveBadges` (Summit Reached = final day submitted; First Win = any resolved H2H win incl. mascot; Vote Winner = a CV 1st; Perfect Week = all 7 days), derived live from RLS-readable data (no new tables/awards, nothing to backfill), 8 tests (167 total); Profile Badges tab now renders the real badge art w/ locked (dimmed + hint) / earned states and an earned count | ✅ done |
| 1b | **Comment-sheet keyboard jank (founder-reported):** the dock rode the keyboard via JS listener → setState → LayoutAnimation, which chained a second onLayout setState and a full thread-list relayout mid-slide — all racing UIKit's native sheet-with-keyboard animation. Now: dock padding is a Reanimated `useAnimatedKeyboard` worklet (per-frame, UI thread, follows the native keyboard curve exactly — the same animator as the button-open, and natively reduced under Reduce Motion); the list's clearance padding updates ONLY after the keyboard settles (`keyboardDidChangeFrame`), and the dock height is measured on an inner wrapper so the animated padding can't retrigger layout. NOTE: Reanimated 4 deprecates `useAnimatedKeyboard` in favor of react-native-keyboard-controller — that lib isn't in Expo Go, so migration waits for the dev-build era. **Founder verifies feel on device** (typecheck/tests green; keyboard timing can't be exercised from this machine) | ✅ implemented — founder device-check |
| 1c | **Comment camera dead-end (founder-reported):** root cause — the composer dock's `FullWindowOverlay` renders at the WINDOW level, above every presented view controller including the system camera, so it painted over and stole touches from the camera's own bottom controls (Cancel / Retake / Use Photo). The buttons were always there — covered. Fix: the overlay unmounts for exactly the native picker's lifetime (camera AND gallery — same mechanism). Everything downstream already existed: system camera provides retake/use/cancel, attached thumbnail w/ ✕ in the composer, upload → private `comment-media` bucket (owner RLS) → signed URLs via the comments fn. **Founder verifies the full path on device** (take → retake → use → send → renders in thread; cancel at each stage) | ✅ implemented — founder device-check |
| 2 | Mountain climb animation: avatar advances up the trail on submit + flag-plant moment (Reanimated), reduced-motion fallback | ⬜ next |
| 3 | Crate-open reveal: anticipation → pop → rarity flourish; win confetti moments | ⬜ |
| 4 | Post-submit sequence: animate the stages (success → coins → crate → climb → feed confirm) | ⬜ |
| 5 | Transition/press-feel audit + empty/error-state sweep + wire the `loadingScreen` art (auth/boot backdrop) + final QA | ⬜ |

**Next step:** sub-step 2 (climb animation). Founder is posting `SEEK_ARTIST_BRIEF.md`; artist deliveries drop into registry slots whenever they land.

### Founder fixes (2026-07-09) — done
- **Challenge screen simplification** (founder-directed): H2HStatusCard removed entirely (component + `useMyMatch` hook deleted — win/loss results still surface via `h2h_result` push + the Notifications screen; the transient "rival search" pending state now has NO surface anywhere, founder informed); Leaderboard "Weekly payout" footer removed (ladder + qualification copy — users learn payouts when coins land); Leaderboard header collapsed to one bold "This week's top hikers". Verified on simulator.
- **UX-copy round 2** (founder-directed): Shop note → "Spend your coins on crates"; Leaderboard note → "This week's top hikers". Verified on simulator.
- **UX-copy trim pass** (founder-approved list): removed obvious-feature explanations, kept all Seek-mechanic copy. Leaderboard note trimmed to the points-vs-coins rule; FoF empty-state body dropped (title stands); Explore empty-state shortened; post-submit "posted to feed" body dropped incl. stale "(Feed goes live in M6.)"; stale H2H "(economy pass M7)" reward note removed (M7 shipped — the line was wrong); blocked-users empty state → "Block from any post's ⋯ menu."; inventory cosmetics note tightened. Verified on simulator (leaderboard, FoF, blocked-users, H2H card, feeds). **Open founder decision: Share Profile button is a dead stub ("Profile deep links land in M3" alert) — hide or wire.**
- **Notification badge** (merged to main `bbad45e`): unread-count pill (vermillon, 9+ cap) on the TopBar bell — unread `notifications` rows + incoming pending friend requests; clears via the existing mark-read / accept-decline flows. No schema change (`notifications.read` existed since M5).
- **Double-tap like** (root cause found + fixed, sim-verified): (1) video posts had NO double-tap gesture — `VideoProof` returned bare native controls, and AVPlayer's own tap recognizers swallow taps anyway, so Day-1 (timer_video) posts could never like; cure = `nativeControls={false}`, single tap = play/pause (scrim ▶ badge when paused), double tap = like, composed `Gesture.Exclusive(double, single)`. (2) Day-5 carousel shared ONE `doubleTap` instance across per-page detectors (RNGH forbids; undefined behavior) — now a `makeDoubleTap()` factory per detector. (3) double-tap now **toggles** (was like-only, founder-directed). Verified on iOS simulator against live feed: video like/unlike + burst, photo like/unlike, play/pause, heart button, scroll — all ✓. **Founder still to confirm feel on physical iPhone.**

### Pre-M13 brand punch list (founder-directed, 2026-07-09) — done
Auth screen: "Seek" text removed, wordmark ~20% bigger. TopBar: brand text → tight wordmark image (derived by `scripts/make-icons.js` from the logo master, registry `appLogoWordmark`). App icon + Expo splash + Android adaptive icons: wordmark on the cream box (`ios.icon` → plain png; the Icon Composer template bundle retired). Founder loves the generated logo.

## M12 — Real assets pass (spec §14, §15; Rig Bible governs all character art) — branch `m12-real-assets`

| # | Sub-step | Status |
|---|----------|--------|
| 1 | Style anchors generated + founder-selected (hiker, beaver, wooden crate, mountain) via Gemini | ✅ done (founder, 2026-07-08) |
| 2 | Art intake tooling: `scripts/process-art.js` (white-bg strip via edge flood fill + halo cleanup, trim, pad, 1024² master) + `scripts/recolor-crates.js` (hue/sat replace, lightness preserved) | ✅ done |
| 3 | Crate family live: wooden master stripped + blue/red/yellow/gold recolors, all 5 registry slots → `assets/art/` | ✅ done |
| 4 | Mountain background live: downscaled to 1290×2311, slot → `assets/art/` | ✅ done |
| 5 | Canonical hiker + beaver frozen: founder re-exports intaken (2026-07-09) → `assets/art/hiker-base.png` + `assets/art/mascot-avatar.png` (1024² masters, registry slots flipped — real hiker on Mountain/post-submit, real beaver on mascot surfaces); source exports archived in `assets/art/canonical/` (the reference images all future generations condition on). Intake tooling grew: de-card crop (Gemini bakes a rounded-rect card frame that walls off the flood fill), soft-ground sweep (light neutral wash reachable from bg — bold outlines seal real art), despeckle (tiny disconnected blobs), `--erase x,y,w,h` for outlined debris fused to art. Beaver's pebble patch removed via `--erase 295,1150,82,108 --erase 377,1238,103,20` (recorded for reproducibility) | ✅ done |
| 6 | Anchor zones traced from frozen base → `assets/art/anchor-zones.json` (LOCKED-ON-BASE: reference lines crown/eye/chin/shoulder/waist/ankle/feet + containment zones per slot, verified by rendered overlay) + typed wrapper `src/features/avatar/anchorZones.ts` | ✅ done |
| 7 | Registry expansion + image compositor: 32 `cos*` slots (placeholder = translucent rarity-colored box at the slot's anchor zone on the 1024² canvas — equips composite with real registration before art exists), `bodySkin1–5`, `getAssetOrNull` for DB-driven slot names; AvatarPreview v3 = plain stack of full-canvas registered images, framing via pure `frame.ts` (5 tests; 159 total) | ✅ done |
| 8 | `scripts/recolor-avatar.js` (skin: HSL-band select + outline-sealed flood mask excludes the same-hue rust shirt, multiplicative lightness keeps cel shading — 5 real body masters live in registry; hair mode ready for isolated style layers) + dev Art QA screen (`/dev/art-qa`, Settings row in dev builds: variant/cosmetic cycling, anchor-zone overlay, dark-bg silhouette check) | ✅ done |
| 8b | **FIX (founder-reported 2026-07-09):** under-chin/neck shadow discolored on dark skins — the shadow's core (h16 s.5 l.45) sits under the band's l≥.5 floor, so it kept the master's pale tone (read as a greenish patch on skin3–5). Cure: outline-sealed skin flood mask (seed = strict band, grow extends the lightness floor to .26, shirt mask as hard walls), gated to 215<y≤810 — at head height it leaked into hair, at ankle height it swallowed the socks (both caught on mask overlays); outside the gate behavior is identical to the approved originals. All 5 masters regenerated + visually verified (neck ✓ socks ✓ hair/brows ✓ skin2 round-trip ✓) | ✅ done |
| 9b | Non-character art generated + live (founder-directed: strong placeholders / possible finals; artist may replace in review): 4 badges, both flags, trail, summit emblem, "SEEK" logo, loading-screen scene — 10 slots flipped to `assets/art/` (11 calls incl. one transient-500 retry; 33/250 used, ≈ $1.50 total spend) | ✅ done |
| 9 | ~~Batch generation: eyes/hair/cosmetics via Gemini~~ **PIVOTED (founder decision 2026-07-09): full artist makeover for the character.** AI masking/rigging judged too fragile for the layered avatar after shakedown review. `SEEK_ARTIST_BRIEF.md` written — complete commission package (66-file kit: body×5 skins+bald, eyes×3, hair 5×5, all 32 seeded cosmetics; optional 4-state mascot; canvas/z-order/anchor rules, per-batch acceptance checklist). Founder posts it and picks the artist; deliverables drop into the EXISTING registry slots + compositor with zero code (intake = file rename + registry path flip + QA screen). Non-character art (badges, flags/trail/summit, logo/loading) PARKED — founder deciding whether AI art stays at all | 🔶 **founder engages artist; assets plug in on delivery** |
| 10 | Throttled Gemini pipeline + SHAKEDOWN (founder gate): `scripts/art-manifest.js` (reference-conditioned per Rig Bible §6, one item/call, worn-on-base recipe so registration is inherited) + `scripts/generate-art.js` (HARD caps: **15 calls/burst + 60s wait** (founder raised from 10 after enabling billing), 250/day persisted in gitignored `.gen-quota.json`, resume skips finished outputs, one retry on 429/5xx, raw results → gitignored `assets/art/inbox/`) + `scripts/extract-layer.js` (worn→layer isolation: arm-span/feet alignment to the canonical grid, anchor-zone diff vs the base, despeckle, enclosed-pinhole fill; emits a composite QA preview per item). First run on the free tier failed hard (`free_tier_requests, limit: 0` — free tier has NO image-model allowance); founder enabled billing (~$10) 2026-07-09 and the shakedown ran clean: **bald base + mascot cheer/defeat + all 4 hats live** (22 calls total incl. the free-tier failures and one defeat re-roll — first defeat came back near-neutral; explicit limb-by-limb pose prompt fixed it, prompt recorded in the manifest). mascotCheer/mascotDefeat/cosHats* registry slots flipped to `assets/art/`; body-bald master intaken for the hair batch | 🔶 **STOP — founder reviews shakedown before the full batch** |

**Next step:** sub-step 9 — founder generates the batch with Gemini against the canonical references (`assets/art/canonical/`), agent intakes each set (strip → zone QA → registry flip). Suggested batch order: mascot cheer/defeat → eyes/hair → cosmetics per slot → badges/flags/logo.

### M12 decisions (flag for founder)
- **Crate tier hues** (recolor script): blue = bice blue `#2774B4`, red = vermillon `#D45735`, yellow = indian yellow `#ECA945`, gold = brighter metallic gold (46°, S .85, slight lightness lift). Yellow vs. gold are close-ish — founder judges on device; tweaking = edit `TIERS` in `scripts/recolor-crates.js` + re-run.
- Mountain master downscaled 1536×2752 → 1290×2311 (~3× iPhone width) for bundle size; original stays in founder's Downloads.
- Real art lives in `assets/art/` (placeholders untouched in `assets/placeholders/` — registry path is the single switch per slot).
- Pre-existing tsc errors (2) from the pre-M12 `/friends` + `/user/[id]` routes: stale generated `.expo/types/router.d.ts` — clears on next `npx expo start`; not M12 code.
- **Base gear is baked into the frozen body master** (tee/shorts/boots drawn on): base shirt/pants fallback layers render as no layer at all; cosmetic garments are generated worn on the reference so they cover the baked ones. There is **no visible base backpack** (the master has none) — spec §10 lists backpack as base gear; either accept "no pack until one is equipped" or bake one into a batch-pass edit (founder call).
- **Skin picks are live** (5 recolored masters). **Eyes/hair/hair-color picks don't change the render yet** — the frozen master's baked features show until sub-step 9's variant layers land. Note for that batch: hairstyles SMALLER than the baked crew cut (e.g. Buzz) need a **bald/de-haired body edit** as the layering base, else the baked hair pokes out — generate it as part of the batch (one Gemini edit on the canonical).
- The beaver mascot canonical carried a baked pebble/dirt patch fused to a boot; removed reproducibly via the intake tool's new `--erase` rects (exact command recorded in sub-step 5 row).
- **Shakedown observations for founder review (2026-07-09):**
  - Hats extract cleanly; the **rare beanie shows small baked-hair tufts** past its silhouette (the crew cut is baked into the body masters — Rig Bible z-order accepts hair-behind-hat; fully resolved once the hair batch makes hair its own layer over the bald base, or by regenerating the beanie with wider coverage). Judge on device.
  - Mascot cheer/defeat: identity holds (hat/bandana/pack/teeth). Intake normalizes by content bbox, so the **raised-arms cheer renders the body ~10% smaller** than neutral at the same display size — acceptable or we re-intake anchored on feet (founder call).
  - Cost so far: 22 billed calls ≈ $1; the remaining full batch (~70 items + re-rolls) fits comfortably in the $10 budget and under the 250/day cap.

## Pre-M12 UI additions (founder-directed, 2026-07-08) — on `m11-push-notifications`
1. **Friends list screen** — Profile's Friends count now opens `/friends`: the user's **accepted MUTUAL friends** (spec §6/§7.10 — the schema has no follower/following asymmetry; one accepted edge = friends both ways). Built on the same `friendIdsOf` as the header count so list and count can't disagree. Rows (letter avatar, display name, @username) tap through to a **new minimal `/user/[id]` profile** (full-look avatar + names — no other-user profile surface existed anywhere; stats/inventory stay owner-private by RLS, expanding it is a founder call). Empty state: "No friends yet — invite someone!" → the existing invite share sheet. Loading/error+retry states match Blocked Users.
2. **Challenge swipe-back (partial — decision pending)** — the standard iOS edge swipe now exits the challenge flow back to the Mountain during `reveal` and `difficulty` (before the attempt is armed, spec §7.4 — BEGIN creates the in_progress row and enters capture in one step). The locked/missed/done-for-today notices are swipeable too. From `capture` onward the gesture stays OFF — **open founder decision (a) vs (b)**: (a) allow swipe mid-capture as an abandon (attempt not burned, per crash handling) or (b) keep it disabled while actively recording so a good take can't be lost to an accidental edge swipe (agent recommendation: b). Current behavior = (b) provisionally.

## M11 — Push notifications (spec §13, §15) — **complete, founder-approved 2026-07-08** — branch `m11-push-notifications` (merged to main)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | `push_tokens` migration (device-keyed rows, account-reassigning `register_push_token` RPC, RLS, deletion cascade pinned in `CASCADE_PLAN`) + shared push module: §13 copy/tap-route builder + Expo Push sender (100-chunk, never-throws) — client and server import the SAME builder so wording/routes can't drift (14 tests) | ✅ done — **founder must apply migration** |
| 2 | Server push wiring: `notifyAndPush` (in-app row + best-effort device push) replaces every notifications insert in h2h-pair / day-close / weekly-payout; NEW `vote-countdown` Edge Fn — service-gated, `[close−2h, close)` window guard on the CV day, once-only app_settings marker, push-only (4 tests) | ✅ done — **founder must deploy 4 fns + schedule cron** |
| 3 | Client push plumbing: device-token registration (silent no-op in Expo Go / missing projectId / permission denied), registers at sign-in AND right after the onboarding grant, deregisters on sign-out, whitelisted notification-tap routing incl. cold start | ✅ done |
| 4 | Local scheduled notifications: stateless absolute-date planner — daily-live at local midnight, evening reminder (`TUNE` 19:00, dropped when that day completes), one-shot invite nudge (`TUNE` day 2 noon, <3 friends); re-syncs on data change + app foreground; cleared on sign-out/account deletion (13 tests; 154 total) | ✅ done |
| 5 | `extra.eas.projectId` config slot + PROGRESS/test guide | ✅ done |

**Next step:** M11 complete — founder review (actions below), then M12 after approval.

### ⚠️ Founder actions for M11
1. ⬜ **Apply the migration:** `npx supabase db push`
2. ⬜ **Deploy the new function + redeploy the three that now push:**
   ```
   npx supabase functions deploy vote-countdown --no-verify-jwt --project-ref aducawlftwdowvsnryar
   npx supabase functions deploy h2h-pair --project-ref aducawlftwdowvsnryar
   npx supabase functions deploy day-close --no-verify-jwt --project-ref aducawlftwdowvsnryar
   npx supabase functions deploy weekly-payout --no-verify-jwt --project-ref aducawlftwdowvsnryar
   ```
3. ⬜ **Schedule the countdown cron** (SQL Editor). 02:00 UTC = 2h before the 04:00 UTC day-close during EDT; on every day except day 3's window the function no-ops:
   ```sql
   select cron.schedule(
     'seek-vote-countdown',
     '0 2 * * *',
     $$
     select net.http_post(
       url := 'https://aducawlftwdowvsnryar.supabase.co/functions/v1/vote-countdown',
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
4. ⬜ **Remote-push prerequisites** (one-time; required to RECEIVE server pushes — Expo Go can't, remote push was removed from it in SDK 53):
   1. `npx eas-cli login`, then `npx eas-cli init` — links the repo to an EAS project and prints the project id.
   2. Paste that id into `app.config.ts` → `extra.eas.projectId` (an identifier, not a secret) and commit.
   3. Build + install a **development build**: `npx eas-cli build --profile development --platform ios` (EAS sets up APNs push credentials during the first build — sign in with the Apple Developer account when prompted). Install it on the phone, run `npx expo start`, open via the dev build.

   Until step 4 is done: the local notifications (daily live / evening reminder / invite nudge) already work in Expo Go on iOS; remote pushes are a silent no-op — nothing breaks.

### M11 test guide
**Local notifications (Expo Go is fine; permission granted in onboarding):**
- **Daily live:** leave the app closed past local midnight → "Today's challenge is live — one shot." fires at 00:00; tap → Challenge screen.
- **Evening reminder:** leave today incomplete → reminder at 19:00 local; complete the challenge earlier → that day's reminder never fires.
- **Invite nudge:** account with <3 friends → ONE nudge at noon on beta day 2; with 3+ friends (or once the moment has passed) → none, ever.
- **Sign out** → every scheduled local notification is cleared (nothing fires for a signed-out device).

**Remote pushes (dev build required; two devices A + B, friends):**
- **H2H result:** both submit on an H2H day → both devices get the ⚔️ result push at resolution; tap → Notifications. Friendless C resolves vs. the mascot at day-close → mascot-flavored copy.
- **Vote countdown:** day 3, 2h before close, the cron fires → "⏳ Voting closes in 2 hours" on every registered device; tap → /vote. Manual test any time — same `net.http_post` pattern with url `…/functions/v1/vote-countdown` and body `'{"force": true}'::jsonb`; to re-send first `delete from app_settings where key = 'vote_countdown_sent_day_3';`
- **Vote result:** run day-close for day 3 → 🥇/🥈/🥉/votes-in push per poster.
- **Weekly result:** run weekly-payout → 👑 (1st) / 🏅 (ranked) / 🏔️ (solo) push per paid user.
- **Deregistration:** sign out on B → trigger any of the above → B's device stays silent (its push_tokens row was deleted).

### M11 decisions (flag for founder)
- **Daily-live fires at the exact LOCAL midnight boundary** (spec §13 "local-day boundary") — the same instant the challenge unlocks on that device's calendar.
- **vote-countdown is push-only**: the in-app countdown is the persistent Challenge banner (spec §7.7), so no notifications row is written — an hours-stale "closes in 2h" line in the Results list would be noise. Once-only via an `app_settings` marker; recipients = every registered device (voting is open to all users).
- **Evening reminders for future days are scheduled ahead** (a local notification can't check completion at fire time); completing a day re-syncs the plan and drops that day's reminder. If the user never opens the app that day, it correctly fires — the challenge IS incomplete.
- **Invite nudge is one-shot structurally**: every local notification has an absolute calendar fire-date; a date in the past is never re-planned, so nothing can fire twice — no stored "fired" flag to lose on reinstall. Threshold is checked at schedule time and at every re-sync until it fires (fire-time evaluation isn't possible on iOS).
- **friend_accepted stays in-app only** — it isn't a §13 trigger.
- **Foreground arrivals show a quiet banner** (no sound/badge) — the Notifications screen stays the primary surface.
- **A push can never fail an award**: the Expo send is best-effort, chunked, and never throws into a resolution path (unit-pinned).

## M10 — Trust & compliance (spec §12, §15) — **complete, founder-approved 2026-07-08** — branch `m10-trust-and-compliance` (PR #3 merged to main)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | Admin removal path: `open_reports` triage view + service-gated `admin-moderate` Edge Fn (remove/restore/dismiss; removal actions every open report on the target); removed-propagation hardening — `cast_vote` rejects removed posts, vote-feed + day-close CV tally exclude them (8 tests; 102 total) | ✅ done — **founder must apply migration + deploy fn** |
| 2 | Comment-report UI: Report action on others' comment rows (shared reason list with post reports) + "keep proof real, keep it kind" house-rules line on the onboarding Begin step | ✅ done |
| 3 | Blocked-users Settings screen: block list w/ names, confirm-unblock (invalidates feeds/friends/suggestions), empty + error/retry states | ✅ done |
| 4 | Account-deletion cascade: JWT-verified `delete-account` Edge Fn (recursive storage purge → auth-user delete → FK cascade; uid only from the verified token) + Settings double-destructive-confirm flow + `CASCADE_PLAN` tripwire tests pinning every user-data table's disposition (10 tests; 112 total) | ✅ done — **founder must deploy fn** |
| 5 | Privacy policy + terms generated (`docs/legal/*.html`, GitHub Pages), config URL slots (`config.legal`), Settings rows open them in the in-app browser | ✅ done — **founder must enable Pages + review docs** |

**Review outcome (2026-07-08):** infrastructure verified in session (migration live, all four functions deployed + service-auth 200, GitHub Pages enabled + repo public); founder confirmed everything clean and approved starting M11. Milestone closed.

### Founder actions for M10 (all done, 2026-07-07/08 — collaborator + founder)
1. ✅ **Apply the migration:** `npx supabase db push`
2. ✅ **Deploy the two new functions:**
   ```
   npx supabase functions deploy admin-moderate --no-verify-jwt --project-ref aducawlftwdowvsnryar
   npx supabase functions deploy delete-account --project-ref aducawlftwdowvsnryar
   ```
3. ✅ **Redeploy the two touched functions** (they gained the removed-content filters):
   ```
   npx supabase functions deploy vote-feed --project-ref aducawlftwdowvsnryar
   npx supabase functions deploy day-close --no-verify-jwt --project-ref aducawlftwdowvsnryar
   ```
   (This also finally ships the M7 award wiring in day-close if you never ran that deploy.)
4. ✅ **Enable GitHub Pages** (done 2026-07-08; repo made public): branch `main`, folder `/docs` → the app links to `https://ktran15.github.io/seek/legal/privacy.html` + `terms.html` (config slots in `src/config` → `legal`).
5. ✅ **Review the legal documents** — founder confirmed 2026-07-08. Contact email defaults to the founder gmail; the same URLs go into App Store Connect.

### How to moderate (founder cheat-sheet)
- **See open reports** — SQL Editor: `select * from public.open_reports;`
- **Remove reported content** (actions every open report on it):
  ```sql
  select net.http_post(
    url := 'https://aducawlftwdowvsnryar.supabase.co/functions/v1/admin-moderate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{"action": "remove", "report_id": "PASTE-REPORT-ID"}'::jsonb,
    timeout_milliseconds := 30000
  );
  ```
- Variants for `body`: `{"action":"remove","post_id":"…"}` / `{"action":"remove","comment_id":"…"}` (direct, no report needed), `{"action":"restore", …same targets…}` (undo a removal), `{"action":"dismiss","report_id":"…"}` (close a report, content stays), `{"action":"list"}` (same as the view).

### M10 test guide
- **Report a comment:** account B comments on A's post → A opens the sheet → "Report" sits next to "Reply" under B's comment (A's own comments show no Report) → pick a reason → row lands in `reports` (status `open`), visible in `open_reports`.
- **Admin removal:** run the remove SQL above with that report's id → the comment vanishes from the sheet (≤15s poll or reopen) and the card's count drops; the report flips to `actioned`. Remove a **post** → gone from all three feeds, its comment sheet 404s. `restore` brings either back.
- **Removed day-3 post can't win:** remove a day-3 post mid-window → it leaves the vote feed, `cast_vote` for it errors ("Submission not found"), and the day-close tally ignores it (its poster gets no placement/result).
- **Blocked users:** block someone from a post's ⋯ → Settings → Blocked users lists them → UNBLOCK (confirm) → their posts/suggestions return on next refresh. Empty state when nobody's blocked.
- **Account deletion (use a throwaway account with posts, comments, likes, friends, crates):** Settings → Delete account → two destructive confirms → app lands on Auth. From a friend's account: their posts/comments/likes are gone everywhere; your resolved H2H against them still shows in your W-L (opponent anonymized). DB spot-checks: no rows carrying the old uid in any user table; `proofs/<uid>/…` and `comment-media/<uid>/…` empty; the auth.users row gone. Deleting mid-flight failure leaves the account intact and retryable.
- **House rules:** fresh signup → Begin step shows "keep proof real, keep it kind."
- **Legal:** Settings → Privacy Policy / Terms open the hosted pages in the in-app browser (after step 4; before that they 404 — expected).

### M10 decisions (2 pre-approved in plan review; rest flagged for founder)
- ✅ **Legal docs host = GitHub Pages** on this repo (founder-approved 2026-07-07).
- ✅ **Deleted user in others' H2H matches → anonymized, not deleted** (founder-approved 2026-07-07): survivors keep their match/W-L record; the schema's `on delete set null` on `opponent_id`/`winner_user_id` already encodes this, and `CASCADE_PLAN` tests pin it.
- Removal is founder-tooling only (spec §12 "minimal admin path"): SQL Editor `net.http_post` → `admin-moderate`, same invocation pattern as day-close/weekly-payout. No in-app admin UI.
- A restore (un-remove) never rewrites report history; a removal closes every open report on that content as `actioned`. User-target reports have no removable content — dismiss them or act on the user's posts/comments directly.
- **Comment "Report" is an inline action next to "Reply"** (not a hidden long-press/overflow) — discoverable + accessible; hidden on your own comments.
- **Delete-account is storage-first, then auth**: any failure leaves the account intact and the call retryable; the deleted uid comes only from the verified JWT (no "delete user X" parameter exists).
- Deletion removes the user's votes/likes retroactively; already-paid rewards other users earned are ledger history and stay (append-only ledgers, spec §6).
- Legal contact email defaults to the founder's gmail — swap in `src/config` (`legal.contactEmail`) + the two HTML docs if you want a dedicated address.

## M9 — Leaderboard & weekly payout (spec §9.1, §9.2, §15) — **complete, founder-approved 2026-07-07** — branch `m9-leaderboard-and-payout` (PR #2 merged to main)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | Pure logic, unit-tested: egocentric weekly rank (competition ranking, ties share), payout tier mapping (1st 300+gold / 2-3 150 / 4-10 75; solo 75), qualification (≥3 friends), zero-points-never-pays (9 tests; 94 total) | ✅ done |
| 2 | DB migration: `get_weekly_leaderboard()` RPC (security definer — friends' weekly points are unreadable client-side by RLS design) + weekly amounts into app_settings economy | ✅ authored — **founder must apply** |
| 3 | `weekly-payout` Edge Function: service-role gated (like day-close), idempotent per user, pays qualified tiers + gold crate (1st) or solo flat, writes weekly_result notifications | ✅ authored — **founder must deploy** |
| 4 | Client: real egocentric Leaderboard view (rank, names, points, you-highlight), payout ladder footer + qualification state, weekly_result in Notifications | ✅ done |

**Review outcome (2026-07-07):** full M9 review passed on device; both flagged decisions approved (see below). Milestone closed.

### Founder actions for M9 (done during review, 2026-07-07)
1. ✅ **Apply the migration:** `npx supabase db push`
2. ✅ **Deploy weekly-payout** (service-gated like day-close):
   `npx supabase functions deploy weekly-payout --no-verify-jwt --project-ref aducawlftwdowvsnryar`
3. ✅ (tested; re-run is idempotent) **Run the payout after day 7 closes** (or any time when testing — it's idempotent per user, re-runs skip already-paid users). SQL Editor:
   ```sql
   select net.http_post(
     url := 'https://aducawlftwdowvsnryar.supabase.co/functions/v1/weekly-payout',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
     ),
     body := '{}'::jsonb,
     timeout_milliseconds := 60000
   );
   ```

### M9 test guide (A with 3+ friends = qualified; C friendless = solo)
- **Leaderboard:** Challenge → swipe to Leaderboard → you + friends with weekly points, competition ranks (ties share, zero points shows "–"), your row highlighted; payout ladder in the footer shows your qualification state ("add N more friends…" for unqualified).
- **Board matches payout:** the rank shown is computed by the same shared function the payout uses.
- **Simulated week-end:** run the SQL above → A (qualified, rank 1) gets +300 coins, a GOLD crate in Inventory, and a "👑" notification; ranks 2-3 get +150, 4-10 get +75 (no gold); C (unqualified, ≥1 completion) gets flat +75 solo with its own copy; a friendless account with zero submissions gets nothing.
- **Idempotence:** run the SQL again → `{"paid": 0, "skipped": N}` — nobody double-paid.

### M9 decisions (✅ founder-approved 2026-07-07)
- **D1 — approved: zero weekly points never ranks/pays** (mirrors M5's "zero votes never places") — an inactive friend circle can't all "win 1st".
- **D2 — approved: tied firsts each take the full 1st purse (300) + gold crate** (competition ranking, same tie-sharing as the community-vote tally).
- Payout runs **once per user ever** (single beta week) — dedupe is "any weekly ledger row exists".
- The client board imports the same `weeklyRank` function the Edge Function uses (shared module, unit-tested) — displayed ranks can't drift from paid ranks.

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

## M8 — Avatar & cosmetics (spec §10, §15) — **complete** — branch `m8-avatar-and-cosmetics`

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
- M8: **complete**
- M9: **complete — founder-approved 2026-07-07** (review passed on device; decisions D1 + D2 approved)
- M10: **complete — founder-approved 2026-07-08** (all founder actions done; infra verified in session)
- M11: **complete — founder-approved 2026-07-08** (confirm the 4 ops actions — migration, 4 fn deploys, countdown cron, EAS dev build — are done; checkboxes above)
- M12: **in progress** — branch `m12-real-assets` (sub-steps 1–8 done: crates, mountain, canonical hiker + beaver frozen + live, anchor zones locked, image compositor + 5 skin masters, Art QA screen; remaining: sub-step 9 batch generation — founder art w/ Gemini, agent intake)
- M13–M14: not started (do not work ahead — founder reviews after each milestone)

## Visible stubs (reported per spec §2.1)
- Badges tab is still a visual placeholder (no badge award logic yet — catalog is spec §6; no milestone owns it explicitly, flagged).
- ~~Weekly leaderboard payout + gold crate are M9~~ — shipped in M9 (2026-07-07).
- Post-submit "+50 coins" screen shows the config amount rather than reading the ledger row it just triggered (amounts always match; purely cosmetic shortcut).
- ~~Comment-report UI + admin removal path are M10~~ — shipped in M10 (posts + comments reportable; `admin-moderate` actions them). Reporting a **user** directly still has no client UI (DB supports it; no spec §5 surface owns it — flagged).
- ~~Blocked-users list w/ unblock in Settings is M10~~ — shipped in M10.
- vote-feed still reads day-3 submissions directly (it predates feed_posts and its vote semantics are per-submission) — harmless duplication, unify if it ever drifts.
- Post-submit stages are static screens; expressive animation (climb, crate pop, confetti) is M13.
- ~~Push notifications (incl. "voting closes in 2h") are M11~~ — shipped in M11 (all §13 triggers). Receiving REMOTE pushes still needs the founder's EAS init + dev build (M11 founder actions); `extra.eas.projectId` in app.config.ts is an empty FOUNDER-SET slot until then.
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
