# Seek — Art & Aesthetic Direction

> **Purpose:** the single source of truth for Seek's *entire* visual identity. Both consumers read from this document: (1) the **design tokens / coded UI** (colors, type, component feel) and (2) the **art assets**. One aesthetic, two output methods — so the coded UI and the illustrated art always feel like one product.
> **Asset production (revised 2026-07-10):** assets are **founder-curated** — the founders generate/select final art themselves with tools of their choice and hand over finished files for the registry slots. This document's direction is tool-agnostic and unchanged; it now guides the founders' curation (and any artist they engage) rather than an automated generation pipeline.
> **Status:** Sections 1–4 (vibe, color, type, UI feel) are **locked** and govern the app from M0. Sections 5–8 (illustration, the beaver character, crate/reward, motion) are art-direction for the founder-curated asset set and polish (M13); locked in direction, refined against real output.
> **Companion:** pairs with `SEEK_MVP_BUILD_SPEC_V2.md` (the build spec). Where the spec says "style bible," it means this document. Referenced fonts/colors here override the placeholder defaults in the spec.

---

## 1. Overall Vibe / Mood (the north star)

**Seek feels like an outdoor adventure crossed with a playful, energetic competition** — an app about *doing hard things with friends* that stays fun, friendly, and a little bit hype.

- **Craft:** stylized mobile-game quality — characterful, chunky, tactile, and polished. (Craft bar revised up from "Duolingo-medium": Seek is a *game* — crates, gacha, avatars, a mountain to climb — so it earns richer, more crafted art than a flat utility app. Duolingo still sets the bar for *friendliness and polish*, just executed at higher fidelity — see §5.)
- **Soul:** outdoor and earthy, drawn from Patagonia and REI — warm, grounded, authentic, real mountains and real gear. Deliberately **away** from soft cozy-pastel territory.
- **Energy:** BeReal-honest at the content level (raw, real proof of real moments) wrapped in polished, playful, game-y chrome.
- **The load-bearing principle — earthy at rest, energetic at the peaks:** the world lives in warm grounded tones and comes alive with punchy accent color + motion at the reward and competition beats. Calm and premium at rest; explosive when the gameshow moment hits. Every color, motion, and art decision downstream serves this.

---

## 2. Color (LOCKED)

**Mode:** Light only for v1 (the cream-based palette is fundamentally light; dark mode deferred to v2). Founder refines live once built.

**Source:** warm earthy "summer camp" palette, split by functional role.

**Base / world (earthy, at rest):**
- Cream `#F5ECE3` — primary background
- Jungle green `#233837` + rifle green `#3D4625` — text, grounding surfaces
- Russian green `#779F6F` + shelduck blue `#B5D7CC` — natural mid-tones, secondary surfaces
- Dark sienna `#401D15` — deep shadow / accent

**Accent / energy (the hype peaks):**
- **Primary CTA / action / win — cadmium orange `#EC8340`** (pressed state: vermillon `#D45735`). The most-tapped, most-visible color.
- **Celebration / coins / highlights — indian yellow `#ECA945`**
- **Info / secondary actions / links / navigation — bice blue `#2774B4`**
- **Variety accent — chestnut `#A44F3C`**

**Semantic logic (drives tokens):** warm = *act / reward / win* · cool blue = *info / navigate* · greens = *the calm world* · yellow = *celebrate / currency*.

**Rarity ladder (gacha, echoes crate colors):** common → russian green · rare → bice blue · epic → vermillon / chestnut · legendary → indian yellow / gold.

**Discipline rule:** the palette provides range; tokens assign each color a **fixed role**. The UI does not use all colors freely — coherence from role assignment, energy from disciplined accent use.

---

## 3. Typography (LOCKED)

**Personality:** outdoor-rugged and characterful in the brand voice; friendly and polished in functional headers; clean and legible in body; athletic in competition. All fonts free/open-source and embeddable (Google Fonts / OFL).

- **Brand / hero display — `Alfa Slab One`:** logo/wordmark, mountain screen title, reward/win banners, major section headers. Carved-trailhead, national-parks-poster character — the outdoor soul. **Use big and sparingly** (heavy slab; overwhelming at small sizes or in bulk).
- **Functional headers — `Nunito`** (ExtraBold / Black): card titles, buttons, list headings, smaller headers. Rounded, warm, polished workhorse where Alfa Slab would be too heavy.
- **Body / UI — `Inter`:** feed, comments, stats, settings, all small/functional text. Neutral, screen-optimized, maximally legible.
- **Timer — `Archivo`** (heavy, large): the challenge clock (spec §7.5) as a scoreboard moment — chunky, athletic. **Tabular / monospaced numerals** so the running countdown doesn't jitter. Dedicated `timer` text style in tokens.

**Rule:** four roles, disciplined hierarchy — rugged hero display + friendly functional headers + neutral body + athletic timer. Reserve Alfa Slab for hero moments. Don't introduce other fonts.

---

## 4. UI / Component Feel (LOCKED)

**Overall:** tactile, game-y, and friendly — physical objects you can press and pick up. Cartoonish-but-polished; things have weight and warmth, never sterile-flat, never glossy.

- **Buttons — 3D "press" style:** solid accent fill (cadmium orange primary) with a **darker colored bottom lip** (vermillon) that the button visibly pushes down into on tap. Chunky, confident, game-like. **This is the signature interaction** — it's what makes Seek feel like a game, not a utility. Nunito Black label text.
- **Corners:** **16px** on cards and surfaces; buttons are chunky rounded (pill / near-pill). Friendly and round without going bubbly-childish.
- **Depth:** **tactile but restrained** — soft shadows so cards, crates, and buttons feel like liftable physical objects. Present, never heavy. No gradients, no glow.
- **Surfaces:** **subtly earth-tinted surfaces on the cream background** — not stark white — so functional screens (feed, profile, stats) stay warm and outdoor, not clinical. Keep tints **subtle** and use the deep greens (`#233837` / `#3D4625`) for text so legibility stays crisp. Reserve stronger earthy tints and richer texture for themed moments (mountain, crates, rewards).
- **Consistency:** 3D-press buttons, 16px roundness, tactile depth, and tinted surfaces apply across every screen so the app feels like one coherent physical world.

---

## 5. Illustration Style (art-generation spec) (LOCKED direction)

**Target fidelity: stylized mobile-game asset art** — the craft level of the reference crate (bold outline, cel-shading, real texture, 3/4 dimensional form). Family references: Clash Royale / Brawl Stars / Rovio-era chunky game art. **Not** flat-minimal, **not** realistic/3D-rendered, **not** pastel.

**Defining characteristics (feed every generation):**
- **Bold, confident dark outlines** around forms.
- **Cel-shading** — flat planes of light and shadow, not smooth gradients.
- **Real texture** where it counts (wood grain on crates, fabric on gear, rock on the mountain).
- **3/4 dimensional views** for objects (crates, badges) so they read as tactile things.
- **Warm earthy palette** (§2) — explicitly **pull everything off pastel/washed-out tones** into rich, grounded color. (The reference crate's craft = yes; its pastel blue background = no.)

**Detail-tier rule (LOCKED — keeps the app coherent, not noisy):** detail scales with importance.
- **Hero / reward objects** (crates, the beaver + rival, badges, mountain, backgrounds): the **full** rich treatment — texture, shading, outline, dimension.
- **Functional / repeated UI** (small icons, avatar cosmetic pieces at inventory scale): **cleaner and simpler** so they read at a glance and don't clutter. Same style family, dialed down.
- Rich where it rewards, clean where it functions.

**Consumes:** this section is the descriptor for producing every asset, alongside the locked **anchor references** (the canonical **beaver base**, mountain, one crate) + the color tokens. Every asset = anchors + this descriptor + palette + per-asset spec.

---

## 6. The Beaver — player character + rival (concept LOCKED; identity details open)

**The player's avatar IS a beaver** (character pivot, spec §10 — there is no separate hiker). Beaver chosen deliberately: beavers are *builders and doers* (they achieve through effort — dead-on for a "do hard things" app), outdoor/wilderness-native (fits the mountain world), and instantly characterful. **The beaver is customizable** (base body color + gacha cosmetics) **and emotive** (a Tamagotchi care loop with five Happiness states).

- **Design:** friendly beaver with **prominent buck teeth**, hero-tier illustration (§5) — rich, outlined, cel-shaded, earthy palette. The base body is a clean, neutral, dress-able beaver so cosmetics read clearly on it.
- **Base body — 6 distinct bodies:** sex (male/female) × color (Brown / White / Black), spec §10.1. The female body is a **distinct design** (its own silhouette), not a recolor of the male — **two frozen canonicals**, each recolored into its 3 colors, sharing one registration envelope so every cosmetic fits all six (rig bible §4).
- **Cosmetics (gacha):** worn on the beaver across 4 slots — **hats, tails, gloves, eyes** (spec §10.2). *Functional/repeated* detail tier (§5): cleaner/simpler than hero objects, still in-style, so many read at a glance in inventory.

**Happiness states (5 — emotional, purely cosmetic).** The beaver's mood is expressed through its base pose/expression, driven by the Happiness stat (spec §10.3). Direction:
- **Thriving (81–100):** bright eyes, tail up, subtle shine/sparkle, a little idle bounce (motion §8).
- **Content (61–80):** neutral-happy baseline — the default pose.
- **Okay (41–60):** slightly lower energy, ears/tail a touch drooped.
- **Unhappy (21–40):** visibly drooping posture, sadder eyes, looking down/away.
- **Neglected (0–20):** hunched, dull/desaturated coloring — **still sympathetic and cute, never distressing or guilt-inducing.** We want the user to *want* to cheer it up, not feel punished.
- **Cosmetics render on top of every state** — a Neglected beaver still wears its hat/tail/gloves/eyes on the sadder pose. Keep the states within one registration envelope so a single cosmetic layer set composites across all five (rig bible).

**The rival (H2H opponent NPC).** When no friend can be paired, the opponent is a **different, distinct beaver** (spec §7.9) — recognizable as "the opponent," **visually separated** from the player's own beaver (different palette/build/attitude) so the two are never confused. Same hero-tier craft. Needs **win / lose / idle expression states** for H2H moments. It is a stand-in opponent, **not** the game's singular mascot.
- **Open (founder):** the beaver's exact base design; whether the rival is one recurring character or a set, its look and name (if any); personality specifics. Build against config + registry slots (`beaverBase`, `rivalBeaver` + states); labeled placeholder until final art. **Do not invent a rival name pre-decision.**
- **Tone:** friendly, warm, motivating — never punishing, even at low Happiness or on a loss.

---

## 7. Crate / Gacha / Reward Style (LOCKED)

- **Crates render as tactile, chunky physical objects** — the reference crate's craft (bold outline, wood grain, cel-shaded, 3/4 view, soft shadow so it feels liftable), in the earthy palette (not pastel).
- **One crate design, recolored 5 ways** (wood / blue / red / yellow / gold), per spec §9.3. Wood = the reference's natural tone; the rest are palette-driven recolors echoing the rarity ladder (§2).
- **Reward moments are the energetic peaks** (§1): crate-open reveals and win screens concentrate the **indian yellow / cadmium orange punch** and the celebratory motion (§8). This is where the app is loudest — earn it, then explode.
- **Rarity color-coding** on cosmetic reveals follows the ladder: common green → rare blue → epic vermillon/chestnut → legendary gold. (Cosmetics are the beaver's hats/tails/gloves/eyes, spec §10.2.)
- **Badges:** same hero-tier craft; a small cohesive set (Summit Reached, First Win, Vote Winner, Perfect Week).
- **Vending-machine snack (spec §9.5):** a small, appetizing hero-ish treat object in the earthy palette; reads as "restores your beaver."

---

## 8. Motion / Feel (direction for polish, M13)

Light spec — refined against the built app.

- **Principle mirrors the palette:** calm/subtle in the resting world; energetic bursts at the peaks. Everyday transitions are smooth and quick and unobtrusive; reward/win/crate/climb moments get expressive, bouncy, celebratory motion.
- **The signature moments to make feel great:** the **mountain-climb** advance (avatar moves up, flag plants), the **crate-open** reveal (anticipation → pop → rarity flourish), the **H2H win** screen, and the **3D button press** (tactile push-down on every tap).
- **Respect reduced-motion** — provide calm fallbacks for all expressive animations.
- **Restraint:** motion punctuates; it doesn't fill every gap. Loud where it rewards, quiet everywhere else.

---

## 9. How This Drives Production

- **Coded UI (design tokens):** consumes §2 (color roles), §3 (fonts), §4 (component feel: 3D buttons, 16px, tinted surfaces, tactile depth). On-brand from M0.
- **Art assets (founder-supplied, per the earlier pipeline change):** consume §5 (illustration spec + detail tiers), §6 (the beaver: base body, cosmetics, Happiness states, rival), §7 (crates/badges/snack), against the locked anchor references + palette.
- **Motion (M13):** consumes §8.
- **Figma escalation:** only for founder-flagged screens; those inherit all of the above.

**Anchor-first workflow:** freeze the defining assets (the canonical **beaver base**, mountain, one crate) as locked references, then produce everything else against them (rig bible) → founder reviews, corrects drift. Applies whoever/whatever makes the art.

---

*This document defines Seek's look. Build the coded UI to match it from day one; generate all art against it. When a visual choice isn't covered here, extend from the north star (§1) — earthy at rest, energetic at the peaks — rather than inventing a new direction.*
