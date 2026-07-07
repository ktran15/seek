# Seek — Build Progress

> Session-continuity tracker (see CLAUDE.md). A fresh session resumes from here:
> re-read CLAUDE.md + the current milestone in `SEEK_MVP_BUILD_SPEC_V2.md` §15,
> run `git log` / `git status`, then continue from the "Next step" pointer below.

## Current milestone: **M2 -- Navigation & screen skeletons** (spec sec 15, sec 5)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | Main tab shell: bottom bar (Profile/Home/Challenge), persistent top bar (Add Friends, Notifications), stub screens (add-friends, notifications, settings w/ sign-out) | ✅ done |
| 2 | Home: 3-feed horizontal swipe (Friends / Friends-of-friends / Explore) | ✅ done |
| 3 | Challenge: Mountain <-> Leaderboard horizontal swipe, 7-stop mountain placeholder | ✅ done |
| 4 | Profile: header/tabs skeleton, swipe -> Shop w/ translucent edge hint, error boundaries per major screen | ⬜ not started |

**Next step:** M2 sub-step 4 -- Profile skeleton + swipe to Shop.

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
- M2: **in progress**
- M3–M14: not started (do not work ahead — founder reviews after each milestone)

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
- Supabase project `aducawlftwdowvsnryar` wired with the modern `sb_publishable_` key (client-safe by design; RLS is the boundary). No schema yet — tables start in M3/M4.
- eas.json env block carries only the EXPO_PUBLIC (client-safe) vars; real secrets go in Edge Function env later, never in the repo.
- React Query + Zustand intentionally NOT installed yet — first consumer is M1 (no dead code rule).
