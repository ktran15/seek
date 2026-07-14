# Seek — Character Rig Bible (Consistent Character-Art Spec)

> **Purpose (character pivot, spec §10):** the player's avatar IS a **beaver**. This document guarantees that (a) the player's beaver looks like the *same character* across its **3 color recolors** and all **5 Happiness states**, (b) every cosmetic (**hats, tails, gloves, eyes**) **aligns perfectly** — in any combination, on any state, **and on BOTH canonical bodies (male and female, §4)**, and (c) **Bucky**, the rival H2H NPC (§7.9), holds one consistent identity, visually distinct from the player's beaver, across his expression states. This is the hard part of the art pipeline; naive per-asset production will produce misaligned, inconsistent output. Follow this exactly.
> **Companion to:** `SEEK_ART_AND_AESTHETIC_DIRECTION.md` (the look) and `SEEK_MVP_BUILD_SPEC_V2.md` (the build). This document is a **hard constraint on the asset pass (spec §14 / milestone M12)**.
> **Who this binds (revised 2026-07-10):** these rig/anchor/layering/z-order rules constrain **whatever tool or artist produces the character assets** — the founders using nano banana / Gemini manually outside the app, any other generator, or a human artist. Assets arrive as founder-supplied final files; there is **no automated in-app or build-time generation pipeline and no server-side API call**. Where this document says "generate against the frozen base," read it as an instruction to the asset producer, whoever that is — the frozen base, fixed canvas, anchor zones, jacket-closed rule, and consistent registration apply identically to generated and hand-made art.

---

## 0. The Core Principle (read first)

Image generators are **stochastic** — the same prompt yields a slightly different character each time (proportions, pose, eye position all drift). That is fatal for a layered avatar. The fix is a single non-negotiable idea:

> **Freeze one canonical base, then generate everything else *against that frozen base as a reference image* — never from a fresh text prompt.**

Consistency does **not** come from clever prompt wording. It comes from:
1. **A frozen base image** that never changes.
2. **Reference-conditioned production** (against the base): every cosmetic, every Happiness-state pose, and every rival state is produced by working *from* the frozen base, so the art stays *this exact character*.
3. **A fixed canvas + registration** so all layers share one coordinate grid and stack in alignment by construction.
4. **Defined anchor zones + locked z-order** so swaps never shift anything.

Everything below implements those four ideas.

---

## 1. Canvas & Registration Spec (applies to EVERY asset)

Every asset — beaver base, body-color variants, the 5 Happiness-state poses, all 4 cosmetic slots, the rival beaver, rival expressions — is produced on an **identical canvas**:

- **Dimensions:** `1024 × 1024 px`, square, **transparent background** (PNG with alpha). (Export to app at @1x/@2x/@3x as needed; the master is 1024².)
- **Character placement (registration) — identical every time:**
  - Beaver is **centered horizontally**, occupying roughly the central column `x: 256–768`.
  - **Standing, front-facing (or a fixed 3/4), neutral stance**, **paws/arms slightly away from the body** so glove and torso cosmetics have clean edges; **tail visible** (peeking at the lower/side silhouette) so a tail cosmetic has a defined footprint.
  - **Head top ≈ y:120**, **feet bottom ≈ y:960**. Same scale, same pose, same position in every single generation. *(Trace exact values from the frozen beaver base and mark `LOCKED-ON-BASE`.)*
  - **Happiness-state registration envelope:** the 5 emotional states (§4) are expression + subtle posture shifts that **must keep head, eye, paw, and tail anchors within tolerance** of the neutral base, so one cosmetic layer set composites acceptably across all five. A state that moves an anchor out of tolerance needs per-state cosmetic handling — avoid it; keep the mood in the face/ears/shoulders, not in relocating the whole body.
- **Lighting:** one fixed light direction (recommend top-left) and the cel-shading style from aesthetic §5 — **identical across all assets** so nothing looks lit differently when composited.
- **Margins:** keep all art inside `x:120–904, y:80–1000` so nothing clips the canvas edge.

**Registration is the whole game:** because every layer is drawn on the same 1024² grid with the character in the same spot, the app composites them with a plain stack (no per-asset positioning code) and they line up perfectly.

> These pixel values are a **starting template**. Once the real canonical base is generated and frozen (§4), the founder locks the *actual* anchor pixel zones traced from that art. Mark them `LOCKED-ON-BASE`.

---

## 2. The Two Characters

Seek has **two distinct beaver characters**, handled differently:

| Character | Who | Customizable? | Treatment |
|---|---|---|---|
| **Player Beaver** | the user's own avatar — named, dressed, kept happy | **Yes** — **2 canonical bodies (male/female) × 3 colors** + 4 gacha cosmetic slots; **5 Happiness-state poses** | Full layered rig (§3–§6) + state poses (§4) |
| **Bucky** (rival) | the H2H NPC opponent when no friend can be paired (§7.9) | **No** — one fixed identity, **visually distinct** from the player beaver | Frozen base + expression states (§7) |

The layered-cosmetic system is for the **player beaver**. **Bucky** is one fixed design (a different-looking beaver) that only needs win/lose/idle expression variants — the same treatment the old mascot used, now reframed as the single recurring opponent NPC.

---

## 3. Player Beaver — Layer Stack & Z-Order (LOCKED)

The beaver renders as independent transparent layers composited **back-to-front** in this exact order:

```
z0  tail            (worn low/rear — sits BEHIND the body; the tail cosmetic reads around the lower silhouette)
z1  body (state)    (the canonical beaver body at its current Happiness state — see §4; 6 body-color recolor variants)
z2  gloves          (on the paws/hands — over the body's forepaws)
z3  eyes cosmetic   (over the face/eye line — front-most on the face: sunglasses / eyepatch / goggles / monocle / eye-shadow)
z4  hats            (over the head — top-most)
```

**Rules baked into the order:**
- **Tail behind body:** the body occludes the tail's inner edge; only the outer shape/tip reads — so a tail cosmetic fits any body color and any state without clipping the torso (same principle the old backpack used).
- **Gloves on the paws:** anchored to the forepaws, which sit slightly away from the body (§1), so a glove swap never disturbs the torso.
- **Eyes cosmetic over the face, hat over the head:** swapping a hat never disturbs the eyes; swapping an eyes item never disturbs the hat.
- **The `eyes` slot is a face accessory** (sunglasses/eyepatch/goggles/monocle/eye-shadow) worn over the beaver's own eyes — it is a cosmetic layer, not a "base eyes" variant (the beaver's eyes belong to the body/state pose).

Base always present (the body at its current state). Every cosmetic slot is optional; empty slot = that layer omitted. **Cosmetics composite identically on all 5 Happiness states** (§4).

---

## 4. Player Beaver — TWO Canonical Bodies + Color Recolors + Happiness States (freeze FIRST)

**Body = sex × color: male/female × Brown/White/Black = 6 distinct bodies** (spec §10.1, LOCKED 2026-07-13).

> ⚠️ **The single-universal-silhouette assumption does NOT hold for the body layer.** Male and female are **two genuinely different designs**, not recolors of each other. So there are **TWO frozen canonical bodies**, each with its own 3 color recolors. Everything downstream (cosmetics, states) must work against **both**.

1. **Produce candidates for BOTH canonical bodies** in the locked pose/canvas/style (aesthetic §5, §6): friendly beaver, buck teeth, neutral **Content** stance, paws slightly out, tail visible, front-facing, transparent 1024², no cosmetics. Founder picks one **male** winner and one **female** winner.
2. **Freeze both** as `beaver_body_male_canonical.png` and `beaver_body_female_canonical.png` (each = its Content/default state). These two silhouettes are now **immutable** — together they are the fit reference for every cosmetic and every state.
3. **🔒 THE CRITICAL CONSTRAINT — shared anchor registration.** The two canonical bodies **MUST place their anchors (head/crown line, eye line, forepaws, tail root) at the same canvas coordinates** (§5), even though their silhouettes differ. Design the female body *to the male's anchor grid* (or agree one grid and draw both to it).
   - **If the anchors match:** ONE 19-item cosmetic catalog fits **both** bodies. This is the goal.
   - **If the anchors drift:** every cosmetic needs a per-sex variant and **the catalog doubles to 38 items.** Avoid this. Differences should live in the body's *shape/features*, never in where a hat, glove, tail, or eyes accessory has to sit.
4. **Color variants = shape-identical recolors, WITHIN each body.** For each canonical body produce **3 recolors** — Brown / White / Black — as pure recolors: same exact silhouette, pose, shading; only color changes. (Recolor *within* a sex; never recolor *across* sexes.) → 2 bodies × 3 colors = **6 base bodies**.
5. **Happiness-state poses (5), per canonical body.** For each state — **Thriving, Content, Okay, Unhappy, Neglected** (spec §10.3) — produce a pose/expression variant **against that body's frozen base**, holding the §1 registration envelope (mood lives in face/ears/shoulders/tail-height, never in relocating anchors). Content = the frozen base itself. Each state is then recolored across that body's 3 colors.
   → Full base set: **2 sexes × 5 states × 3 colors = 30 body images.** Neglected uses **dull/desaturated** coloring but stays sympathetic (§6), never distressing.
6. **The beaver's own eyes belong to the body/state** (they carry the emotion), NOT to a cosmetic slot. The `eyes` **cosmetic** slot (§5) is a face accessory worn over them.

> Player "base customization" is therefore: **pick a sex + one of 3 colors.** Everything else on the beaver is a gacha cosmetic (§5). The 5 states are driven by Happiness at runtime, not chosen by the user.

---

## 5. Player Beaver — Anchor Zones per Slot (template; lock on base)

Four gacha slots (spec §10.2). Each cosmetic must be **isolated to a transparent layer and confined to its anchor zone** on the 1024² canvas. Starting template (trace exact zones from the frozen beaver base and mark `LOCKED-ON-BASE`; the beaver's proportions — big head, low tail — will shift these from the numbers below):

| Slot | Anchor zone (approx, 1024²) | Notes |
|---|---|---|
| hats | x 300–724, y 90–320 | over the head/crown; must sit on the head, not float; clears the ears |
| eyes | x 360–664, y 260–380 | face accessory over the eye line (sunglasses/eyepatch/goggles/monocle/eye-shadow) |
| gloves | x 250–774, y 520–760 | both forepaws/hands; paws sit slightly out from the body |
| tails | x 300–724, y 640–940 | low/rear; behind the body (z0); outer shape + tip read around the lower silhouette |

**Anchor rule:** an item may only occupy its zone; it must align to the same reference points every time — **on both canonical bodies (male AND female, §4), on all 3 colors, and across all 5 Happiness states.** A hat for slot `hats` must rest on the head at the same crown line on the male Thriving beaver and the female Neglected beaver alike — so any hat swaps cleanly on any body, color, or mood.

> **The zones above are the shared contract between the two canonical bodies.** Both bodies are drawn to this one grid. If a body cannot hit these anchors, fix the body — do not fork the cosmetic catalog (§4.3).

---

## 6. Player Beaver — The Generation/Production Recipe

For **each cosmetic** (repeat per item, one item per production — **never combine items**):

1. **Use the frozen beaver base as the reference** (`beaver_body_canonical.png`). This is the step that buys consistency — everything is produced *against the base*, not from a blank prompt. (Whoever/whatever makes the art, per the founder-curated model.)
2. **Spec pattern (keep phrasing consistent across all items):**
   > "Using the provided reference beaver exactly — identical body, pose, proportions, framing, scale, and art style — fit it with [ITEM DESCRIPTION]. [Aesthetic §5 style descriptor: stylized game-asset art, bold outline, cel-shading, warm earthy palette, top-left light.] Output on a transparent background at 1024×1024, the beaver in the exact same position as the reference."
3. **Isolate the item to its own transparent layer** confined to its anchor zone (§5): either (a) produce the item alone on transparent bg fitted to the reference, or (b) produce it worn on the base then mask/cut just the item. Isolation QA is the fiddly step — budget for it.
4. **Verify** the isolated layer composites correctly over the base in z-order (§3) and aligns to its anchor **on all 5 Happiness states** (§9 checklist). **Correct any drift** — misalignment compounds across the catalog.
5. **Keep it repeatable** (lock seeds / keep source files) so a single item can be re-made without disturbing the rest.
6. **Work in batches per slot** (all hats together, all tails together) and **review each slot as a set** so the style stays uniform within and across the 4 slots.

**Detail tier (from aesthetic §5):** cosmetics are *functional/repeated* UI shown at inventory scale — keep them **cleaner/simpler** than hero objects, still in-style, so they read at a glance and don't get noisy when many are shown.

---

## 7. Bucky (the rival H2H NPC) — Frozen Base + Expression States

**Bucky** is **one fixed character** (name LOCKED 2026-07-13) — a beaver **deliberately distinct from the player's beaver** (different build/palette/attitude) so "my beaver" and "Bucky" never read as the same. A single recurring rival, **not a pool**. He does **not** use the cosmetic-layer system and has **no Happiness states**. He needs the same *consistency* treatment via a frozen base + expression variants (exactly the treatment the old singular mascot used — now the opponent NPC).

1. **Produce 3–4 Bucky candidates** in the locked canvas/style, clearly distinct from both player bodies; founder picks; **freeze** as `bucky_canonical.png`. Identity is now fixed.
2. **All other Bucky images are produced against that frozen base** — the expression/pose is the *only* variable, so it's unmistakably the same Bucky each time.
3. **Required states** (spec §7.9, §13 — H2H opponent needs them):
   - `neutral` / idle (default)
   - `cheer` / win (beats the player)
   - `defeat` / lose (player beats it)
   - optional: `taunt` / ready (pre-match)
4. **Recipe** identical in spirit to §6: input frozen rival base, spec "the exact same beaver character, identical design/proportions/style, now [expression/pose]," transparent 1024², same framing. Batch all states together and review as a set for identity consistency.
5. Bucky is **not** customizable — no cosmetic slots, no Happiness states, no color variants. **Open (founder):** Bucky's final art only. Name and single-character scope are settled.

---

## 8. Hard Constraints Checklist (the "restrictions")

Every character asset MUST satisfy all of these. This is what keeps the beaver looking identical and cosmetics aligning:

- [ ] **Identical canvas:** 1024×1024, transparent, every asset.
- [ ] **Identical registration:** the beaver in the same position, scale, and pose in every asset (§1); Happiness states hold the anchor envelope.
- [ ] **Two canonical bodies, ONE anchor grid (§4):** male and female are different designs but hit the **same anchor coordinates**; colors are shape-identical recolors *within* each body.
- [ ] **Bucky:** one frozen design, clearly distinct from both player bodies.
- [ ] **Reference-conditioned:** every cosmetic, every Happiness state, and every Bucky state produced **against the relevant frozen base**, never from scratch.
- [ ] **Isolated layers:** each cosmetic is a standalone transparent asset, **confined to its anchor zone** (§5), nothing else in the frame.
- [ ] **Fixed z-order** respected (§3): tail behind body; gloves on paws; eyes accessory over the face; hat top-most.
- [ ] **Cosmetics valid everywhere:** each cosmetic composites cleanly on **both bodies**, all 3 colors, and all 5 Happiness poses.
- [ ] **Consistent lighting + style:** same light direction, outline, cel-shading, and earthy palette across all (aesthetic §5).
- [ ] **One item per production** — never a combination.
- [ ] **Transparent background** always; no baked-in shadow onto other layers (a soft contact shadow, if any, is its own optional layer).
- [ ] **Anchor alignment verified** against the frozen base before an asset is accepted.

---

## 9. QA / Consistency Validation (run before accepting a batch)

- **Overlay test:** stack base + one item from every slot; confirm everything aligns, nothing floats or clips.
- **Swap test:** swap each slot through several options; confirm **nothing else shifts** (hat swap doesn't move the eyes; glove swap doesn't move the tail).
- **State test:** composite a full cosmetic set on **all 5 Happiness states**; confirm every item still lands on its anchor on every mood.
- **Cross-body test (CRITICAL, §4.3):** composite the **same** cosmetic set on the **male** and **female** canonical bodies; confirm every item lands correctly on both. A failure here means forking the catalog — fix the body, not the cosmetics.
- **Silhouette test:** overlay the 3 color variants **within each body**; confirm the outline is **pixel-identical** (only color differs). (Do NOT expect male and female outlines to match — they are different designs by decision.)
- **Z-order test:** tail sits behind the body; gloves over the paws; eyes accessory over the face; hat over everything on the head.
- **Style test:** view each slot's items as a grid; confirm uniform outline weight, shading, and palette. Fix outliers.
- **Bucky identity test:** view all Bucky states side by side; confirm it's obviously the same Bucky (only expression changes) **and** obviously neither player body.
- **Edge test:** no art outside its anchor zone or past the canvas margins.

Fail any test → remake, don't patch. Misalignment and identity drift are cheap to fix at production time and expensive later.

---

## 10. How This Feeds the Build

- **Registry slots** (spec §4.2 / §14.3): each accepted layer drops into its named slot (`beaverBase/*` keyed by **sex × color × state**, `hats/*`, `tails/*`, `gloves/*`, `eyes/*`, `buckyNeutral`, `buckyCheer`, `buckyDefeat`, …). Swappable zero-code.
- **App compositing:** the client renders the beaver by stacking equipped layers in the z-order of §3 on the shared 1024² grid — a plain layer stack, no per-asset positioning, because registration guarantees alignment. The **body layer is selected by (sex × color × current Happiness state)**; cosmetics sit on top unchanged, identically for both sexes.
- **`avatar_config`** (spec §6, §10): stores the chosen **body sex + color** + equipped cosmetic id per gacha slot; the renderer maps each to its registry file. The Happiness **state** is derived from `profiles.happiness` at render time (not stored in `avatar_config`).
- **Milestone fit:** freeze the canonical **beaver base + the 5 state poses + the rival** first (anchors §1/§5 locked on the real art), then produce cosmetics against them. Beaver compositing + the state-selection logic are the M8 rework (spec §10); they run on placeholders until real art is supplied.

---

*Consistency is engineered, not hoped for: freeze the beaver base, produce against it, register everything to one grid, lock the anchors and z-order. Follow this and your beaver is always your beaver — on every mood, in every hat.*
