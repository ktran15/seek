# Seek — Build Progress

> Session-continuity tracker (see CLAUDE.md). A fresh session resumes from here:
> re-read CLAUDE.md + the current milestone in `SEEK_MVP_BUILD_SPEC_V2.md` §15,
> run `git log` / `git status`, then continue from the "Next step" pointer below.

## Current milestone: **M4 -- Challenge engine** (spec sec 15, sec 7, sec 8)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | DB migration: challenges table + 7 seeded rows, submissions (one-attempt unique, state machine columns), proofs storage bucket + owner policies | ✅ authored -- **founder must apply** |
| 2 | Beta calendar lib (local-midnight day logic, day states) + attempt state-machine reducer -- both unit-tested | ✅ done (34 tests total) |
| 3 | Challenge flow: reveal->explainer->begin, day-4 difficulty select (Hard unlocks H2H), attempt hooks w/ crash-safe reset, one-attempt lock | ✅ done (+ mountain wired to real calendar/submissions) |
| 4 | Capture types: timer-bound recording w/ big clock + auto-stop, photo, video, screenshot+count, multi-photo<=25; local persistence + upload retry | ✅ done |
| 5 | Post-submit sequence (success->coins->crate->climb->feed confirm) + mountain real day states + submit pipeline | ✅ done |

**Next step:** M4 complete -- founder review (apply migration + set start date first), then M5 after approval.

### ⚠️ Founder actions before testing M4
1. Apply `supabase/migrations/20260706000003_m4_challenges_submissions_storage.sql` via Dashboard -> SQL Editor (copy from the file on disk).
2. The beta starts 2026-07-13, so every day is "locked" until then. To play a challenge today, set the start date to today in BOTH places:
   - `src/config/index.ts` -> `beta.startDate: '2026-07-06'`
   - SQL Editor: `update app_settings set value = jsonb_set(value, '{start_date}', '"2026-07-06"') where key = 'beta';`

<details><summary>M3 -- Friend graph & social core (complete)</summary>

friendships+blocks migration (applied), block-aware graph SQL functions,
16 unit tests, Add Friends search+requests, Notifications accept/decline,
Profile friends count + invite entry.

</details>

<details><summary>M2 -- Navigation & skeletons (complete, founder-verified; tabs reordered Challenge/Home/Profile)</summary>

Tab shell + top bar, Home 3-feed swipe, Challenge Mountain<->Leaderboard swipe
w/ data-driven 7-stop mountain, Profile skeleton + swipe->Shop, error
boundaries, stub screens (add-friends / notifications / settings).

</details>

<details><summary>M1 -- Auth & onboarding (complete, founder-verified)</summary>

M1 exit criteria confirmed by founder 2026-07-06. DB migration applied.
Sub-steps: DB schema+RLS / session plumbing / email auth / Apple+Google /
onboarding steps 1-3 + username / avatar creation / invite (soft) + begin.

</details>

<details><summary>M0 — Foundation & scaffolding (complete, awaiting founder review)</summary>

| # | Sub-step | Status |
|---|----------|--------|
| 1 | Repo hygiene: .gitignore (env/secrets covered), PROGRESS.md, commit spec docs | ✅ done |
| 2 | Expo + TypeScript (strict) + Expo Router project init; boots | ✅ done |
| 3 | Supabase wiring: client module, env vars, .env.example (client-safe keys only) | ✅ done |
| 4 | Typed central config module (app name, beta start date, EST tz, TUNE values, flags) | ✅ done |
| 5 | Design tokens (palette roles, 4-font type system incl. Archivo timer style, spacing/radii/motion) + 3D-press button + themed boot screen | ✅ done |
| 6 | Asset registry (`assets/registry.ts`) + labeled placeholders for all slots | ✅ done |
| 7 | EAS → TestFlight pipeline config (eas.json, bundle ID; founder does interactive Apple login) | ✅ done (code side) |

</details>

### Founder actions to finish the EAS pipeline (interactive logins — can't be automated)
1. `! npx eas-cli login` — log in / create an Expo account.
2. `! npx eas-cli init` — links the repo to an EAS project (writes `extra.eas.projectId`; commit that change).
3. When ready for a device build: `! npx eas-cli build --profile development --platform ios` (needs Apple Developer account; EAS walks through signing). TestFlight submission itself is the M14 pass.
4. Optional: upgrade Node to ≥ 20.19.4 (current: 20.15.1) — Expo tooling warns; everything works today but newer CLIs may require it.

## Milestone status
- M0: **complete** (founder still owes the 3 interactive EAS login steps above)
- M1: **complete — founder-verified**
- M2: **complete — founder-verified**
- M3: **complete** (migration applied; founder testing in parallel)
- M4: **complete — awaiting founder review** (apply migration 20260706000003 + set beta start date to test)
- M5–M14: not started (do not work ahead — founder reviews after each milestone)

## Visible stubs (reported per spec §2.1)
- Post-submit sequence shows +50 coins and "wooden crate added" from config, but the actual ledger write + crate row are M7 (server-authoritative) — display only today.
- "Posted to your friends' feed" confirm screen: the feed_posts row + real feed land in M6.
- H2H days (1, 2, 4-Hard, 5) capture + submit fully; pairing/resolution is M5 — no winner yet. Day 3 photo submits; voting window is M5.
- Post-submit stages are static screens; expressive animation (climb, crate pop, confetti) is the M13 pass.
- Profile header shows a single mutual **Friends** count + Invite action (spec §11 says Following/Followers, but the friendship model is mutual — they would always be equal; flagged for founder).
- Block/report UI (post overflow menu) lands in M6 with the feed; blocks table + enforcement plumbing are live now.
- Declined requests show as "REQUESTED" to the requester (silent decline — no re-request in v1).
- Invite coin reward (+50) NOT paid yet — coins ledger is M7; the invite row is recorded now.
- An invites row is created even if the user cancels the share sheet (client cannot delete; harmless, redeemed_by stays null).
- Invite share URL is a FOUNDER-SET placeholder until the TestFlight link exists (M14).
- Notifications step only requests permission; scheduling/push wiring is M11.
- joined_beta_day computes from app_settings.beta — keep in sync with src/config beta.startDate.

## Notes / decisions this milestone
- Git was already initialized (`a815b86 Initial commit`); spec docs committed in sub-step 1.
- App name config string: `"Seek"` (single source of truth in config module).
- Bundle ID: `com.smokeysummit.seek` (founder can change in `app.config.ts` before first EAS build).
- Expo SDK **54** (downgraded from 57 so the founder's Expo Go can run it: RN 0.81.5, React 19.1, expo-router 6, Reanimated 4.1, TS 5.9). Template demo app removed. Unused template packages pruned (@expo/ui, expo-glass-effect, expo-symbols, expo-device, expo-image).
- App name lives ONCE in `app-name.json` (read by both `app.config.ts` and `src/config` — app.config.ts can't import TS modules).
- Supabase project `aducawlftwdowvsnryar` wired with the modern `sb_publishable_` key (client-safe by design; RLS is the boundary). Schema: profiles/app_settings/invites live (M1 migration applied by founder).
- eas.json env block carries only the EXPO_PUBLIC (client-safe) vars; real secrets go in Edge Function env later, never in the repo.
- Zustand installed but unused so far (first real consumer expected M4 capture flows); React Query in use since M1.
