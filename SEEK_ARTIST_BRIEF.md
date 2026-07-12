# Seek — Character Art Commission Brief

> ⚠️ **SUPERSEDED (2026-07-12 character pivot).** This brief describes the
> retired **hiker** avatar (skin/eyes/hair + 8 clothing slots + a separate fixed
> beaver mascot). That system no longer exists. The player avatar is now a
> **customizable beaver** (6 body colors + 4 gacha slots: hats/tails/gloves/eyes
> + 5 Happiness-state poses) and the H2H opponent is a distinct **rival beaver**.
> See `SEEK_MVP_BUILD_SPEC_V2.md` §10, `SEEK_ART_AND_AESTHETIC_DIRECTION.md` §6,
> and `SEEK_CHARACTER_RIG_BIBLE.md` for the current design. **Do not commission
> from this document as-is** — it is kept only for history until a new
> beaver-kit brief is written. The rig/registration principles below still hold;
> the specific slot list, skin tones, hairstyles, and outfit do not.

> **What this is (historical):** the complete brief for drawing Seek's player-avatar
> character kit (and optionally the beaver mascot). Everything the artist
> needs is in this one document. It condenses `SEEK_CHARACTER_RIG_BIBLE.md`
> (rig/registration rules) and `SEEK_ART_AND_AESTHETIC_DIRECTION.md` (look)
> into a work order — those documents win if anything here seems ambiguous.
> **App-side contact:** the founder (smokeysummitmedia@gmail.com).

---

## 1. The product, in three sentences

Seek is an iOS social-challenge game: one real-world challenge a day, friends
compete head-to-head, winners earn coins and gacha crates containing **outfit
cosmetics for their hiker avatar**. The avatar is a paper-doll: one shared
body, and every cosmetic is a **separate transparent layer** that must align
perfectly on that body in any combination. The app composites the layers as a
plain image stack — so **registration is everything**: every file shares one
canvas and one character position.

## 2. Style

**Stylized mobile-game asset art** — bold confident dark outlines,
cel-shading (flat light/shadow planes, no soft gradients), warm earthy
palette, top-left key light, chunky tactile craft in the Clash Royale /
Brawl Stars family. **Not** flat-minimal, **not** realistic/3D, **not**
pastel.

- Character concept: a friendly, capable **hiker** (tee, cargo shorts,
  hiking boots as the base outfit).
- Cosmetics are shown small (inventory tiles) — keep them **cleaner/simpler**
  than hero art so they read at a glance; same style family, dialed down.
- **Style references supplied with this brief:** the current placeholder
  character kit (`assets/art/` — hiker, five crates, mountain, beaver, four
  hats). Match the *craft level and palette*; the artist's own character
  design is welcome and expected to be better — that's the point of the
  commission.

**Palette (roles, hex):** cream `#F5ECE3` (bg) · jungle green `#233837` ·
rifle green `#3D4625` · russian green `#779F6F` · shelduck blue `#B5D7CC` ·
cadmium orange `#EC8340` (action/win) · vermillon `#D45735` · indian yellow
`#ECA945` (celebration/gold) · bice blue `#2774B4` (info) · chestnut
`#A44F3C` · dark sienna `#401D15` (deep shadow).
**Rarity ladder (cosmetic color language):** common → greens · rare → bice
blue · epic → vermillon/chestnut · legendary → gold/indian yellow.

## 3. Canvas & registration (hard requirements)

- **1024 × 1024 px, transparent background, PNG** — every single file.
- Character **centered**, standing, front-facing, neutral stance, **arms
  slightly away from the body** (clean torso edges for garments).
- **Identical position, scale, and pose in every file.** Head top ≈ y 100,
  feet bottom ≈ y 980, all art inside x 120–904 / y 80–1000. Once the body
  is approved, its exact silhouette is FROZEN — every layer is drawn over
  that frozen body in the source file and exported in place.
- **One fixed light direction (top-left)** across all files.
- No baked drop-shadows/ground contact on any layer.
- **Layered source file required** (PSD/Procreate/CSP): the body on one
  layer, every deliverable on its own layer above it, so future cosmetics
  can be added in-register later.

## 4. Layer stack (z-order, bottom → top)

```
z0 backpack (BEHIND body: silhouette + straps read around the torso)
z1 body (skin)          z2 eyes          z3 hair
z4 pants   z5 shirt   z6 jacket (fully COVERS the shirt when worn)
z7 boots   z8 hat (over hair)   z9 sunglasses   z10 pet (beside, lower right)
```

Rules that shape the drawings:
- **Jacket fully occludes the shirt** — never design a jacket that needs a
  specific shirt under it.
- **Hats sit over hair** at the same crown line every time; **hair must be
  drawn to survive a hat on top** (nothing that must poke through a hat).
- **Boots overlap the pants cuff**, pants tuck cleanly.
- **Pet stands beside** the right foot area (x 700–920, y 720–970), minimal
  body overlap.

## 5. Deliverables

### A. The body ("base") — 6 files
| # | File | Notes |
|---|---|---|
| 1 | `body-skin1..5.png` (5 files) | ONE body drawing, delivered in 5 skin tones: `#F6D7BD` `#E8B98F` `#C68E62` `#96613C` `#5E3A22` (shade each tone properly — dark tones need visible, rich shading, not just darkened midtones). Identical silhouette across all 5. Base outfit ON the body: plain tee, cargo shorts, socks, simple hiking boots. |
| 2 | `body-bald.png` | The skin2 body with NO hair (clean scalp) — the base under short hairstyles. |

### B. Face variants — 3 + 25 files
| # | File | Notes |
|---|---|---|
| 3 | `eyes-1..3.png` (3 files) | Three eye sets (e.g. neutral, bright/wide, relaxed/sleepy), isolated layers, eye zone only. |
| 4 | `hair-<style>-hc1..5.png` (25 files) | **5 hairstyles** (artist proposes; want variety: short, mid, long, curly, +1 wildcard), each in **5 colors**: `#1E1B18` `#4A3222` `#8C5A2B` `#C98A3D` `#A44F3C`. Isolated hair layers over the bald scalp. |

### C. Cosmetics — 32 files (8 slots × 4 rarities)
Isolated transparent layers, in-register on the frozen body. Names are
final (they're in the live game database); designs are the artist's, guided
by the name + rarity color language (§2). Files: `cos-<slot>-<rarity>.png`.

| Slot | common | rare | epic | legendary |
|---|---|---|---|---|
| boots | Trail Runners | Moss Striders | Summit Spikes | Skyline Soles |
| pants | Canvas Hikers | River Rolls | Cliffside Cargos | Aurora Trousers |
| backpack | Daypack | Ranger Rucksack | Expedition Pack | Balloon Bundle |
| hats | Bucket Hat | Scout Beanie | Falcon Feather Cap | Golden Summit Crown |
| sunglasses | Camp Shades | Riverbend Rounds | Glacier Goggles | Eclipse Aviators |
| shirts | Basecamp Tee | Flannel Scout | Storm Windbreaker | Constellation Jersey |
| jacket | Trail Shell | Pine Parka | Ridge Runner Coat | Comet Puffer |
| pet | Pocket Frog | Marmot Buddy | Hawk Companion | Tiny Yeti |

### D. Optional add-on (quote separately): the beaver mascot — 4 files
Friendly beaver in hiking gear (prominent buck teeth, bandana, small pack) —
the player's default rival. `mascot-neutral / -cheer / -defeat / -taunt.png`,
same canvas, standalone (not layered). Current AI version supplied as the
concept reference; a redesign in the artist's hand is welcome.

**Totals: 66 files core (≈ 41 unique drawings + tone/color variants), +4
optional mascot.**

## 6. Process & milestones (suggested)

1. **Concept:** 2–3 body sketches → founder picks one → **body frozen**.
2. **Batch 1:** body ×5 skins + bald + eyes ×3 → approval.
3. **Batch 2:** hair 5 styles (one color) → approval → color variants.
4. **Batches 3–6:** cosmetics two slots at a time, reviewed per batch.
5. Mascot (if commissioned) any time after the style is settled.

Founder reviews each batch **in the app** (drop-in slots exist; no code
changes needed) and requests revisions per the checklist below.

## 7. Acceptance checklist (run per batch)

- [ ] 1024², transparent, correct file name.
- [ ] **Silhouette test:** all 5 skin bodies overlay pixel-identical (only
      color differs). Bald body identical below the hairline.
- [ ] **Overlay test:** any one item from every slot stacked together on the
      body — everything aligns, nothing floats/clips.
- [ ] **Swap test:** swapping any single slot's item never shifts anything
      else (hat swap doesn't move the face, etc.).
- [ ] **Z-order test:** jacket hides shirt fully; hat sits over every hair
      style; boots over pants cuffs.
- [ ] **Style test:** batch viewed as a grid — uniform outline weight,
      shading, palette; rarity colors follow the ladder.
- [ ] No baked shadows; no art outside the item's region or canvas margins.

## 8. Licensing / usage (for the listing)

Work-for-hire with full commercial rights transferred on final payment;
source files included; Seek may modify/extend the assets. (Founder handles
contract terms with the platform's standard agreement.)
