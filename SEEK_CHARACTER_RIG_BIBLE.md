# Seek — Character Rig Bible (Consistent Character-Art Spec)

> **Purpose (character pivot, spec §10):** the player's avatar IS a **beaver**. This document guarantees that (a) the player's beaver looks like the *same character* across all **6 body-color variants** and all **5 Happiness states**, (b) every cosmetic (**hats, tails, gloves, eyes**) **aligns perfectly** on the shared beaver body in any combination and on any state, and (c) the **rival** beaver (the H2H NPC opponent, §7.9) holds one consistent identity, visually distinct from the player's beaver, across its expression states. This is the hard part of the art pipeline; naive per-asset production will produce misaligned, inconsistent output. Follow this exactly.
> **Companion to:** `SEEK_ART_AND_AESTHETIC_DIRECTION.md` (the look) and `SEEK_MVP_BUILD_SPEC_V2.md` (the build). This document is a **hard constraint on the asset pass (spec §14 / milestone M12)**.
> **Who this binds (revised 2026-07-16):** these rig/layering/z-order/placement rules constrain **whatever tool or artist produces the character assets** — the art is now **hand-drawn** and arrives as founder-supplied final files; there is **no automated in-app or build-time generation pipeline and no server-side API call**. Where this document says "produce against the frozen base," read it as an instruction to the asset producer, whoever that is — the frozen base, the composite canvas, per-item placement data (§5), and consistent registration apply identically to generated and hand-made art.

---

## 0. The Core Principle (read first)

Image generators are **stochastic** — the same prompt yields a slightly different character each time (proportions, pose, eye position all drift). That is fatal for a layered avatar. The fix is a single non-negotiable idea:

> **Freeze one canonical base, then generate everything else *against that frozen base as a reference image* — never from a fresh text prompt.**

Consistency does **not** come from clever prompt wording. It comes from:
1. **A frozen base image** that never changes.
2. **Reference-conditioned production** (against the base): every cosmetic, every Happiness-state pose, and every rival state is produced by working *from* the frozen base, so the art stays *this exact character*.
3. **A fixed composite canvas + registration** so all layers share one coordinate grid. With hand-drawn, cropped-tight assets, alignment comes from each item's **recorded placement** (§5) rather than from every export sharing identical framing — but the grid, and the requirement that one placement hold everywhere, are unchanged.
4. **Per-item placement data + locked z-order** so swaps never shift anything: an item's position/scale/rotation is captured **once, in Placement Studio (§5)**, and is then permanent.

Everything below implements those four ideas.

---

## 1. Canvas & Registration Spec (applies to EVERY asset)

> **Updated 2026-07-16 (hand-drawn pivot):** assets are no longer exported on a shared full-size canvas. Each file is **cropped tight to its content** at its natural size; the shared grid exists only at **composite time**.

- **The composite canvas:** the assembled avatar is a `1024 × 1024 px` square with a **transparent background** — this box, no background, IS the avatar wherever the app shows it. All placement data (§5) is expressed in this canvas's pixel coordinates.
- **Asset exports — cropped tight, transparent PNG:**
  - **Bodies** (each sex × color × Happiness state, §4): cropped tight to the beaver. The renderer and Placement Studio always draw the body **centered** in the composite canvas — bodies never take an x/y offset; "centered" is the rule. Because body exports can differ in natural size, a body may carry an optional **scale** in the placement data (set in Placement Studio, like everything else) so all bodies read as one beaver size.
  - **Cosmetics:** cropped tight to the item, natural size (drawn at the correct scale relative to the body wherever possible; Placement Studio can correct scale, but the closer the export, the better).
- **Pose (the frozen bases, §4):** **standing, front-facing (or a fixed 3/4), neutral stance**, **paws/arms slightly away from the body** so glove cosmetics have clean edges; **tail visible** (peeking at the lower/side silhouette) so a tail cosmetic has a defined footprint.
- **Happiness-state registration envelope:** the 5 emotional states (§4) are expression + subtle posture shifts that **must keep head, eye, paw, and tail positions within tolerance** of the neutral base — one saved placement per cosmetic must composite acceptably across all five states (and both sexes). A state that moves the head or paws far enough to break saved placements needs per-state handling — avoid it; keep the mood in the face/ears/shoulders, not in relocating the whole body. Cropped-tight state exports must also keep the **crop centered the same way** (the body is auto-centered, so a state whose crop shifts off-center shifts the whole beaver).
- **Lighting:** one fixed light direction (recommend top-left) and the cel-shading style from aesthetic §5 — **identical across all assets** so nothing looks lit differently when composited.

**Registration is still the whole game — it just moved:** instead of every export sharing identical framing, each item's position on the 1024² grid is **captured once in Placement Studio (§5) and locked**. The app composites the auto-centered body + each cosmetic at its recorded placement, in z-order (§3), and they line up on every body and every state because the placement was verified against all of them in the tool.

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

**Per-item z override (2026-07-16):** the slot order above is the **default**. If a specific item needs to stack differently (e.g. a hat that should tuck behind an eyes item), its z can be overridden per item in Placement Studio (§5); the override is stored in that item's placement data and applies wherever the item renders. Overrides are the exception — most items never need one.

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

## 5. Player Beaver — Per-Item Placement Data (Placement Studio)

> **Replaces the fixed anchor zones (2026-07-16, founder-directed).** Shared per-slot rectangles assumed generated art produced *to* those zones. Hand-drawn items each have their own natural size, shape, and sit-point — a Beanie and a Crown don't rest on the head the same way; a Gold Tail and a Bow Tail don't hang the same way. So placement is now **captured per item, once, by hand**, instead of prescribed per slot.

**The tool — Placement Studio** (`tools/placement-studio/index.html`): an internal desktop-browser utility, **not part of the shipped app**. It shows the beaver body fixed and auto-centered on the 1024² composite canvas; the founder drops in cropped-tight cosmetic PNGs, drags/nudges each into position (with scale and rotation available), layers multiple items simultaneously to preview real combinations, adjusts a specific item's z if the default slot order stacks wrong, swaps in other bodies/states to confirm the placement holds everywhere, and **saves**. Saving locks the item's placement data — that placement is now as frozen as the art itself.

**The data — `assets/art/beaver-placement.json`** (checked into the repo, versioned with the art it describes):

```json
{
  "canvas": 1024,
  "items": {
    "cosHatsCrown": { "x": -12, "y": -38, "scale": 1.06, "rotation": -3, "w": 512, "h": 384, "z": 4 }
  }
}
```

- Keyed by the item's **registry `asset_slot_name`** (the same key the cosmetics DB row carries).
- `x`/`y` — offset of the item's center from the canvas center, in canvas pixels. `w`/`h` — the file's natural pixel size (recorded automatically at save). `scale` (default 1) and `rotation` (degrees, default 0) — omitted when default. `z` — only present when overriding the slot default (§3).
- **Bodies** get entries too (keyed `beaverBody{Sex}{Color}{State}`): always `x:0, y:0` (centered is the rule) with an optional `scale` to normalize differing export sizes — never rotation or z.
- An item **absent** from the file renders as a full-canvas registered layer (the legacy default) — placement data can land incrementally.

**Placement rule (the anchor rule's successor):** each item gets **one** placement, and that placement must read correctly on **all 5 Happiness states and both sex silhouettes** — verified in the tool by swapping bodies before saving. A hat must rest on the crown on Thriving and on Neglected alike. If a placement can't hold across states, the *state pose* is out of envelope (§1) — fix the art, don't fork the placement.

---

## 6. Player Beaver — The Generation/Production Recipe

For **each cosmetic** (repeat per item, one item per production — **never combine items**):

1. **Use the frozen beaver base as the reference** (`beaver_body_canonical.png`). This is the step that buys consistency — everything is produced *against the base*, not from a blank prompt. (Whoever/whatever makes the art, per the founder-curated model.)
2. **Spec pattern (keep phrasing consistent across all items):**
   > "Using the provided reference beaver exactly — identical body, pose, proportions, scale, and art style — fit it with [ITEM DESCRIPTION]. [Aesthetic §5 style descriptor: stylized game-asset art, bold outline, cel-shading, warm earthy palette, top-left light.] Deliver the item alone, cropped tight, on a transparent background, at the correct scale relative to the reference body."
3. **Export the item cropped tight on its own transparent layer** — just the item at its natural size, nothing else in the frame, drawn at the correct scale relative to the body wherever possible (Placement Studio can correct scale, but the closer the export, the better).
4. **Place it in Placement Studio (§5)** and verify it composites correctly in z-order (§3) **on all 5 Happiness states and both sexes** (§9 checklist), then save its placement data. **Correct any drift in the art, not by forking placements** — misalignment compounds across the catalog.
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

- [ ] **Transparent, cropped-tight exports** (§1); the composite canvas is 1024×1024 and all placement data speaks its coordinates.
- [ ] **Consistent registration:** bodies keep the same scale, pose, and crop-centering in every state/color (§1) so the auto-centered body never jumps; Happiness states hold the registration envelope.
- [ ] **Canonical silhouettes:** the player beaver has **two** frozen canonicals (male + female, distinct designs sharing one registration envelope); each is recolored into its 3 colors (shape-identical *within* a sex); Bucky has one frozen design, distinct from the player beaver.
- [ ] **Reference-conditioned:** every cosmetic, every Happiness state, and every rival state produced **against the frozen base**, never from scratch.
- [ ] **Isolated layers:** each cosmetic is a standalone transparent asset **cropped tight to the item**, nothing else in the frame.
- [ ] **Placement captured:** every cosmetic has its placement saved from Placement Studio (§5) and verified across states/sexes before acceptance.
- [ ] **Default z-order** respected (§3): tail behind body; gloves on paws; eyes accessory over the face; hat top-most — per-item overrides only where a specific item demands it.
- [ ] **Cosmetics valid on every state:** each cosmetic composites cleanly on all 5 Happiness poses.
- [ ] **Consistent lighting + style:** same light direction, outline, cel-shading, and earthy palette across all (aesthetic §5).
- [ ] **One item per production** — never a combination.
- [ ] **Transparent background** always; no baked-in shadow onto other layers (a soft contact shadow, if any, is its own optional layer).

---

## 9. QA / Consistency Validation (run before accepting a batch)

All of these run **inside Placement Studio** (§5) before an asset's placement is saved:

- **Overlay test:** stack base + one item from every slot; confirm everything aligns, nothing floats or clips.
- **Swap test:** swap each slot through several options; confirm **nothing else shifts** (hat swap doesn't move the eyes; glove swap doesn't move the tail — each item's placement is independent by construction).
- **State test:** composite a full cosmetic set on **all 5 Happiness states**; confirm every item's saved placement still reads correctly on every mood.
- **Silhouette test:** *within each sex,* overlay its 3 body-color variants; confirm the outline is **pixel-identical** (only color differs) and the crops are centered identically. Across sexes the silhouettes differ by design — but swap male ↔ female under a full cosmetic set and confirm every item's placement still lands correctly (cosmetics must fit both).
- **Z-order test:** tail sits behind the body; gloves over the paws; eyes accessory over the face; hat over everything on the head.
- **Style test:** view each slot's items as a grid; confirm uniform outline weight, shading, and palette. Fix outliers.
- **Rival identity test:** view all rival states side by side; confirm it's obviously the same rival beaver (only expression changes) **and** obviously not the player beaver.
- **Edge test:** no placed item extends past the composite canvas edge (the tool shows the 1024² bounds).

Fail any test → remake, don't patch. Misalignment and identity drift are cheap to fix at production time and expensive later.

---

## 10. How This Feeds the Build

- **Registry slots** (spec §4.2 / §14.3): each accepted layer drops into its named slot (`beaverBody{Sex}{Color}` per the 6 bodies, the 5 state poses per sex, `hats/*`, `tails/*`, `gloves/*`, `eyes/*`, `rivalBeaver` = Bucky, `rival_cheer`, etc.). Swappable zero-code.
- **App compositing:** the client renders the beaver on the 1024² composite grid — the **body layer, selected by (sex × body color × current Happiness state)**, auto-centered; each equipped cosmetic drawn at its recorded placement from `assets/art/beaver-placement.json` (center-offset/scale/rotation, scaled to the render size), stacked in the z-order of §3 with any per-item override. An item with no placement entry renders as a full-canvas registered layer (legacy default).
- **`avatar_config`** (spec §6, §10): stores the chosen **sex + body color** + equipped cosmetic id per gacha slot; the renderer maps each to its registry file. The Happiness **state** is derived from `profiles.happiness` at render time (not stored in `avatar_config`).
- **Milestone fit:** freeze the canonical **beaver base + the 5 state poses + the rival** first, then produce cosmetics against them and **place each one in Placement Studio (§5)** as it's accepted. Beaver compositing + the state-selection logic are the M8 rework (spec §10); they run on placeholders until real art + placement data are supplied.

---

*Consistency is engineered, not hoped for: freeze the beaver base, produce against it, register everything to one grid, lock each item's placement and the z-order. Follow this and your beaver is always your beaver — on every mood, in every hat.*
