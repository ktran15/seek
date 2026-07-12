# CLAUDE.md — Seek

This file is read automatically every session. It is the ambient context for building **Seek**, an iOS social challenge app. Read it fully, then read the three spec documents below before doing anything.

## Authoritative documents (read these first, every time it matters)
1. **`SEEK_MVP_BUILD_SPEC_V2.md`** — the authoritative build spec: scope, data model, challenge logic, economy, milestones. This governs *what* to build.
2. **`SEEK_ART_AND_AESTHETIC_DIRECTION.md`** — the visual identity: palette, fonts, UI component feel. This governs *how it looks*.
3. **`SEEK_CHARACTER_RIG_BIBLE.md`** — the consistent-generation spec for avatar/mascot art. Governs the M12 asset pass only.

If anything in this file conflicts with the build spec, the build spec wins. If the spec is ambiguous, **ask — do not guess or invent product decisions.**

## The working agreement (critical — do not violate)
- Build in **milestone order** (spec §15). Build **only the current milestone**. Do **not** work ahead.
- After each milestone: deliver a runnable increment, **stop**, summarize exactly what was built and how to test it, and **wait for founder review** before starting the next milestone.
- Small, tested, reviewed increments. Never a large convoluted dump.
- Before starting a milestone, briefly outline your plan and wait for confirmation.

## Tech stack (fixed)
- **App:** Expo (React Native) + TypeScript, Expo Router.
- **Backend:** Supabase — Postgres, Auth (Apple/Google/email), Storage, Edge Functions, Realtime.
- **State:** React Query for server state, Zustand for local/UI state. Nothing else.
- **Build:** EAS Build → TestFlight (drive via `eas-cli` in the shell).

## Engineering standards (non-negotiable — spec §2.1)
- **TypeScript strict.** No `any` without a justifying comment. Share types client/server where possible.
- **RLS enabled on EVERY Supabase table**, with explicit policies. No table ships without them.
- **All secrets server-side only** (Edge Functions / build env). Never in the client bundle.
- **Server-authoritative writes** for: coins ledger, points ledger, crate awards/rolls, H2H pairing/resolution, vote tallying, weekly payout. The client never writes these directly.
- Server-side validation of all input. Signed URLs for media; buckets not world-open.
- Explicit error handling on every async path; React error boundaries per major screen.
- Accessibility: labels, ≥44pt targets, token-driven contrast, respect reduced-motion.
- **Unit-test** the invisible-when-wrong logic: economy/points math, victor resolution, H2H cycling, friend-graph queries, the attempt state machine.
- No dead code; stubs are visible and reported.

## Design system (from the aesthetic doc — build tokens to match)
- **Light mode only** for v1.
- **Palette (roles):** cream `#F5ECE3` background; jungle/rifle green (`#233837`/`#3D4625`) text/grounding; russian green `#779F6F` + shelduck blue `#B5D7CC` secondary surfaces; **primary CTA = cadmium orange `#EC8340`** (pressed: vermillon `#D45735`); celebration/coins = indian yellow `#ECA945`; info/nav = bice blue `#2774B4`.
- **Fonts:** Alfa Slab One (brand/hero, big + sparing), Nunito ExtraBold/Black (functional headers), Inter (body/UI), Archivo (timer — **tabular numerals**). All Google Fonts / OFL.
- **Component feel:** 3D "press" buttons (accent fill + darker bottom lip that pushes down on tap — the signature interaction), 16px corner radius, restrained tactile shadows, subtly earth-tinted surfaces on cream (not stark white).
- Everything reads from design tokens — no inline colors/fonts/spacing.

## Assets
- Every non-token asset loads from a **central named registry** (`assets/registry.ts`), referenced by slot name, never inline path. Swappable zero-code.
- Build all screens on placeholder assets first; the app must be fully usable before final art exists.
- **Final art is founder-provided:** the founders generate and curate all assets themselves and hand over finished files; the agent drops them into the named registry slots (character art must satisfy the Rig Bible's registration rules). There is no in-app or build-time generation step and no image-API key in the project.

## Reference correctness
- When writing against fast-moving libraries (Reanimated, Expo SDK, Supabase, React Query), use Context7 for current docs ("use context7") rather than relying on possibly-outdated memory.

## Session continuity (survive interruptions, including mid-milestone)
Sessions can end mid-milestone (usage limits, closed terminal, etc.). Nothing should be lost or restarted. Follow these habits so any fresh session can resume precisely:

- **Commit within milestones, not just at the end.** Each milestone has natural sub-steps (e.g. M0: project init → Supabase wiring → config module → design tokens → asset registry → EAS setup). Commit after **each working, verified sub-step** with a clear message (e.g. `M0: config module + TUNE values`). Git is the save system — a mid-milestone stop must land on the last green commit, never in a broken void.
- **Maintain `PROGRESS.md`** at the project root. Update it as you work with the current milestone and a checklist of its sub-steps marked done / in-progress / not-started, plus a one-line "next step" pointer. This is the fastest way for a new session to find the exact resume point.
- **Stop in a known-good state.** If you are ending, running low on context, or sensing you're near a limit, first get the code to a **compiling, committed** state, update `PROGRESS.md`, and write a short summary of what is done vs. half-done. Do not leave a broken build.
- **On resuming a session:** re-read this file, `PROGRESS.md`, and the current milestone in the spec; run `git log` and `git status`; identify the last completed committed step and the next uncompleted one; continue from there. **Do not restart completed steps or the whole milestone.**
- **Nothing auto-resumes** after a usage-limit reset — you (the founder) reopen Claude Code and prompt it to re-orient. The commit history + `PROGRESS.md` make that reliable.