# Seek — Character Rig Bible (Consistent Generation Spec)

> **Purpose:** guarantee that (a) the beaver mascot looks like the *same character* every time it appears, and (b) every customizable-avatar cosmetic (hats, pants, jackets, etc.) **aligns perfectly** on the shared body when equipped in any combination. This is the hard part of the art pipeline; naive per-asset generation will produce misaligned, inconsistent output. Follow this exactly.
> **Companion to:** `SEEK_ART_AND_AESTHETIC_DIRECTION.md` (the look) and `SEEK_MVP_BUILD_SPEC_V2.md` (the build). This document is a **hard constraint on the asset-generation pass (spec §14 / milestone M12)**.
> **Generation tool:** nano banana (Gemini image model), used **build/admin-time only, key server-side** (never in the shipped app).

---

## 0. The Core Principle (read first)

Image generators are **stochastic** — the same prompt yields a slightly different character each time (proportions, pose, eye position all drift). That is fatal for a layered avatar. The fix is a single non-negotiable idea:

> **Freeze one canonical base, then generate everything else *against that frozen base as a reference image* — never from a fresh text prompt.**

Consistency does **not** come from clever prompt wording. It comes from:
1. **A frozen base image** that never changes.
2. **Reference-conditioned generation** (image-to-image): every cosmetic and every mascot pose is produced by feeding the frozen base *in* as the reference, so the model draws onto *this exact character*.
3. **A fixed canvas + registration** so all layers share one coordinate grid and stack in alignment by construction.
4. **Defined anchor zones + locked z-order** so swaps never shift anything.

Everything below implements those four ideas.

---

## 1. Canvas & Registration Spec (applies to EVERY asset)

Every asset — base, skin variants, eyes, hair, all 8 cosmetic slots, mascot, mascot expressions — is produced on an **identical canvas**:

- **Dimensions:** `1024 × 1024 px`, square, **transparent background** (PNG with alpha). (Export to app at @1x/@2x/@3x as needed; the master is 1024².)
- **Character placement (registration) — identical every time:**
  - Character is **centered horizontally**, occupying roughly the central column `x: 256–768`.
  - **Standing, front-facing (or a fixed 3/4), neutral stance**, arms slightly away from the body so torso cosmetics have clean edges.
  - **Head top ≈ y:100**, **feet bottom ≈ y:980**. Same scale, same pose, same position in every single generation.
- **Lighting:** one fixed light direction (recommend top-left) and the cel-shading style from aesthetic §5 — **identical across all assets** so nothing looks lit differently when composited.
- **Margins:** keep all art inside `x:120–904, y:80–1000` so nothing clips the canvas edge.

**Registration is the whole game:** because every layer is drawn on the same 1024² grid with the character in the same spot, the app composites them with a plain stack (no per-asset positioning code) and they line up perfectly.

> These pixel values are a **starting template**. Once the real canonical base is generated and frozen (§4), the founder locks the *actual* anchor pixel zones traced from that art. Mark them `LOCKED-ON-BASE`.

---

## 2. The Two Characters

Seek has **two distinct characters**, handled differently:

| Character | Who | Customizable? | Treatment |
|---|---|---|---|
| **Player Hiker Avatar** | the human hiker the user builds and dresses | **Yes** — base (skin/eyes/hair) + 8 gacha cosmetic slots | Full layered rig (§3–§6) |
| **Beaver Mascot** | Seek's brand character / default H2H opponent | **No** — one fixed identity + fixed hiking outfit | Frozen base + expression states (§7) |

The layered-cosmetic system is for the **hiker**. The **beaver** is one fixed design that only needs pose/expression variants.

---

## 3. Player Avatar — Layer Stack & Z-Order (LOCKED)

The avatar renders as independent transparent layers composited **back-to-front** in this exact order:

```
z0  backpack        (worn on back — sits BEHIND the body; pack/straps read around the torso)
z1  body (skin)     (the canonical hiker body — see §4; skin-tone recolor variants)
z2  eyes            (variant layer)
z3  hair            (variant layer, behind hat)
z4  pants           (lower body, over the body's legs)
z5  shirt           (upper body, over the torso)
z6  jacket          (over shirt — FULLY OCCLUDES the shirt: the jacket-closed rule)
z7  boots           (over feet + pants cuffs)
z8  hats            (over hair / head)
z9  sunglasses      (over eyes / face — front-most on the face)
z10 pet             (companion beside the hiker — own side anchor, minimal body overlap)
```

**Rules baked into the order:**
- **Jacket-closed rule (LOCKED):** when a jacket is equipped it draws over and *hides* the shirt — so **no shirt×jacket combination art is ever needed**. Each is a standalone layer.
- **Hat over hair, sunglasses over eyes:** swapping a hat never disturbs the face; swapping hair never disturbs a hat's position.
- **Backpack behind body:** the body occludes the pack's center; only the silhouette/straps show — so the pack fits any body without clipping the torso.
- **Pet is positioned to the side** with little/no overlap, so it never interferes with the body stack.

Base always present (body + a default eyes/hair). Every cosmetic slot is optional; empty slot = that layer omitted.

---

## 4. Player Avatar — The Canonical Body (freeze this FIRST)

Everything depends on one frozen body. Produce it before any cosmetic exists.

1. **Generate 3–4 candidates** (text-to-image) of the hiker body in the locked pose/canvas/style (aesthetic §5): neutral hiker, no gear beyond a minimal base outfit, arms slightly out, front-facing, on transparent 1024². Founder **picks one winner.**
2. **Freeze it** as `avatar_body_canonical.png`. This silhouette/pose is now **immutable** — it is the fit reference for every cosmetic.
3. **Skin-tone variants = shape-identical recolors.** Produce ~5 skin tones (`TUNE` count) as **pure recolors of the frozen body — same exact silhouette, pose, and shading, only hue changes** (same discipline as "one crate recolored 5 ways"). Because the silhouette is identical across all skin variants, **any cosmetic fits all of them.** Do NOT regenerate the body shape per skin tone — recolor only.
4. **Eyes** = a small set of variant layers (`TUNE`, e.g. 3–5), each generated against the frozen base, isolated to the eye anchor zone.
5. **Hair** = hairstyle layers (`TUNE`, e.g. 5–6 styles), each generated against the frozen base, isolated to the hair anchor zone; **hair color = recolor** of each style (e.g. 5 colors) so styles × colors stays a recolor operation, not fresh generation.

> Player "base customization" (skin/eyes/hair/hair-color) is therefore: pick a skin recolor + an eyes variant + a hair style + a hair-color recolor. All share the one frozen silhouette.

---

## 5. Player Avatar — Anchor Zones per Slot (template; lock on base)

Each cosmetic must be **isolated to a transparent layer and confined to its anchor zone** on the 1024² canvas. Starting template (trace exact zones from the frozen base and mark `LOCKED-ON-BASE`):

| Slot | Anchor zone (approx, 1024²) | Notes |
|---|---|---|
| hair | x 300–724, y 100–300 | behind hat; crown + sides |
| hats | x 290–734, y 80–290 | over hair; must sit on the head, not float |
| sunglasses | x 360–664, y 190–280 | over the eye line |
| eyes | x 380–644, y 200–270 | base layer variant |
| shirt | x 300–724, y 330–580 | torso |
| jacket | x 290–734, y 320–630 | torso + upper arms; occludes shirt |
| backpack | x 280–744, y 320–620 | behind body; pack + straps |
| pants | x 320–704, y 560–860 | hips → ankles |
| boots | x 330–694, y 820–980 | feet + lower pant cuff overlap |
| pet | x 700–920, y 720–970 | side companion; minimal body overlap |

**Anchor rule:** an item may only occupy its zone; it must align to the same reference points on the frozen body every time. A hat generated for slot `hats` must rest on the head at the same crown line as every other hat — so any hat swaps cleanly.

---

## 6. Player Avatar — The nano banana Generation Recipe

For **each cosmetic** (repeat per item, one item per generation — **never generate a combination**):

1. **Input the frozen base as the reference image** (`avatar_body_canonical.png`). This is the step that buys consistency — it's image-to-image (edit the base), not fresh text-to-image.
2. **Prompt pattern (keep phrasing consistent across all items):**
   > "Using the provided reference character exactly — identical body, pose, proportions, framing, scale, and art style — dress it in [ITEM DESCRIPTION]. [Aesthetic §5 style descriptor: stylized game-asset art, bold outline, cel-shading, warm earthy palette, top-left light.] Output on a transparent background at 1024×1024, the character in the exact same position as the reference."
3. **Isolate the item to its own transparent layer** confined to its anchor zone: either (a) prompt for the garment alone on transparent bg fitted to the reference, or (b) generate it worn on the base then mask/cut just the item (background/base removal pass). Isolation QA is the fiddly step — budget for it.
4. **Verify** the isolated layer composites correctly over the base in z-order and aligns to its anchor (§8 checklist). **Regenerate any drift** — don't accept a near-miss; misalignment compounds across the catalog.
5. **Lock the seed** if the API exposes it, for repeatable regenerations.
6. **Work in batches per slot** (all hats together, all jackets together) and **review each slot as a set** so the style stays uniform within and across slots.

**Detail tier (from aesthetic §5):** cosmetics are *functional/repeated* UI shown at inventory scale — keep them **cleaner/simpler** than hero objects, still in-style, so they read at a glance and don't get noisy when many are shown.

---

## 7. Beaver Mascot — Frozen Base + Expression States

The beaver is **one fixed character** (buck teeth, hiking gear — bandana and/or small pack/hat per aesthetic §6). It does **not** use the cosmetic-layer system. It needs the same *consistency* treatment via a frozen base + pose/expression variants.

1. **Generate 3–4 mascot candidates** (text-to-image) in the locked canvas/style; founder picks; **freeze** as `mascot_beaver_canonical.png`. Identity is now fixed.
2. **All other mascot images are generated against that frozen base as reference** — the expression/pose is the *only* variable, so it's unmistakably the same beaver each time.
3. **Required states** (spec §7.9, §13 — H2H opponent needs them):
   - `neutral` / idle (default)
   - `cheer` / win (beats the player)
   - `defeat` / lose (player beats it)
   - optional: `taunt` / ready (pre-match)
4. **Recipe** identical in spirit to §6: input frozen mascot base, prompt "the exact same beaver character, identical design/outfit/proportions/style, now [expression/pose]," transparent 1024², same framing. Batch all states together and review as a set for identity consistency.
5. The mascot's outfit is **fixed** — it is not swappable. (If the founder later wants seasonal mascot skins, that's a recolor/variant task, not the player cosmetic system.)

---

## 8. Hard Constraints Checklist (the "restrictions")

Every generated character asset MUST satisfy all of these. This is what keeps the beaver looking identical and cosmetics aligning:

- [ ] **Identical canvas:** 1024×1024, transparent, every asset.
- [ ] **Identical registration:** character in the same position, scale, and pose in every asset (§1).
- [ ] **One canonical silhouette per character:** all player skin tones are shape-identical recolors of the one frozen body; the mascot has one frozen design.
- [ ] **Reference-conditioned:** every cosmetic and every mascot state generated **against the frozen base** (image-to-image), never fresh text-to-image.
- [ ] **Isolated layers:** each cosmetic is a standalone transparent asset, **confined to its anchor zone** (§5), nothing else in the frame.
- [ ] **Fixed z-order** respected (§3); **jacket occludes shirt**.
- [ ] **Consistent lighting + style:** same light direction, outline, cel-shading, and earthy palette across all (aesthetic §5) — nothing looks lit or styled differently.
- [ ] **One item per generation** — never a combination.
- [ ] **Transparent background** always; no baked-in shadow onto other layers (a soft contact shadow, if any, is its own optional layer).
- [ ] **Anchor alignment verified** against the frozen base before an asset is accepted.

---

## 9. QA / Consistency Validation (run before accepting a batch)

- **Overlay test:** stack base + one item from every slot; confirm everything aligns, nothing floats or clips.
- **Swap test:** swap each slot through several options; confirm **nothing else shifts** (hat swap doesn't move the face; pants swap doesn't move boots).
- **Silhouette test:** overlay all skin-tone variants; confirm the outline is **pixel-identical** (only color differs).
- **Z-order test:** equip jacket → shirt is hidden; equip hat → sits over hair; sunglasses → over eyes.
- **Style test:** view each slot's items as a grid; confirm uniform outline weight, shading, and palette. Regenerate outliers.
- **Mascot identity test:** view all mascot states side by side; confirm it's obviously the same beaver (same teeth, proportions, outfit), only expression changes.
- **Edge test:** no art outside its anchor zone or past the canvas margins.

Fail any test → regenerate, don't patch. Misalignment and identity drift are cheap to fix at generation time and expensive later.

---

## 10. How This Feeds the Build

- **Registry slots** (spec §4.2 / §14.3): each accepted layer drops into its named slot (`hair/*`, `hats/*`, `jacket/*`, `mascotAvatar`, `mascot_cheer`, etc.). Swappable zero-code.
- **App compositing:** the client renders the avatar by stacking equipped layers in the z-order of §3 on the shared 1024² grid — a plain layer stack, no per-asset positioning, because registration guarantees alignment.
- **`avatar_config`** (spec §6, §10): stores the chosen skin recolor + eyes + hair style + hair color + equipped cosmetic id per slot; the renderer maps each to its registry file.
- **Milestone fit:** freeze the canonical **base + mascot first** in M12 (anchors chosen, §1/§5 locked on the real art), then batch-generate cosmetics and mascot states against them. Avatar compositing lands in M8 but can run on placeholders until M12 art is ready.

---

*Consistency is engineered, not hoped for: freeze the base, generate against it, register everything to one grid, lock the anchors and z-order. Follow this and the beaver is always the beaver, and every hat fits every head.*
