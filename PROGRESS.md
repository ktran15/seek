# Seek — Build Progress

> Session-continuity tracker (see CLAUDE.md). A fresh session resumes from here:
> re-read CLAUDE.md + the current milestone in `SEEK_MVP_BUILD_SPEC_V2.md` §15,
> run `git log` / `git status`, then continue from the "Next step" pointer below.

## Current milestone: **M1 — Auth & onboarding** (spec §15, §5, §7.8)

| # | Sub-step | Status |
|---|----------|--------|
| 1 | DB: `profiles` + `invites` + `app_settings` tables, RLS + column grants, signup trigger | ✅ authored — **founder must apply** (see below) |
| 2 | Session plumbing: React Query + session hook, route groups, auth redirects | ✅ done |
| 3 | Email auth (sign up / sign in screens) | ✅ done |
| 4 | Apple + Google sign-in | ⬜ not started |
| 5 | Onboarding steps 1–3 (notifications, social proof, what-Seek-is) + username/profile step | ⬜ not started |
| 6 | Onboarding step 4: avatar creation (skin/eyes/hair/hair color; persists) | ⬜ not started |
| 7 | Onboarding step 5–6: invite-a-friend (soft, share sheet, invites row) + hook/begin | ⬜ not started |

**Next step:** M1 sub-step 4 — Apple + Google sign-in.

### ⚠️ Founder action required before testing sign-up
The Supabase MCP is configured **read-only** and the Supabase CLI isn't logged
in, so the migration could not be applied from this session. Apply it one of
these ways (takes ~1 minute):
- **Dashboard:** SQL Editor → paste `supabase/migrations/20260706000001_m1_profiles_invites_app_settings.sql` → Run; **or**
- **CLI:** `! npx supabase login` then `! npx supabase link --project-ref aducawlftwdowvsnryar` then `! npx supabase db push`; **or**
- Flip the Supabase MCP server to write mode and ask Claude to apply it.

Also required for social login (Supabase Dashboard → Authentication → Providers):
- **Apple:** enable; add bundle ID `com.smokeysummit.seek` as client ID.
- **Google:** enable; create Google OAuth client (iOS type), add its client ID/secret.
- **Email:** consider disabling "Confirm email" for the beta so signup is instant.

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
- M1: **in progress**
- M2–M14: not started (do not work ahead — founder reviews after each milestone)

## Notes / decisions this milestone
- Git was already initialized (`a815b86 Initial commit`); spec docs committed in sub-step 1.
- App name config string: `"Seek"` (single source of truth in config module).
- Bundle ID: `com.smokeysummit.seek` (founder can change in `app.config.ts` before first EAS build).
- Expo SDK 57 (default template: Expo Router + TS strict, React Native 0.86, Reanimated 4.5). Template demo app removed; minimal boot screen at `src/app/index.tsx` (themed in sub-step 5).
- App name lives ONCE in `app-name.json` (read by both `app.config.ts` and `src/config` — app.config.ts can't import TS modules).
- Supabase project `aducawlftwdowvsnryar` wired with the modern `sb_publishable_` key (client-safe by design; RLS is the boundary). No schema yet — tables start in M3/M4.
- eas.json env block carries only the EXPO_PUBLIC (client-safe) vars; real secrets go in Edge Function env later, never in the repo.
- React Query + Zustand intentionally NOT installed yet — first consumer is M1 (no dead code rule).
