# Seek — Build Progress

> Session-continuity tracker (see CLAUDE.md). A fresh session resumes from here:
> re-read CLAUDE.md + the current milestone in `SEEK_MVP_BUILD_SPEC_V2.md` §15,
> run `git log` / `git status`, then continue from the "Next step" pointer below.

## Current milestone: **M3 -- Friend graph & social core** (spec sec 15, sec 7.10, sec 11)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | DB migration: friendships + blocks tables (RLS, column grants), security-definer graph functions (friends / FoF / search, block-aware) | ✅ authored -- **founder must apply** (SQL Editor, same as M1) |
| 2 | Pure TS graph helpers + jest setup + unit tests (friend/FoF/block set logic, request-state derivation) | ⬜ not started |
| 3 | Add Friends screen: username search, request states (Add/Requested/Accept/Friends), invite entry point | ⬜ not started |
| 4 | Notifications screen: pending requests w/ accept-decline; Profile friends count + invite button | ⬜ not started |

**Next step:** M3 sub-step 2 -- graph helpers + unit tests.

### ⚠️ Founder action before testing M3
Apply `supabase/migrations/20260706000002_m3_friendships_blocks_graph.sql` via Dashboard -> SQL Editor (copy from the file on disk, not from chat).

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
- M3: **in progress**
- M4–M14: not started (do not work ahead — founder reviews after each milestone)

## Visible stubs (reported per spec §2.1)
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
