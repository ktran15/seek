# Seek — MVP Build Specification for Claude Code (v2)

> **Working name:** "Seek" (provisional front-runner; "Seed" and other word-play options still in the running — see §18). The app name is a **single source-of-truth string in config**; changing it must touch exactly one place.
> **Document status:** Authoritative build spec, v2 (supersedes v1). Values marked **`TUNE`** are founder-adjustable config — read from config, never hard-code. Unmarked values are locked product decisions — do not redesign them.
> **Prime directive:** Do not invent features, screens, mechanics, or scope not described here. If something is genuinely ambiguous, **stop and ask the founder**. Guessing on product decisions is the failure mode this document exists to prevent.

---

## 1. Project Overview & MVP Definition

### 1.1 What Seek is
Seek is a mobile **social challenge app** built on *doing, together* — not passive scrolling. Each day, every user receives the **same single challenge**, revealed only when they enter it. They complete it (**one real attempt**), submit proof (photo/video), and that completion **posts to a social feed** and **advances their beaver one stop up a 7-stop mountain**. Some challenges are solo pass/fail, some are head-to-head (H2H) with an **automatic** winner, one is a community vote.

**Your character is a beaver (§10).** The player's avatar IS a customizable beaver they name, dress with gacha cosmetics, and **keep happy** by showing up daily — a light Tamagotchi-style care loop. (There is no separate human "hiker" avatar; the beaver replaces it. A visually distinct **rival beaver** stands in as the H2H opponent when no friend can be paired, §7.9.)

This is a do-and-share-and-compete social product. It is **not** a learning/curriculum app. Do not add instructional content.

### 1.2 MVP & GTM
- Deliverable: a **TestFlight-distributable native iOS app**, genuinely usable end-to-end (real auth, data, submissions, feed, economy).
- GTM: founders recruit ~50 users via LinkedIn/friends; a **fixed 7-day global beta** with 7 challenges (one per day); collect feedback; iterate or pivot.
- Growth mechanic: an **invite-a-friend flow** (§7.8), **locked to `soft`** for this beta — strong encouragement + reward, never blocking. It appears in onboarding, persists in-app (Add Friends screen + Profile), and is nudged via notification. (`hard` remains a config flip if demand ever warrants it.)

### 1.3 The core loop
1. Open app → today's challenge is available (content hidden until entered).
2. Enter → short graphic/text explanation → begin → capture (timer/camera/upload per mode) → submit **one attempt**.
3. On submit: success animation → coins → **wooden crate awarded to inventory** → mountain climb animation (+ flag) → posted-to-feed confirmation.
4. H2H days: app auto-pairs vs. a friend (or the rival NPC) and auto-resolves a winner → bonus coins + blue crate.
5. Community-vote day: global voting window; poster's friends vote; top-3 placements earn rewards.
6. Friends react/comment in the feed; weekly **points** accrue to an egocentric friends leaderboard; end of week pays coin tiers + gold crate.
7. **Beaver care loop (§10):** completing the day raises your beaver's **Happiness** and extends a daily **streak** 🔥; skipping decays Happiness and breaks the streak. Both are cosmetic/motivational — never a gameplay gate. A **snack** from the Shop vending machine tops Happiness up any time.

**Success = this loop is smooth, fair, surprising, and rewarding for 7 straight days.**

---

## 2. Engineering Standards & Working Agreement

### 2.1 Standards (non-negotiable)
- **A-level senior systems engineering.** Clear module boundaries, single responsibility, no god-files, no duplication.
- **TypeScript strict** end-to-end. No `any` without a justifying comment. Share types client/server where possible.
- **Security:**
  - **RLS enabled on every table** with explicit policies. No exceptions.
  - **All secrets server-side** (Edge Functions / build env). Never in the client bundle.
  - Server-side validation of all input. Never trust the client.
  - Signed URLs for media; buckets are not world-open.
  - Server-authoritative writes for: coins ledger, crate awards/rolls, H2H pairing/resolution, vote tallying, weekly payout, points, **beaver Happiness decay/restore, streak tracking, and the vending-machine (snack) purchase**.
- **Error handling:** explicit handling on every async path; React error boundaries per major screen; friendly user-facing errors, detailed logs.
- **Accessibility:** labels, ≥44pt targets, token-driven contrast, reduced-motion respected.
- **Tests (minimum):** unit tests for economy math, victor-resolution logic, H2H cycling/pairing, friend-graph queries, points accrual, the attempt state machine, and **the Happiness state-selection + decay/streak logic (§10)**. These are the invisible-when-wrong systems.
- No dead code; stubs are visible and reported to founder.

### 2.2 Working agreement
Build in milestone order (§15). After each milestone: deliver a runnable increment + test guide → **STOP** → founder tests → iterate → only then proceed. Never build multiple milestones ahead silently.

---

## 3. Tech Stack & Setup

- **App:** Expo (React Native) + TypeScript, Expo Router.
- **Backend:** Supabase — Postgres, Auth (Apple, Google, email), Storage, Edge Functions, Realtime.
- **Client state:** React Query (server state) + Zustand (local/UI). Nothing else.
- **Build:** EAS Build → TestFlight. Configure bundle ID, signing, and pipeline in M0.
- **Config module (typed, central):** app name, beta start date, **beta timezone = America/New_York (EST/EDT)**, all `TUNE` values, feature flags (`enableRivalOpponent` — the H2H NPC toggle, formerly `enableMascotOpponent`; `inviteGate`), rival-opponent config (targets/asset), **Happiness + streak TUNE values (starting Happiness, daily decay, completion restore, snack cost/restore)**, media limits.

> **Founder tooling slot:** iOS-dev MCPs/skills (founder researching — integrate when provided). Figma Dev-Mode MCP for founder-flagged screens. Art assets are founder-supplied final files dropped into registry slots (§14) — no image-generation step in the build.

---

## 4. Design System

### 4.1 Tokens (build first; every screen consumes them)
> **Exact values live in `SEEK_ART_AND_AESTHETIC_DIRECTION.md`** (locked palette hex + roles, the Alfa Slab One / Nunito / Inter / Archivo type system, 3D-press buttons, 16px corners, tactile depth, earth-tinted surfaces). Build the token system to match that document. Summary of what to define:
- **Color** — the earthy "summer camp" palette with fixed role assignments (background, primary CTA = cadmium orange, info = bice blue, celebration/coins = indian yellow, etc.). Light mode only for v1.
- **Typography** — four roles: Alfa Slab One (hero/brand, big + sparing), Nunito (functional headers), Inter (body/UI), Archivo (timer, **tabular numerals**).
- **Component feel** — 3D-press buttons (accent fill + darker bottom lip), 16px card/surface radius, restrained tactile shadows, subtly earth-tinted surfaces on cream.
- **Spacing, radii, elevation, z-layers, motion tokens** (durations/easings; respect reduced-motion).

### 4.2 Asset registry & swap rule
All non-token visuals load from a **central named registry** (`assets/registry.ts`: logical name → file). Screens reference **slot names only** (`mountainBackground`, `beaverBase`, `crateWooden`, `flagPlanted`, `rivalBeaver`…), never inline paths. Replacing the file behind a slot updates the app with **zero code change**. Full manifest §14.

### 4.3 Figma escalation
Default: tokens + generated assets. For screens the **founder flags** as specific-vision or struggled-with: founder supplies a clean, component-based Figma frame; translate faithfully via Figma MCP. Never block the build waiting on Figma.

---

## 5. Information Architecture & Screen Map

```
Loading (logo/name/brand animation)
  │
Auth ── Apple ID │ Google │ Email
  │
Onboarding (in order) — visual-first, graphic/icon-driven, minimal text (see §10.6):
  1. Enable Notifications (explain: daily reveal, H2H results, beaver care reminders)
  2. Why we're great / social proof
  3. MEET YOUR BEAVER — a visual intro beat introducing the beaver concept
     (replaces the old text "what Seek is" screen)
  4. NAME YOUR BEAVER (never defaults to/suggests "Bucky" — that's the rival, §7.9)
  5. CUSTOMIZE YOUR BEAVER — pick sex (male/female) + color (Brown/White/Black),
     6 distinct bodies, live preview (§10.1). Users START PLAIN — no free cosmetics.
  6. CARE-LOOP EXPLAINER — "complete challenges to keep your beaver happy," taught
     graphically (icons / simple animated beats), NOT a wall of text.
  7. INVITE A FRIEND (per inviteGate flag §7.8):
     soft: strong prompt "You need a rival" → iMessage share sheet → reward on send; skippable.
     hard: must send ≥1 invite to proceed (flag-controlled; not default).
  8. Hook / Begin
  │
MAIN APP
 ├─ Top Bar (persistent): Add Friends │ Notifications (requests, results)
 └─ Bottom Bar: [ Profile ] [ Home ] [ Challenge ]
      │
      ├─ PROFILE
      │   • BEAVER display (layered render at its current Happiness state, §10.3)
      │   • Name/Username with **streak 🔥N** beside it (§10.7), Happiness meter, Share Profile
      │   • Tabs/sections: Stats │ Badges │ INVENTORY (unopened crates + owned cosmetics; open crates here — standard gacha pattern)
      │   • Settings (gear): Edit beaver (base body color), Sign out, DELETE ACCOUNT, Privacy Policy, Terms, Blocked users
      │   • Swipe → SHOP (translucent "Shop" hint at edge; crate grid + snack vending machine, §9.5)
      │
      ├─ HOME — horizontal swipe between three feeds:
      │   • Friends │ Friends-of-friends │ Explore (sorted: like-count within current beta day, recency tiebreak)
      │   Post = poster + submission media (+carousel if multi-photo), like, comment,
      │   overflow menu → Report post / Block user. "Suggestions to add" woven in.
      │
      └─ CHALLENGE — horizontal swipe between two views:
          • MOUNTAIN (default): open animation → mountain, 7 stops, trail up the middle,
            your beaver at current stop, flag at each completed stop, start flag at base.
            Past missed days locked/grayed; future days locked until date.
            Tap current stop → Challenge Flow (§7.5).
            On CV day: a clear, persistent COUNTDOWN to the global EST close pinned at top.
          • LEADERBOARD: egocentric friends leaderboard, weekly points, payout info.
```

---

## 6. Data Model

> Every table: **RLS enabled**, explicit policies. UUID PKs. UTC timestamps. Client never writes ledger/crates/matches/points directly — Edge Functions only.

**`profiles`** — `id` (= auth uid), `username` (unique), `display_name`, `beaver_name` (the player-chosen name for their beaver, §10 — distinct from username), `avatar_config` (jsonb: **base body color** + equipped cosmetic id per gacha slot, §10.1–10.2), `coins` (int; starting balance **100** `TUNE`; maintained transactionally alongside ledger; owner-readable only per M13 audit), `happiness` (int **0–100**, server-authoritative — decay/restore in §10.3–10.5; starting value `TUNE`), `streak_count` (int, consecutive completed days, server-authoritative, §10.7), `joined_beta_day` (int), `bio`, `created_at`.

**`friendships`** — `id`, `requester_id`, `addressee_id`, `status` (`pending|accepted|declined`), `created_at`, `responded_at`. Mutual when accepted; FoF derived by query. Indexed both user columns.

**`blocks`** — `id`, `blocker_id`, `blocked_id`, `created_at`. Blocking removes the blocked user from all feeds, suggestions, H2H pairing pools, and vote visibility, both directions. Unique pair.

**`reports`** — `id`, `reporter_id`, `post_id` (or `user_id`), `reason` (enum + freetext), `status` (`open|actioned|dismissed`), `created_at`. Feeds the admin removal path (§12).

**`invites`** — `id`, `inviter_id`, `channel` (`imessage|link`), `invite_code`, `sent_at`, `redeemed_by` (nullable), `redeemed_at`. Drives invite rewards + hard-gate check.

**`challenges`** (seeded, 7 rows) — `id`, `beta_day` (1–7 unique), `title`, `description`, `explainer` (short graphic/text spec shown pre-begin), `mode` (`SP|H2H|CV`), `capture_type` (`timer_video|camera_photo|camera_video|screenshot_plus_count|multi_photo_count`), `has_difficulty` (bool; day 4 only), `victor_rule` (enum), `recording_cap_seconds` (nullable; day 1 = 60, day 4 = 30), `vote_window` (nullable; day 3), `proof_required` (true).

**`submissions`** — `id`, `user_id`, `challenge_id`, `beta_day`, `state` (`in_progress|submitted`), `submitted_at`, `passed` (bool), `score` (numeric — seconds/count/guesses), `difficulty` (day 4: `easy|medium|hard`), `media_paths` (jsonb array — supports multi-photo), `created_at`. **Unique `(user_id, challenge_id)`** = single attempt. See §7.4 state machine.

**`h2h_matches`** — `id`, `challenge_id`, `beta_day`, `protagonist_id`, `opponent_id` (nullable = the rival NPC when null + `vs_mascot` bool), `protagonist_submission`, `opponent_submission` (nullable vs. the rival), `mascot_target_score` (nullable), `winner_user_id` (nullable until resolved; null + resolved = the rival won), `status` (`pending|resolved`), `resolved_at`. One row **per protagonist per H2H day** (§7.6). *(The `vs_mascot` / `mascot_target_score` column names are retained from the pre-pivot schema for stability; they now denote the rival NPC, §7.9.)*

**`h2h_history`** — `id`, `user_id`, `faced_user_id`, `beta_week`, `created_at`. Powers the no-repeat friend cycling (§7.6).

**`votes`** — `id`, `submission_id`, `voter_id`, `created_at`, `updated_at`. **Unique `(voter_id, beta_day)`** — one vote per voter per CV day, **changeable until close** (upsert). Voter must be a friend of the poster (enforced server-side).

**`feed_posts`** — `id`, `submission_id`, `author_id`, `beta_day`, `created_at`, derived `like_count`, `comment_count`, `removed` (bool — admin moderation).

**`reactions`** — `id`, `post_id`, `user_id`, `type` (`like`), `created_at`. Unique `(post_id,user_id)`.

**`comments`** — `id`, `post_id`, `user_id`, `body`, `created_at`, `removed` (bool).

**`coins_ledger`** (append-only) — `id`, `user_id`, `delta`, `reason` (`completion|h2h_win|vote_placement|weekly_payout|solo_weekly_payout|crate_purchase|dupe_refund|invite_reward|snack_purchase`), `ref_id`, `created_at`. (`snack_purchase` = the −25-coin vending-machine snack, §9.5/§10.5.)

**`points_ledger`** (append-only; **separate from coins**) — `id`, `user_id`, `beta_week`, `delta`, `reason` (`completion|h2h_win|vote_placement`), `ref_id`, `created_at`. Leaderboard rank = sum per user per week.

**`crates`** — `id`, `user_id`, `tier` (`wood|blue|red|yellow|gold`), `source` (`completion|h2h_win|vote_top3|vote_win|weekly_prize|purchase|invite_reward`), `opened` (bool), `opened_at`, `created_at`. Unopened crates render in Profile → Inventory.

**`cosmetics`** — `id`, `slot` (`hats|tails|gloves|eyes`), `name`, `rarity` (`common|rare|epic|legendary`), `asset_slot_name`. Seeded catalog (LOCKED, §10.2) — **19 items across 4 gacha slots**, each a fixed rarity:
- **hats:** Beanie (common), Baseball Cap (rare), Bow Hat (rare), Propeller Hat (epic), Crown (legendary)
- **tails:** Red Beaver Tail (common), Checkerboard Tail (rare), Beaver Tail w/ Bow (rare), Rainbow Tail (epic), Gold Tail (legendary)
- **gloves:** Red Boxing Gloves (common), Blue Gloves (rare), Pink Mitts (epic), Golden Boxing Gloves (legendary)
- **eyes:** Sunglasses (common), EyePatch (rare), Eye Shadow (rare), Ski Goggles (epic), Gold Monocle (legendary)
> Base **body color** (Brown / White / Black + girl variants) is player-chosen at onboarding, NOT gacha — it lives in `avatar_config`, not this table.

**`user_cosmetics`** — ownership; unique `(user_id, cosmetic_id)` → dupe-to-coins.

**`badges` / `user_badges`** — v1 catalog: **Summit Reached, First Win, Vote Winner, Perfect Week** (all 7 days completed).

**`notifications`** — `id`, `user_id`, `type`, `payload` (jsonb), `read`, `created_at`.

**Deletion policy:** the app never hard-deletes content in normal flows. The **one sanctioned exception** is Apple-required account deletion (§12): a service-role Edge Function cascades removal of the user's data.

---

## 7. Challenges — Master Logic

### 7.1 Day → challenge → mode mapping (LOCKED; order fixed)

| Day | Challenge | Mode | Capture | Score / victor basis |
|---|---|---|---|---|
| 1 | Fastest to drink a water bottle | **H2H** | `timer_video` — recording IS the timer; big on-screen clock; **auto-stop 60s** | **Lower time wins** (time = recording duration at user's stop, capped 60s) |
| 2 | Solve the Wordle | **H2H** | `screenshot_plus_count` — upload screenshot + guess selector (1–6 or X) | **Fewer guesses wins**; X loses to any solve; screenshot = public proof |
| 3 | Best food of the day | **CV** | `camera_photo` | Global EST vote window; poster's friends vote; top-3 place (§7.7) |
| 4 | Basketball (E/M/H — difficulty selects mode) | **Mixed: E/M = SP, Hard = H2H** | E/M: `camera_video` + pass/fail self-report. Hard: `camera_video` with **30s auto-stop** + made-count input | E/M: pass/fail + proof. Hard: **higher made-count wins** (Hard vs. Hard only) |
| 5 | Most selfies with different people (family & friends count) | **H2H** | `multi_photo_count` — up to **25** photos (`TUNE`) + count | **Higher count wins; tie → earlier `submitted_at`**; photos = public proof |
| 6 | Photo of you + a slice of pizza | **SP** | `camera_photo` | Pass/fail (self-report) + photo proof |
| 7 | 2-minute plank | **SP** | `camera_video` | Pass/fail (self-report) + video proof |

- **SP:** earn the point or not; no opponent. Self-report + public proof; friends are the referee.
- **H2H:** app auto-resolves the winner. **Players never pick winners.**
- **CV:** poster's friends vote within the global window.
- **No AI/CV verification anywhere in v1.** Do not add image analysis, pose detection, or shot counting.

### 7.2 Day 4 — difficulty selects the mode (LOCKED)
User **chooses** on entry (recorded in `submissions.difficulty`); the choice determines both the task **and the mode**:
- **Easy** = throw a paper ball into a trash can → **SP pass/fail**: video proof, self-report made-it-or-not, normal completion reward + climb. No timer, no opponent.
- **Medium** = make a free throw → **SP pass/fail**, same treatment as Easy.
- **Hard** = 3-point shots, **30s auto-stop recording**, made-count input → **the only H2H path on day 4.**
Implementation: the day-4 `challenges` row carries `difficulty_modes` (jsonb: `{easy:'SP', medium:'SP', hard:'H2H'}`); the reveal screen must make this **explicit and clear** ("Hard unlocks head-to-head").
**Intended asymmetry (do not "balance" it away):** choosing Hard is the *only* way to earn the H2H bonus + blue crate on day 4. Easy/Medium are the safe climb; Hard is risk-for-reward. That is the point of the difficulty choice.
**Hard pairing:** the H2H pool is Hard-choosers only, using the normal cycling algorithm (§7.6) restricted to friends who submitted Hard; the rival NPC (§7.9, with a Hard target score, `TUNE`) resolves at day close if no eligible friend.

### 7.3 Reveal & explainer pattern (all 7 challenges)
1. Mountain → tap current stop. Challenge content is **hidden until this moment** (surprise is the product).
2. **Reveal screen:** challenge title + a **short graphic/text explainer** — what to do, how it's judged, what capture happens, "you get ONE attempt."
3. **Begin** button → capture flow per `capture_type`.
Reveal alone consumes nothing (§7.4).

### 7.4 Attempt state machine (LOCKED)

```
unrevealed → revealed → in_progress → submitted
```

- **`revealed`:** user has seen the challenge. **Not consumed.** They may leave (get a water bottle, find a court) and return freely. Accepted consequence: users can prep after seeing the task. Intended.
- **`in_progress`:** entered on **Begin/capture start** (recording start, photo session start, upload flow start). A `submissions` row is created with `state='in_progress'`.
- **`submitted`:** a completed capture is submitted. Terminal. Unique constraint enforces one per challenge.
- **Crash / app-quit / phone-death mid-capture:** the attempt is **NOT burned.** On return, the `in_progress` row is reset and the user may begin again. (Founder-accepted tradeoff: a determined user can force-quit to retry; mitigation is public proof + friends-as-referees. **Do not "fix" this into something stricter.**)
- **Upload failure ≠ attempt loss.** Captured media persists locally; submit retries until success. Never burn an attempt on a network error.
- UI must state "This is your one attempt" **before** capture begins.

### 7.5 Timer challenges — recording is the clock (LOCKED)
- **Day 1:** tapping Begin starts video recording **and** the timer simultaneously. A **large, high-contrast clock overlays the camera view** (the user can clearly see it while recording; it's visually part of the captured experience). User taps Stop when done → their `score` = elapsed seconds. **Auto-stop at 60s** (`recording_cap_seconds`); auto-stop submits with score = 60.
- **Day 4:** Begin starts recording + a **30s countdown**, same big-clock treatment; **auto-stops at 0**. User then inputs made-count (`score`).
- The user never controls a detached stopwatch — the clock is bound to the recording, making times trustworthy-by-construction and visible in proof.

### 7.6 H2H pairing — friend cycling + rival-NPC fallback (LOCKED)
- **Async H2H. One match per user (as protagonist) per H2H day.** A user's submission may additionally be *drawn* as the opponent in other users' matches — that's fine; each match row belongs to its protagonist.
- **Cycling algorithm:** on each H2H day, pair the protagonist with a **random accepted friend they have NOT yet faced this beta week** (`h2h_history`). With 2 friends you'll face both across the week; with 1 friend, they're your rival every H2H day; when the un-faced pool is empty, **reset the cycle** and draw again from all friends. Friends added mid-week enter the pool immediately.
- **Opponent submission timing:** pair at protagonist's submission if an eligible friend has already submitted; otherwise hold `pending` and pair when one does. If the day closes with no eligible friend submission → rival resolution (below) so no H2H day ends unresolved... **unless the user has friends who simply didn't play**, in which case: still resolve vs. the rival at day close (the user always gets a complete H2H experience).
- **The rival NPC** (§7.9) is the opponent **only when no eligible friend can be paired** (zero friends, zero same-bracket friends on day 4, or no friend submission by day close).
- Pairing + resolution run in **Edge Functions** (server-authoritative). Resolution writes winner, awards H2H bonus + blue crate + points, sends notifications to both sides (rival matches notify only the user).

### 7.7 Community vote (day 3) — global EST window (LOCKED)
- **One global window in the beta timezone (America/New_York):** voting opens when day 3 begins and **closes at day-3 end, EST**, for everyone simultaneously.
- A **persistent, prominent countdown to close** is pinned at the top of the Challenge screen (and on day-3 feed posts) throughout the window.
- **Voting rules:** voters vote on posts by **their friends** (tally per poster is among the poster's friends — egocentric, §7.10). **One vote per voter**, changeable until close (last write wins).
- **Placement:** per-poster vote totals rank top-3 within each poster's friend context; **ties share the higher placement** (two tied for 1st → both take 1st rewards; next place is 3rd).
- Tally runs server-side at close; rewards + points + notifications issue then.

### 7.8 Invite flow (LOCKED: `soft`)
- `inviteGate: 'off' | 'soft' | 'hard'` (config; **locked to `soft` for this beta** — encouragement, never a wall; `hard` stays a config flip if demand ever warrants gating).
- **Onboarding step:** framed as "you need a rival" → native iMessage share sheet with invite link/code → **reward on send** (coins `TUNE` 50; consider a wooden crate) → skippable.
- **Persistent in-app entry points:** an Invite action on the **Add Friends** screen and on the user's **Profile** ("Invite a friend"), always available — not just onboarding.
- **Notification nudge:** an in-app/push invite prompt (§13) — e.g., day 2–3 if the user has <3 friends ("Your leaderboard needs rivals — invite a friend"), `TUNE` timing/threshold. One nudge max; don't nag.
- Invite links deep-link to TestFlight/App Store; redemption records `redeemed_by` and may reward the inviter again (`TUNE`).

### 7.9 Rival fallback opponent — **Bucky** (LOCKED)
When no eligible friend can be paired, the H2H opponent is **Bucky** — a **single, fixed rival beaver NPC** — so solo/new users always get a full H2H. Bucky is **visually distinct from the player's own beaver** (a different, recognizable "opponent" look) so "my beaver" and "Bucky" are never confused. Bucky is a **recurring rival character, not a pool** and **not** the player's beaver.
- **Identity (LOCKED 2026-07-13):** name = **Bucky**; one fixed design. Build against config (`rival.name = 'Bucky'`, `rival.assetSlot`) + registry slot `rivalBeaver` (+ win/lose/idle expression states). Final art is founder-supplied; placeholder until then.
- **Name collision:** "Bucky" is Bucky's name. The player naming their own beaver must **not** default/suggest "Bucky" (§10.6) — it would read as naming your pet after your opponent.
- **Scoring (LOCKED for beta): fixed tunable targets** — preset per challenge (and per difficulty on day 4) in config, beatable-but-not-trivial. Normal `victor_rule` resolves user vs. target.
- Applies to H2H days only (1, 2, 4, 5). **Bucky never appears on leaderboards.**
- Win vs. Bucky pays the standard H2H bonus + blue crate unless founder reduces it (§18).
- Framing: friendly rival/cheerleader, never punishment.

### 7.10 Friend-graph model — egocentric (LOCKED)
- **Leaderboard:** ranks **viewer + their accepted friends** only. No global leaderboard, no global weekly winner. Intended.
- **Vote tallies:** among **the poster's friends**.
- **Feeds:** Friends = accepted friends' posts. FoF = one hop out (excluding self + existing friends + blocked). Explore = broader pool, **sorted by like-count within the current beta day, recency tiebreak**.
- Everything submitted is **immediately public within its visibility tier**; no drafts/private state.
- Blocks (§12) are removed from all of the above, both directions.
- Implement graph traversal as tested helpers/Edge Functions. **Unit-test.**
- Clans / region / global boards = v2 (§17).

---

## 8. Mountain Progression

- Mountain view: data-driven **7 stop coordinates**, trail up the middle, start flag at base, **avatar at current stop**, **flag planted per completed stop**, summit celebration state after day 7. Open animation on entry.
- **Climb ≠ win:** completing the daily advances one stop regardless of H2H/vote outcome. Wins affect coins/crates/points only.
- **Global fixed 7-day calendar:** single start date (config). Day N = same calendar date for everyone; availability rolls at the **user's local midnight**, but the date→challenge mapping is global. **Exception:** day 3's *vote window* runs on the global EST clock (§7.7).
- **Late joiners** start on the current day; missed days **locked/grayed**, no makeups; future days locked until date.
- Art from registry slots; **code owns positioning/state, art owns the look.**

---

## 9. Economy

> All numbers `TUNE`. Logic must not depend on specific values. Ledgers are append-only, server-written.

### 9.1 Coins (spendable currency)
| Action | Coins |
|---|---|
| Complete daily challenge | 50 |
| Win H2H | +30 |
| Vote placement | 1st 50 / 2nd 30 / 3rd 20 |
| Weekly leaderboard payout (qualified, §9.2) | 1st 300 / top-3 150 / top-10 75 |
| Solo weekly payout (unqualified users who completed ≥1 challenge) | 75 flat |
| Invite sent (soft/hard flow) | 50 |
| Starting balance | 100 |
| Dupe cosmetic refund | 20 |

### 9.2 Points (leaderboard currency — SEPARATE from coins; LOCKED separation)
Points determine weekly rank; coins never do. Buying crates cannot touch rank.
| Action | Points |
|---|---|
| Complete daily challenge | 10 |
| Win H2H | 5 |
| Vote placement | 1st 5 / 2nd 3 / 3rd 2 |

- **Weekly payout qualification: ≥3 accepted friends** (`TUNE`). Qualified users rank egocentrically and earn tier payouts + gold crate for 1st. **Unqualified users** get the **flat solo payout** (75) if they completed ≥1 challenge — closes the "friendless auto-1st" exploit.

### 9.3 Crates — 5 tiers (LOCKED "Reading A")
One crate design, **recolored 5 ways**. Quality: wood < blue < red < yellow < gold.

| Tier | Earned by | Buyable | Price `TUNE` |
|---|---|---|---|
| Wooden | Each challenge completion | Yes | 100 |
| Blue | H2H win | Yes | 250 |
| Red | Top-3 vote | Yes | 500 |
| Yellow | Vote win (1st) | Yes | 1000 |
| Gold | Weekly leaderboard prize (1st, qualified) | **No — prize only** | — |

**Crate handling (standard gacha pattern, LOCKED):** crates are **awarded to inventory unopened** (Profile → Inventory). The user opens them deliberately (open animation → reveal). No auto-open. Post-submit flow shows "Wooden crate added to your inventory."

### 9.4 Drop rates by tier (`TUNE`)
| Tier | Common | Rare | Epic | Legendary |
|---|---|---|---|---|
| Wood | 75% | 20% | 4.5% | 0.5% |
| Blue | 60% | 30% | 8% | 2% |
| Red | 45% | 35% | 16% | 4% |
| Yellow | 30% | 40% | 22% | 8% |
| Gold | 10% | 35% | 35% | 20% |

Rolls draw from the **beaver cosmetic catalog** (§6 `cosmetics` / §10.2): the roll picks a rarity per the tier's table above, then a random item of that rarity from the 4 gacha slots (hats/tails/gloves/eyes). The tier percentages are unchanged by the pivot — only the catalog they draw from changed. Duplicate → auto-convert to 20 coins with clear messaging. **Rolls happen in an Edge Function**; client cannot influence outcomes.

### 9.5 Shop
- Reached by **swiping from Profile** (translucent "Shop" edge hint).
- **Fortnite-style grid** of buyable crates (wood/blue/red/yellow). **Static for the 7-day beta** (no rotation). Crates only — no direct cosmetic sales in v1.
- **Vending machine (in the Shop — NOT a separate swipe/tab):** one **snack** item, **25 coins** (`TUNE`), restores **+15 Happiness** (`TUNE`, capped at 100, §10.5). Buyable any time, repeatable. Runs through the same server-authoritative pattern as crate purchase (a `buy_snack` RPC → `coins_ledger` `snack_purchase` −25 + Happiness +15, both server-side; balance floor enforced by the ledger trigger).
- **No real-money IAP, no ads.** Closed earned-coin economy.

---

## 10. Character & Care System — Your Beaver

The player's avatar is a **beaver** (there is no separate hiker). It is customizable (base body + gacha cosmetics), and it has a light **Tamagotchi-style care loop** (Happiness) plus a **daily streak**. The consistent-art rules for producing the beaver, its body-color variants, its emotional states, and its cosmetics live in `SEEK_CHARACTER_RIG_BIBLE.md`.

### 10.1 Base body (player-chosen, NOT gacha) — LOCKED
Chosen at onboarding and editable in Settings → Edit beaver. **Body = sex × color: male/female × Brown/White/Black = 6 distinct bodies.**

- **Male and female are two genuinely different designs**, each with its own silhouette/art — **not** a recolor of one another. There are therefore **two canonical bodies** (rig bible §4), each with **3 shape-identical color recolors** (Brown / White / Black).
- Stored in `avatar_config` (e.g. `{ bodySex: 'male'|'female', bodyColor: 'brown'|'white'|'black' }`).
- **Rig requirement:** the two canonical bodies must share the **same anchor registration** (head/eye/paw/tail points) so the single 19-item cosmetic catalog fits **both** silhouettes. If they diverge, every cosmetic needs a per-sex variant and the catalog doubles — avoid this (rig bible §4/§5).

### 10.1b Starting state (LOCKED)
New users **start plain**: base body only. **No free starter cosmetic is granted** — every hat/tail/glove/eyes item is earned from crates (§9).

### 10.2 Cosmetic slots (gacha) — 4 slots, 19 items (LOCKED catalog)
Everything below is worn ON the beaver, from crates only (§9). Each item has a **fixed rarity** (drives the §9.4 draw). Full seed catalog in §6 `cosmetics`:
- **Hats** (5): Beanie · Baseball Cap · Bow Hat · Propeller Hat · Crown
- **Tails** (5): Red Beaver Tail · Checkerboard Tail · Beaver Tail w/ Bow · Rainbow Tail · Gold Tail
- **Gloves** (4): Red Boxing Gloves · Blue Gloves · Pink Mitts · Golden Boxing Gloves
- **Eyes** (5): Sunglasses · EyePatch · Eye Shadow · Ski Goggles · Gold Monocle

> Together with the base body that is **5 total customization points on the beaver** (base body + hats + tails + gloves + eyes) — **CONFIRMED**.

- **Layering (LOCKED):** independent stacked layers, one per slot, over the base body; every cosmetic works standalone; **no combinatorial art**. Z-order + anchor zones per the rig bible.
- **Inventory/equip:** Profile → Inventory lists owned cosmetics by slot + rarity; tap = preview on the beaver; confirm = equip (`avatar_config`).

### 10.3 Happiness — the care loop (0–100)
Every user's beaver has a **Happiness** stat, `0–100`, server-authoritative. It is purely **cosmetic/emotional — there is NO gameplay penalty at low Happiness** (no locked features, no score effect). It only changes how the beaver looks and feels, motivating daily return.

**Five visual states** (selection is pure logic — wire it now against placeholder art per state; swap real art later):

| State | Happiness | Look |
|---|---|---|
| **Thriving** | 81–100 | bright eyes, slight idle bounce, tail up, subtle shine/sparkle |
| **Content** | 61–80 | neutral-happy baseline (default pose) |
| **Okay** | 41–60 | slightly lower energy, ears/tail slightly drooped |
| **Unhappy** | 21–40 | visibly drooping posture, sadder eyes, looking down/away |
| **Neglected** | 0–20 | hunched, dull/desaturated coloring — still sympathetic/cute, never distressing |

**Equipped cosmetics render on top of every state** — a Neglected beaver still shows its hat/gloves/tail/eyes on the sadder base pose.

### 10.4 Decay & restore (server-authoritative)
- **Decay: −10 Happiness per day** (`TUNE`) when the user does **not** complete that day's challenge.
- **Completion restore: +20 Happiness** (`TUNE`) when they complete the day. **Additive, capped at 100** — completing does not necessarily refill to 100.
- Both are applied **server-side** (the day-close Edge Function settles each user's Happiness for the day it closes: completed → +20, not completed → −10; clamp 0–100). Never client-writable, consistent with the economy standard (§2.1).
- **Starting Happiness: 70** (`TUNE`, LOCKED default) — a new beaver begins **Content** (61–80).

### 10.5 Vending-machine snack (§9.5)
A **snack** in the Shop restores **+15 Happiness** (`TUNE`, capped at 100) for **25 coins** (`TUNE`), any time, repeatable. Server-authoritative `buy_snack` RPC: `coins_ledger` `snack_purchase` −25 + Happiness +15 in one transaction; the ledger trigger enforces the balance floor.

### 10.6 Onboarding integration
Beaver naming, base-body choice, and the care-loop teach happen in the reworked, visual-first onboarding (§5): Meet → **Name** → Customize (sex + color, plain start) → care-loop explainer. Keep it graphic/icon-driven, minimal text.
- **Naming rule:** the name field must **not default to or suggest "Bucky"** — that is the rival's name (§7.9). Use a neutral placeholder/empty field. (Whether a player may *type* "Bucky" is not blocked; we simply never propose it.)
- **`profiles.beaver_name`** stores it; required to finish onboarding.

### 10.7 Streak (separate, simple system)
- Tracks **consecutive days of challenge completion** per user (`profiles.streak_count`), server-authoritative (settled at day close alongside Happiness).
- **Display:** a **fire emoji 🔥 with the streak-day count** shown next to the username on **Profile** (and anywhere a username appears prominently, if a shared pattern exists — otherwise Profile is enough for now).
- **Appears at day 1** of a streak; **resets to 0** (icon disappears) the moment a day is missed.
- **No milestone rewards** — purely cosmetic/motivational. Do **not** build streak-threshold reward logic.

---

## 11. Profile & Social

- **Profile:** layered **beaver** (rendered at its current Happiness state, §10.3), name/username **with streak 🔥N beside it** (§10.7), a **Happiness meter**, Share Profile (deeplink), Badges, **Stats: stops climbed, H2H record (W-L), votes won, challenges completed, coins earned** (LOCKED set), Inventory tab, Settings, swipe→Shop.
- **Add Friends:** username search → request; Notifications handles accept/decline.
- **Post overflow menu:** Report post │ Block user (§12).
- **Feed interactions:** like, comment; friend suggestions woven into Home.
- **Multi-photo posts (day 5):** feed renders a **carousel** (auto-advance preview; swipeable); **tapping opens a gallery view** of all photos with swipe/select. Cap 25 photos (`TUNE`).
- All reads respect egocentric visibility + blocks.

---

## 12. Trust, Safety & App Store Compliance (REQUIRED — Apple gates)

- **Report content:** any post/comment can be reported (reason enum + optional text) → `reports` table → surfaces to an **admin path** (minimal: a Supabase-side view/Edge Function the founders use) that can set `removed=true` on posts/comments. Removed content disappears from all feeds immediately.
- **Block user:** from post overflow or profile. Effects per §6 `blocks`. **Blocked-users list** in Settings with unblock.
- **Account deletion (in-app, Apple-required):** Settings → Delete Account → confirm → service-role Edge Function cascades deletion of the user's data (auth user, profile, submissions, media, social rows). This is the sanctioned exception to no-hard-delete.
- **Privacy Policy + Terms:** generate standard documents (data collected: account info, submitted media, usage; no ads/tracking/ATT; contact email). Host at URLs (config slots) linked from Settings and App Store Connect. Founder reviews before submission.
- **Moderation copy** in onboarding/first-post: community guidelines one-liner ("keep proof real, keep it kind").
- **No ATT / tracking** anywhere.

---

## 13. Push Notifications

Own milestone; never blocks the core loop. Permission asked in onboarding step 1 with rationale; degrade gracefully if denied.
- **Daily challenge live** at local-day boundary ("Today's challenge is live — one shot.")
- **H2H result** (win/lose vs. friend; vs. the rival NPC notifies user only).
- **Vote countdown** (day 3: "voting closes in 2h") + **vote result**.
- **Weekly results** (placement, payout, gold crate).
- **Invite nudge** (once, `TUNE` timing; only if friend count < threshold — "Your leaderboard needs rivals").
- **Evening reminder** if today's challenge incomplete (`TUNE` time) — doubles as the **beaver care nudge** (completing restores Happiness / keeps the streak, §10). Framed around the beaver, not guilt.
Short, friendly, on-brand copy.

---

## 14. Assets — Style Bible & Manifest

### 14.1 Strategy (LOCKED — revised 2026-07-10)
- **All art is founder-supplied.** The founders generate and curate every asset themselves — with whatever tools they choose (manual nano banana / Gemini use outside the app, another generator, a commissioned artist, hand work) — and hand the agent **final files** to drop into named registry slots. **One consistent aesthetic** per `SEEK_ART_AND_AESTHETIC_DIRECTION.md`.
- **Beaver + rival art MUST follow `SEEK_CHARACTER_RIG_BIBLE.md`** — the frozen-base + fixed-canvas/anchor/z-order registration rules that keep the beaver identical across body colors, Happiness states, and appearances, and make every cosmetic align in any combination. These are constraints on **whoever/whatever produces the assets**; naive per-asset production is prohibited — it yields misaligned, inconsistent output.
- **There is no in-app or build-time generation step and no image-API key anywhere in the project's runtime or build.** The app only loads registry files. *(Obsolete: the prior "generation via image API at build/admin time, key server-side" pipeline — superseded 2026-07-10 by founder-supplied assets.)*
- Every asset fills a named registry slot → swappable zero-code (Figma replacements welcome later).

### 14.2 Style bible workflow
> **Authoritative aesthetic source: `SEEK_ART_AND_AESTHETIC_DIRECTION.md`.** That document defines the locked palette (exact hex), fonts (Alfa Slab One / Nunito / Inter / Archivo), UI component feel (3D-press buttons, 16px corners, tactile depth, earth-tinted surfaces), illustration fidelity (stylized game-asset craft — bold outline, cel-shading, texture, 3/4 forms; detail-tier rule), the beaver character concept, and crate/reward style. Design tokens (§4) and all asset production read from it.

**Intake workflow (current):** founders deliver final files → agent verifies each against the aesthetic doc + Rig Bible acceptance checks (character art) → file lands in `assets/art/` → registry slot flips to it. Zero code per swap.

*(Obsolete — superseded 2026-07-10, kept for history: the anchor-generation workflow — generate 3–4 anchor candidates → founder picks winners → locked references conditioning all subsequent API generations. The **frozen canonical references** it produced (`assets/art/canonical/`) remain the alignment standard that founder-supplied character art must still match.)*

### 14.3 Slot list
- `appLogo`, `loadingScreen`
- **Beaver (the player avatar) — `beaverBase/*`** keyed by **sex × color × Happiness state**: 2 canonical bodies (male/female — different designs, same anchor grid) × 3 colors (Brown/White/Black, shape-identical recolors within a body) × 5 state poses (Thriving/Content/Okay/Unhappy/Neglected, §10.3) = **30 body images**. Cosmetics composite on top of every one.
- **`buckyNeutral` / `buckyCheer` / `buckyDefeat`** (+ optional taunt) — **Bucky**, the single recurring H2H rival NPC, **visually distinct** from both player bodies; design TBD, placeholder until founder provides (§7.9).
- **Beaver cosmetic art** per gacha slot (`hats/*`, `tails/*`, `gloves/*`, `eyes/*`) — independent transparent layers aligned to the shared beaver rig/anchors (rig bible). 19 items (§10.2).
- `snack` — the vending-machine item art (§9.5).
- `mountainBackground`, `trail`, `flagStart`, `flagPlanted`, `summitState`
- `crateWooden/Blue/Red/Yellow/Gold` — one design, five recolors
- `badge/*` — Summit Reached, First Win, Vote Winner, Perfect Week
- Minimal misc accents (prefer tokens)

UI chrome = tokens, not generated. **Animation/polish** (climb motion, crate-open reveal, confetti, transitions, beaver idle bounce on Thriving) = M13 via MCP + skills.

---

## 15. Milestone Ladder (build → founder tests → iterate → next)

Each milestone ends with a runnable increment + test guide + **STOP** for founder review.

> **Character pivot (2026-07-12):** the beaver-avatar + care-loop + streak system (§10) supersedes the old hiker-avatar system. M1/M5/M8 below are updated to reflect it; the corresponding code is a **post-M13 rework** (the founder-directed pivot), not a re-run of the original milestone order.

- **M0 — Foundation:** Expo+TS, Router, Supabase, secrets wiring, config module (name, beta start date, EST timezone, TUNE values, flags), design tokens incl. timer display style, asset registry + temp placeholders, EAS→TestFlight pipeline. *Test: themed shell boots.*
- **M1 — Auth & onboarding:** Apple/Google/email, profile creation, visual-first onboarding sequence (§5) incl. **meet / name / customize your beaver** (base body color) and **invite step (soft)**; no ATT. *Test: sign up 3 ways; beaver name + body color persist; invite share sheet fires.*
- **M2 — Navigation & skeletons:** bottom bar, top bar, Home 3-feed swipe, Challenge Mountain↔Leaderboard swipe, Profile→Shop swipe, Settings stub. *Test: all reachable; swipes feel right.*
- **M3 — Friend graph & social core:** friendships, add/search/request/accept, request notifications, egocentric friend/FoF queries (**unit-tested**), blocks table + enforcement plumbing. *Test: two accounts friend; FoF resolves; block hides.*
- **M4 — Challenge engine (the heart):** seed 7 challenges; reveal→explainer→begin flow; **attempt state machine** (§7.4) incl. crash-safe retry; capture types (timer-bound recording w/ big clock + auto-stop, photo, video, screenshot+count, multi-photo≤25); media→Storage signed URLs; SP pass/fail; mountain climb + flags; global calendar; locked days; **post-submit sequence** (success→coins→crate-to-inventory→climb→feed confirm). *Test: complete SP challenge end-to-end; crash mid-capture and retry; verify one-attempt lock after submit.*
- **M5 — H2H & community vote:** Edge-Function pairing with **friend-cycling + h2h_history**, day-4 same-bracket matching, **rival-NPC fallback** (§7.9) w/ fixed targets, auto-resolution per victor rules (**unit-tested**); CV global EST window + persistent countdown + one changeable vote + tie-sharing tally. *Test: 3 accounts cycle correctly across two H2H days; the rival fires for a friendless account; vote closes and tallies right.*
- **M6 — Feed & interactions:** posts from submissions, three feeds w/ correct visibility + Explore sort, likes, comments, day-5 carousel/gallery, friend suggestions, **report post / block user UI**. *Test: visibility matrix correct; carousel + gallery work; report lands in reports table; block scrubs everywhere.*
- **M7 — Economy & crates:** coins + **points** ledgers (server-authoritative), award wiring for every trigger, 5-tier crates w/ correct sources + buyability, Edge-Function gacha + dupes, Shop grid (static), Inventory open-crate flow. **Unit-test economy + points math.** *Test: earn/spend/open; dupes refund; points ≠ coins; shop buys.*
- **M8 — Beaver, cosmetics & care loop (§10):** base body color (edit in Settings), **4 gacha slots** (hats/tails/gloves/eyes) layered on the beaver, inventory equip/preview, persistence; **Happiness** stat + 5-state selection + server-side decay/restore + snack vending machine; **streak** tracking + 🔥 display. *Test: equip from crates; layers render on every Happiness state; complete/skip moves Happiness the right way; snack tops it up; streak counts and resets.*
- **M9 — Leaderboard & weekly payout:** egocentric weekly points board, **≥3-friend qualification**, tier payouts + gold crate, **solo flat payout**, all via Edge Function. *Test: qualified vs. solo payouts; simulated week-end pays correctly.*
- **M10 — Trust & compliance:** admin removal path, blocked-users settings screen, **account deletion cascade**, privacy policy + terms generated and linked. *Test: delete an account fully; removed post vanishes.*
- **M11 — Push notifications:** all triggers (§13), local-day scheduling + EST vote countdown pushes. *Test: receive each type.*
- **M12 — Real assets pass:** founder-supplied final assets, dropped into named registry slots (character art per the Rig Bible's registration rules) — no in-app or build-time generation step. *Test: cohesive look.* *(Revised 2026-07-10: was "anchors → founder approval → full on-theme set" via the image-API pipeline.)*
- **M13 — Polish & animation:** climb animation, crate-open reveal, win confetti, transitions (MCP + skills), reduced-motion, empty/error states, final QA. *Test: full 7-day loop feels great on device.*
- **M14 — TestFlight beta build:** final EAS build, TestFlight submission, on-device smoke of the entire loop. *Deliverable: installable beta.*

---

## 16. Tooling Notes

- **Figma MCP:** founder-flagged screens only; clean component-based frames supplied by founder.
- **Art assets:** founder-supplied final files dropped into registry slots (§14) — no image-generation step in the app or build.
- **iOS-dev MCPs/skills:** *(founder to supply — integrate here; primary use M13 polish + build/testing help).*
- Self-review non-trivial logic (victor rules, cycling, graph queries, points/economy, state machine) against this spec before each milestone STOP.

---

## 17. Out of Scope for v1 (do not build)

Clans/groups; region/city/country/global leaderboards; Snap-Map geographic view; live/synchronous H2H; any AI/CV verification; real-money IAP, ads, paid shuffles; ATT; the "learn a bite-sized skill" product; shop rotation; direct cosmetic sales; practice mode.

---

## 18. Open Items for Founder

1. **App name:** "Seek" front-runner (play on "Seek Discomfort"); "Seed" et al. in the running. Finalize; set config string; check App Store/trademark availability.
2. **Rival NPC — RESOLVED 2026-07-13:** named **Bucky**, one fixed recurring character (not a pool). Still open: Bucky's final **design/art** (must read as visually distinct from the player's beaver); whether wins vs. Bucky pay full or reduced H2H bonus; per-challenge (and Hard-difficulty) target scores.
3. **Mountain reveal timing:** local-midnight availability confirmed? (Vote window is global EST regardless.)
4. **Final `TUNE` values** after first playtest: economy, points, prices, drop rates, payouts, solo payout, friend-qualification threshold, media caps, rival targets, reminder time, invite-nudge timing/threshold, **and the care loop: starting Happiness, daily decay (−10), completion restore (+20), snack cost (25) / restore (+15)**.
5. **Character-pivot decisions (§10) — ALL RESOLVED 2026-07-13:**
   - ✅ **Starter cosmetics:** none. Users **start plain**; all cosmetics come from crates (§10.1b).
   - ✅ **"5 slots":** confirmed = base body + 4 gacha (hats/tails/gloves/eyes).
   - ✅ **Body variants:** **male/female × 3 colors = 6 distinct bodies.** Female is its **own design/silhouette**, not a recolor → **two canonical bodies**, each with 3 color recolors (§10.1, rig bible §4).
   - ✅ **Starting Happiness: 70** (Content).
   - **Still open — art only:** the two canonical body designs, the 5 Happiness-state poses (per body), Bucky's design, and the 19 cosmetics are placeholder until founder-supplied. **Rig watch-item:** keep the male/female anchor registration identical, or the cosmetic catalog doubles (§10.1).
6. **Exact color hex + fonts** via style bible anchors.
7. **Privacy policy/terms review** + hosting URLs before App Store submission.
8. **"Wordle" naming:** keep the trademark name for beta (accepted risk) vs. genericize to "today's word puzzle" before wider release.

---

*End of specification (v2). Build in milestone order. When in doubt, ask — do not guess.*
