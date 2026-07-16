# Seek — Character Rig Bible (Consistent Character-Art Spec)

> **Purpose (character pivot, spec §10):** the player's avatar IS a **beaver**. This document guarantees that (a) the player's beaver looks like the *same character* across all **6 body-color variants** and all **5 Happiness states**, (b) every cosmetic (**hats, tails, gloves, eyes**) **aligns perfectly** on the shared beaver body in any combination and on any state, and (c) the **rival** beaver (the H2H NPC opponent, §7.9) holds one consistent identity, visually distinct from the player's beaver, across its expression states. This is the hard part of the art pipeline; naive per-asset production will produce misaligned, inconsistent output. Follow this exactly.
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
| **Player Beaver** | the user's own avatar — named, dressed, kept happy | **Yes** — **6 bodies (2 canonical silhouettes: male + female, × 3 colors)** + 4 gacha cosmetic slots; **5 Happiness-state poses** | Full layered rig (§3–§6) + state poses (§4) |
| **Rival Beaver — "Bucky"** | the H2H NPC opponent when no friend can be paired (§7.9) | **No** — one fixed identity, **visually distinct** from the player beaver | Frozen base + expression states (§7) |

The layered-cosmetic system is for the **player beaver**. The **rival is "Bucky"** — one fixed design (a different-looking beaver, decided 2026-07-16) that only needs win/lose/idle expression variants — the same treatment the old mascot used, now reframed as the opponent NPC.

---

## 3. Player Beaver — Layer Stack & Z-Order (LOCKED)

The beaver renders as independent transparent layers composited **back-to-front** in this exact order:

```
z0  tail            (worn low/rear — sits BEHIND the body; the tail cosmetic reads around the lower silhouette)
z1  body (state)    (the canonical beaver body at its current Happiness state — see §4; 6 bodies = 2 canonicals (male/female) × 3 colors)
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

## 4. Player Beaver — The Two Canonical Bodies + Body Colors + Happiness States (freeze FIRST)

> **Updated 2026-07-16 (§18 decision):** the female body is a **distinct design**, not a recolor of the male. There are now **two frozen canonical bodies** — `beaver_body_male_canonical.png` and `beaver_body_female_canonical.png` — each with its own silhouette/pose but the **same registration envelope + anchor zones** (§5), so one cosmetic drawn once fits **all six** bodies. Everything below applies **per canonical**.

Everything depends on the two frozen beaver bodies. Produce them before any cosmetic exists.

1. **Produce 3–4 candidates each** for the **male** and the **female** beaver body in the locked pose/canvas/style (aesthetic §5, §6): friendly beaver, buck teeth, neutral **Content** stance, paws slightly out, tail visible, front-facing, on transparent 1024², no cosmetics. The female body has its **own silhouette/design cues** (a real design difference, not a hue shift) but must keep every anchor point (§5) within the shared registration envelope. Founder **picks one winner per sex.**
2. **Freeze them** as `beaver_body_male_canonical.png` and `beaver_body_female_canonical.png` (each the Content/default state). Both silhouettes/poses are now **immutable** — the fit references for every cosmetic and every other state. **Anchor zones (§5) are traced once and MUST land identically on both** — verify a hat/eyes/gloves/tail item lands correctly on both canonicals before locking.
3. **Body-color variants = shape-identical recolors *within each sex*.** From each frozen canonical produce its **3 colors** — Brown, White, Black — as **pure recolors: same exact silhouette, pose, and shading, only color changes** (same discipline as "one crate recolored 5 ways"). Two canonicals × 3 colors = the **6 base bodies** (spec §10.1): Male Brown/White/Black, Female Brown/White/Black. Do NOT regenerate the body shape per color — color is the only variable *inside* a sex; the *silhouette* is the only variable *between* sexes.
4. **Happiness-state poses (5), per canonical.** For each state — **Thriving, Content, Okay, Unhappy, Neglected** (spec §10.3) — produce a pose/expression variant **against that sex's frozen base**, holding the §1 registration envelope (mood lives in face/ears/shoulders/tail-height, not in relocating anchors). Content = the frozen base itself. Each state is then recolored across its 3 colors → the state × color set per sex. Neglected uses **dull/desaturated** coloring but stays sympathetic (§6), never distressing.
5. **The beaver's own eyes belong to the body/state** (they carry the emotion), NOT to a cosmetic slot. The `eyes` **cosmetic** slot (§5) is a face accessory worn over them.

> Player "base customization" is therefore just: **pick sex (male/female) + one of the 3 body colors** = one of 6 bodies. Everything else on the beaver is a gacha cosmetic (§5). The 5 states are driven by Happiness at runtime, not chosen by the user.

---

## 5. Player Beaver — Anchor Zones per Slot (template; lock on base)

Four gacha slots (spec §10.2). Each cosmetic must be **isolated to a transparent layer and confined to its anchor zone** on the 1024² canvas. Starting template (trace exact zones from the frozen beaver base and mark `LOCKED-ON-BASE`; the beaver's proportions — big head, low tail — will shift these from the numbers below):

| Slot | Anchor zone (approx, 1024²) | Notes |
|---|---|---|
| hats | x 300–724, y 90–320 | over the head/crown; must sit on the head, not float; clears the ears |
| eyes | x 360–664, y 260–380 | face accessory over the eye line (sunglasses/eyepatch/goggles/monocle/eye-shadow) |
| gloves | x 250–774, y 520–760 | both forepaws/hands; paws sit slightly out from the body |
| tails | x 300–724, y 640–940 | low/rear; behind the body (z0); outer shape + tip read around the lower silhouette |

**Anchor rule:** an item may only occupy its zone; it must align to the same reference points on the frozen body every time, **and hold across all 5 Happiness states** (the states keep anchors within tolerance, §1). A hat for slot `hats` must rest on the head at the same crown line on Thriving and on Neglected — so any hat swaps cleanly on any mood.

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

## 7. Rival Beaver "Bucky" (H2H NPC) — Frozen Base + Expression States

The rival is **Bucky** — **one fixed character** (decided 2026-07-16, §18), a beaver **deliberately distinct from the player's beaver** (different build/palette/attitude) so "my beaver" and "Bucky" never read as the same. It does **not** use the cosmetic-layer system. It needs the same *consistency* treatment via a frozen base + expression variants (this is exactly the treatment the old singular mascot used — now the opponent NPC).

1. **Produce 3–4 Bucky candidates** in the locked canvas/style, distinct from the player beaver; founder picks; **freeze** as `rival_beaver_canonical.png`. Identity is now fixed.
2. **All other rival images are produced against that frozen base** — the expression/pose is the *only* variable, so it's unmistakably the same rival each time.
3. **Required states** (spec §7.9, §13 — H2H opponent needs them):
   - `neutral` / idle (default)
   - `cheer` / win (beats the player)
   - `defeat` / lose (player beats it)
   - optional: `taunt` / ready (pre-match)
4. **Recipe** identical in spirit to §6: input frozen rival base, spec "the exact same beaver character, identical design/proportions/style, now [expression/pose]," transparent 1024², same framing. Batch all states together and review as a set for identity consistency.
5. Bucky is **not** customizable — no cosmetic slots, no Happiness states. **Decided (2026-07-16, §7.9/§18):** one recurring rival named **Bucky** (not a set). Only its design/art remains founder-supplied.

---

## 8. Hard Constraints Checklist (the "restrictions")

Every character asset MUST satisfy all of these. This is what keeps the beaver looking identical and cosmetics aligning:

- [ ] **Identical canvas:** 1024×1024, transparent, every asset.
- [ ] **Identical registration:** the beaver in the same position, scale, and pose in every asset (§1); Happiness states hold the anchor envelope.
- [ ] **Canonical silhouettes:** the player beaver has **two** frozen canonicals (male + female, distinct designs sharing one registration envelope); each is recolored into its 3 colors (shape-identical *within* a sex); Bucky has one frozen design, distinct from the player beaver.
- [ ] **Reference-conditioned:** every cosmetic, every Happiness state, and every rival state produced **against the frozen base**, never from scratch.
- [ ] **Isolated layers:** each cosmetic is a standalone transparent asset, **confined to its anchor zone** (§5), nothing else in the frame.
- [ ] **Fixed z-order** respected (§3): tail behind body; gloves on paws; eyes accessory over the face; hat top-most.
- [ ] **Cosmetics valid on every state:** each cosmetic composites cleanly on all 5 Happiness poses.
- [ ] **Consistent lighting + style:** same light direction, outline, cel-shading, and earthy palette across all (aesthetic §5).
- [ ] **One item per production** — never a combination.
- [ ] **Transparent background** always; no baked-in shadow onto other layers (a soft contact shadow, if any, is its own optional layer).
- [ ] **Anchor alignment verified** against the frozen base before an asset is accepted.

---

## 9. QA / Consistency Validation (run before accepting a batch)

- **Overlay test:** stack base + one item from every slot; confirm everything aligns, nothing floats or clips.
- **Swap test:** swap each slot through several options; confirm **nothing else shifts** (hat swap doesn't move the eyes; glove swap doesn't move the tail).
- **State test:** composite a full cosmetic set on **all 5 Happiness states**; confirm every item still lands on its anchor on every mood.
- **Silhouette test:** *within each sex,* overlay its 3 body-color variants; confirm the outline is **pixel-identical** (only color differs). Across sexes the silhouettes differ by design — but overlay male vs. female and confirm every **anchor zone** (§5) still lands in the same place (cosmetics must fit both).
- **Z-order test:** tail sits behind the body; gloves over the paws; eyes accessory over the face; hat over everything on the head.
- **Style test:** view each slot's items as a grid; confirm uniform outline weight, shading, and palette. Fix outliers.
- **Rival identity test:** view all rival states side by side; confirm it's obviously the same rival beaver (only expression changes) **and** obviously not the player beaver.
- **Edge test:** no art outside its anchor zone or past the canvas margins.

Fail any test → remake, don't patch. Misalignment and identity drift are cheap to fix at production time and expensive later.

---

## 10. How This Feeds the Build

- **Registry slots** (spec §4.2 / §14.3): each accepted layer drops into its named slot (`beaverBody{Sex}{Color}` per the 6 bodies, the 5 state poses per sex, `hats/*`, `tails/*`, `gloves/*`, `eyes/*`, `rivalBeaver` = Bucky, `rival_cheer`, etc.). Swappable zero-code.
- **App compositing:** the client renders the beaver by stacking equipped layers in the z-order of §3 on the shared 1024² grid — a plain layer stack, no per-asset positioning, because registration guarantees alignment. The **body layer is selected by (sex × body color × current Happiness state)**; cosmetics sit on top unchanged (they fit both canonicals by the shared anchor envelope).
- **`avatar_config`** (spec §6, §10): stores the chosen **sex + body color** + equipped cosmetic id per gacha slot; the renderer maps each to its registry file. The Happiness **state** is derived from `profiles.happiness` at render time (not stored in `avatar_config`).
- **Milestone fit:** freeze the canonical **beaver base + the 5 state poses + the rival** first (anchors §1/§5 locked on the real art), then produce cosmetics against them. Beaver compositing + the state-selection logic are the M8 rework (spec §10); they run on placeholders until real art is supplied.

---

*Consistency is engineered, not hoped for: freeze the beaver base, produce against it, register everything to one grid, lock the anchors and z-order. Follow this and your beaver is always your beaver — on every mood, in every hat.*
