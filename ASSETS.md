# Asset manifest — side-scrolling dungeon portfolio

Companion to `GAME_PLAN.md`. Everything the game needs, with exact sizes and sheet layouts.

**Base grid 16×16. Internal resolution 320×180. Draw everything at 1× — the game
does the scaling.** Never scale or anti-alias in the editor.

---

## 0. Rules that keep it coherent

1. **One palette, no exceptions** (§1). Every asset picks from it. This single
   constraint does more for a unified look than any amount of rendering skill.
2. **One light direction: top-left.** Highlights up-left, shadows down-right, on
   every asset, always.
3. **No anti-aliasing. No semi-transparent pixels** — except deliberate glow
   overlays, which are their own files.
4. **PNG-32 with real transparency.** No magenta keying, no baked background.
5. **The character is drawn facing RIGHT only** — code mirrors it. So avoid
   asymmetric details (a bag on one shoulder, an eyepatch); they'll flip and look wrong.
6. **Readable silhouette beats interior detail** at 16px. Squint test: if the shape
   isn't clear as a black blob, detail won't save it.

---

## 1. Palette — 30 colours

A starting point, not a mandate. Swap it if you have better instincts, but keep it
this tight and keep the ramps.

**Stone (cool grey), 5 + 2 highlights**
```
#0b0b10   void / deepest shadow
#1a1a24   stone shadow
#2b2b3a   stone dark
#3f4054   stone base
#575a70   stone light
#757a91   stone highlight
#9aa0b3   stone rim
```

**Moss (green), 5**
```
#16241a   moss shadow
#263d24   moss dark
#3c5c2e   moss base
#567a36   moss light
#7a9c45   moss highlight
```

**Gold / engraving, 5**
```
#4a3410   gold shadow
#7a5518   gold dark
#b08424   gold base
#d9ab3c   gold light
#f5d97a   gold highlight
```

**Torch / warm light, 4**
```
#6b2410   ember dark
#b5451c   flame base
#e87a2a   flame light
#ffc457   flame core
```

**Character skin, 4**
```
#3a2418   skin shadow
#7a4a2e   skin dark
#b5794c   skin base
#e0b088   skin light
```

**Character cloth / accent, 4**
```
#2a1c3a   cloth shadow
#4a3060   cloth base
#7a4f96   cloth light
#a878c4   cloth highlight
```

**Neutral, 1**
```
#f0f0f5   rune glow / brightest highlight
```

Save this as an Aseprite palette (`.gpl` / `.ase`) and work in **Indexed** mode —
it makes straying off-palette impossible.

---

## 2. Priority: the art-gate pack — make these 7 first

Phase 2 of the plan is an approval gate. **Do not draw 200 sprites before we look
at anything.** These seven items are enough to judge whether the direction works:

| # | Asset | Size | Notes |
|---|---|---|---|
| 1 | Palette swatch | — | Just lock §1 (or your revision) |
| 2 | Character idle | 16×24 × 4 frames | Facing right |
| 3 | Character walk | 16×24 × 6 frames | Facing right |
| 4 | Stone wall tile | 16×16 × 2 | One plain, one cracked |
| 5 | Floor surface + fill | 16×16 × 2 | Surface (top) and interior fill |
| 6 | Moss overlay | 16×16 × 2 | Transparent, layers over any stone |
| 7 | Monolith | 32×48 × 3 states | Dormant / igniting / lit |

Bonus if you're enjoying it: one torch (16×16 × 4 frames) sells the lighting.

I'll drop these into a walkable greybox scene at final scale and screenshot it, and
we judge from the render. If the direction lands, the rest of this document is the
backlog. If it doesn't, we've lost seven sprites instead of a month.

---

## 3. Character — `assets/char.png`

**Cell 16×24. Sheet 6 cols × 5 rows = 96×120.** Row per animation, left-aligned,
unused cells left empty.

| Row | Animation | Frames | Timing | Notes |
|-----|-----------|--------|--------|-------|
| 0 | Idle | 4 | ~180ms | Breathing, slight cloth sway |
| 1 | Walk | 6 | ~110ms | Full stride cycle, contact→passing→contact |
| 2 | Jump | 3 | state-driven | 0 launch/crouch, 1 rise, 2 fall |
| 3 | Interact | 2 | ~200ms | Reaching toward the monolith |
| 4 | Land | 1 | ~120ms | Squash on touchdown |

16 frames total. The character reads at roughly 20px tall on screen at 6× before
scaling — so **the silhouette is everything**. A hood, a coat hem or a satchel
outline does more than a face.

---

## 4. Bitmap font — `assets/font-6x8.png`

**Cell 6×8. Sheet 16 cols × 5 rows = 96×40.**

Rows 0–3 are **ASCII 32–95 in order**, 16 per row — this makes the renderer trivial:

```
row 0   (space) ! " # $ % & ' ( ) * + , - . /
row 1   0 1 2 3 4 5 6 7 8 9 : ; < = > ?
row 2   @ A B C D E F G H I J K L M N O
row 3   P Q R S T U V W X Y Z [ \ ] ^ _
row 4   · ↑ → ↗ — ≈ ▸ ◂ ▪ ▫ ⌐ ¬ (4 spare cells)
```

Uppercase only; lowercase maps to uppercase in code. Row 4 covers the glyphs your
copy actually uses (`·` middot, `—` em dash, `≈`) plus prompt arrows.

Used for **world labels only** — gate names, monolith numbers, `↑ READ` prompts,
HUD progress. Panel body copy is a normal web font, because 6×8 pixel type is
unreadable for 33 certificate names and multi-sentence prose.

---

## 5. Tileset — `assets/tiles.png`

**Cell 16×16. Sheet 16 cols × 4 rows = 256×64.** Opaque.

**Row 0 — floor (9 tiles)**
`surface A · surface B · surface C · surface left-edge · surface right-edge ·
fill A · fill B · fill C · deep fill`

Three surface variants stop long runs looking stamped. Ground is continuous per the
plan, so edge tiles are only for decorative ledges.

**Row 1 — wall (8 tiles)**
`plain A · plain B · plain C · cracked A · cracked B · broken through ·
brick A · brick B`

**Row 2 — structure (7 tiles)**
`pillar top · pillar mid · pillar base · step block · inner corner ·
outer corner · ceiling edge`

**Steps only, no diagonal slopes** — slope collision isn't worth the complexity or
the art. Gentle elevation comes from 1–2 tile steps.

---

## 6. Moss and vines — `assets/moss.png`

**Cell 16×16. Sheet 9 cols × 1 row = 144×16. Transparent.**

`patch small · patch medium · patch large · patch corner-TL · patch corner-TR ·
patch edge-bottom · vine short · vine medium · vine long`

These layer **over** any stone tile, which is why the tileset doesn't need mossy
duplicates of everything. Six overlays cover a whole dungeon's worth of variation.

---

## 7. Monolith — `assets/monolith.png`

**Cell 32×48. Sheet 4 cols × 1 row = 128×48.**

| Cell | State |
|---|---|
| 0 | Dormant — cold stone, runes barely visible |
| 1 | Igniting — runes warming, player in range |
| 2 | Lit — fully active, read |
| 3 | Rune glow overlay — additive layer the lighting pass pulses |

Cell 3 should be **just the glowing runes on transparent**, no stone. It gets
composited additively so the glow can breathe independently of the base sprite.

Twenty-three of these stand in the world. Make the shape imposing — taller than the
character, planted in the floor.

---

## 8. Structures

| File | Size | Notes |
|---|---|---|
| `archway.png` | 80×96 | **One** reusable gate. Name is drawn at runtime in the bitmap font, so you don't draw six |
| `slab.png` | 160×96 | The atrium hero. **Engraved text baked in** — see below |
| `shrine.png` | 48×64 | Contact altar, glowing centre |
| `shrine-glow.png` | 48×64 | Additive glow overlay, transparent |

### The atrium slab
This is the first thing anyone sees, so it's worth hand-lettering rather than
generating. Bake the text into the art:

```
MEEZAAN CHISHTY
────────────────────────
AI/ML ENGINEER ·
BACKEND DEVELOPER ·
PRODUCT BUILDER
```

Gold engraving on stone, moss creeping over the edges. The same text also ships as a
real hidden `<h1>` — engraved pixels are invisible to crawlers and screen readers.

---

## 9. Props

**`assets/props-16.png` — cell 16×16, 12 cols × 1 row = 192×16, transparent**
`rubble A · rubble B · rock small · rock large · root A · root B · chain ·
bone · crack decal A · crack decal B · keycap E · keycap ↑`

**`assets/props-16x32.png` — cell 16×32, 4 cols × 1 row = 64×32, transparent**
`broken column · stalagmite · banner hanging · pipe/conduit`

**`assets/torch.png` — cell 16×16, 4 cols = 64×16, transparent**
Wall-mounted torch, 4-frame flame loop, ~120ms per frame.

**`assets/brazier.png` — cell 16×32, 4 cols = 64×32, transparent**
Floor brazier, 4-frame loop. Optional; torches may be enough.

---

## 10. Parallax backgrounds

**Must tile seamlessly left↔right.** Low detail on purpose — these are silhouettes
read through darkness, and they're the cheapest atmosphere in the whole project.

| File | Size | Scroll | Content |
|---|---|---|---|
| `bg-far.png` | 320×180 | 0.15× | Distant cavern void, faint structures |
| `bg-mid.png` | 320×180 | 0.40× | Pillar and arch silhouettes |
| `bg-near.png` | 320×48 | 1.30× | Foreground rubble strip, drawn over everything at the bottom |

---

## 11. Not needed — handled in code

Don't draw these:

- **Lighting** — darkness overlay and radial torch/monolith lights are canvas gradients
- **Particles** — dust motes, embers, moss spores are procedural
- **Panels, HUD, buttons, mobile controls** — all DOM/CSS
- **Gate name labels** — bitmap font at runtime
- **Left-facing character** — mirrored from the right-facing sheet

---

## 12. Totals

| Group | Files | Frames/tiles |
|---|---|---|
| Character | 1 | 16 |
| Font | 1 | 80 glyphs |
| Tileset | 1 | 24 |
| Moss | 1 | 9 |
| Monolith | 1 | 4 |
| Structures | 4 | 4 |
| Props | 4 | 20 |
| Backgrounds | 3 | 3 |
| **Total** | **16 files** | **~160 cells** |

Of which the **art-gate pack (§2) is ~20 cells** — start there.

---

## 13. Export settings (Aseprite)

- Indexed colour mode, palette from §1
- Export Sprite Sheet → **Sheet type: By rows**
- Constant sheet size, no padding, no border, no trim
- **Uncheck "Merge duplicates"** — it breaks fixed grid indexing
- Output `.png`, save the `.ase` sources alongside in `assets/src/`

---

## 14. Replacing the code art with your own

Every sheet above currently exists as code in `game/sprites.js`, baked at runtime to the
exact layout in this document. To swap one for a hand-drawn file:

1. Export the PNG with the **same cell size and layout** as its section here.
2. Save it under `assets/game/` (e.g. `assets/game/char.png`).
3. Add one line to `OVERRIDES` at the top of `game/sprites.js`:
   ```js
   var OVERRIDES = { char: "assets/game/char.png" };
   ```

Sheet names: `char`, `tiles`, `moss`, `monolith`, `archway` (96×96), `slab`, `shrine`,
`shrineGlow`, `torch`, `props16`, `props32`, `bgFar`, `bgMid`, `bgNear`. A missing file
falls back to the code art, so you can replace sheets one at a time.
