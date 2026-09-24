# Portfolio as a side-scrolling dungeon — build plan

A 2D pixel-art side-scroller. Each portfolio section is its own sealed, torch-lit
room. The visitor walks through a room, reads its monoliths, and steps through the
portal at the end to travel to any other room.

Status: **Phases 1–8 built (2026-09-24).** Game is live at `/`; the previous page is `classic.html`.
Art is currently **drawn in code** (see §6) — the Phase 2 art gate is open for review.

---

## 1. Locked decisions

| Decision | Choice |
|---|---|
| Genre | Side-scroller, one sealed room per section |
| Rooms | Solid rock between rooms. A **portal** at the end of each room opens a destination picker (next room preselected) |
| Traversal | Walk + **expressive jump** — jump feels good but nothing ever requires it |
| Ground | Continuous. Every monolith reachable by holding → |
| World render | `<canvas>` |
| Content render | **DOM overlay panels**, not canvas text |
| Art | 100% custom. No CC0 sprites. Currently procedural pixel art in `game/sprites.js`; any sheet can be swapped for a hand-drawn PNG |
| Engine deps | None. Vanilla Canvas. Any future dep must be MIT/CC0 and named |
| Setting | Ancient dungeon — moss-covered stone, gold engravings, torchlight |
| Fail state | **None.** No enemies, damage, death, timers or reflex requirements |
| Text route | `classic.html` (the previous portfolio page) until the user’s own design lands |
| Source of truth | `content.js` feeds both game panels and the future text route |

### Why canvas world + DOM panels
- The 33 certification links stay real `<a href>` — clickable, crawlable
- Text is selectable and copyable (recruiters copy the email address)
- Screen readers work; canvas text is invisible to them
- No manual word-wrap, font rendering or scroll re-implementation

---

## 2. Display

- Internal resolution **320×180** (16:9), integer-scaled — 6× → 1920
- Tiles **16×16** → ~20×11 tiles visible
- `image-rendering: pixelated`, no sub-pixel positioning for world tiles
- Mobile: 4× scale, portrait supported

---

## 3. Layout

```
 ATRIUM         GATE I        GATE II      GATE III    GATE IV      GATE V     GATE VI
┌───────┐   ┌──────────┐  ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
│ SLAB  │══▶│ PROJECTS │═▶│EXPERIENCE│▶│ SKILLS  │▶│  CERTS  │▶│  EDU   │▶│CONTACT │
│       │   │    ×7    │  │    ×4    │ │   ×4    │ │   ×6    │ │   ×2   │ │ shrine │
└───────┘   └──────────┘  └──────────┘ └─────────┘ └─────────┘ └────────┘ └────────┘
  spawn      ← largest                                                    ← deepest
```

**23 monoliths.** ~185 tiles ≈ 2,960px ≈ 15 screens. ~50s end-to-end on foot,
which is why fast travel (§7) is a requirement rather than a nicety.

Each gate gets a distinct biome — stone tint, moss density, torch colour — so
location is legible without reading a label.

### Monolith order
Projects run 01→07 left to right, starting with **Hippo Cortex Retrieve**, then
FBSPLAI, Vocalytics-V0.3, Intelli-News-v1.1, ACORD Forms Extraction, Neo Wolf,
Distributed Network Monitoring Platform. Experience is chronological, newest first.

---

## 4. The atrium slab

Engraved gold-on-stone, moss creeping over it:

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓  ░░ MEEZAAN CHISHTY ░░      ▓
▓  ────────────────────────   ▓
▓  AI/ML ENGINEER ·           ▓
▓  BACKEND DEVELOPER ·        ▓
▓  PRODUCT BUILDER            ▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
      ☺  ← spawn
```

The same text ships as a real visually-hidden `<h1>` — engraved pixels are
invisible to crawlers and screen readers.

---

## 5. Interaction

1. Player approaches a monolith; within ~24px its runes ignite
2. A prompt floats above: `↑ READ`
3. `↑` / `E` / `Space` / `Enter` opens the DOM panel
4. `Esc` closes; focus returns to the player
5. The monolith stays **lit** as read-state, persisted to `localStorage`

Panel contents per section:
- **Projects** — title, year, deck, detail, tech chips, repo link where one exists
- **Experience** — role, company, dates, location, bullets, metric callouts
- **Skills** — group name + pill list
- **Certificates** — group name + real anchor per certificate
- **Education** — institution, degree, dates, GPA
- **Contact** — email, LinkedIn, GitHub, résumé PDF

---

## 6. Art pipeline

**Current state:** no usable pixel art existed in any local repo, so every sheet is drawn in
code (`game/sprites.js`) from the §1 palette, baked to the exact `ASSETS.md` sheet layouts.
Hand-drawn replacements drop in per sheet via `OVERRIDES` — see `ASSETS.md` §14.

**Original intent: the user draws the art.** Full manifest with exact cell sizes, sheet layouts,
frame counts, the 30-colour palette and Aseprite export settings lives in
**`ASSETS.md`** — that is the source of truth for anything art-related.

Summary: 16 files, ~160 cells. 16×16 tiles, 16×24 character, 32×48 monolith,
6×8 bitmap font, 3 parallax layers. Lighting, particles, HUD, panels and the
left-facing character are all handled in code and must **not** be drawn.

`ASSETS.md` §2 defines a **~20-cell "art-gate pack"** — the minimum needed to judge
the direction at the Phase 2 checkpoint before the rest gets drawn.

**World labels use the bitmap font. Panel body copy uses a normal web font** —
6×8 pixel type is unreadable for 33 certificate names and multi-sentence prose.

---

## 7. Navigation and HUD

- Current section + `3 / 7 read` progress
- **`Tab` opens a gate list for instant travel** — doubles as the keyboard nav path
- **Contact and Résumé pinned in the HUD at all times.** A recruiter must never
  walk 15 screens to find an email address
- Read-state persisted; returning visitors can skip what they've seen

---

## 8. Accessibility — hard requirements

- No fail state of any kind
- Full keyboard: arrows/WASD, `E`/`Enter`/`Space`, `Esc`, `Tab`
- Panels focus-trapped; `Esc` restores focus to the game
- `prefers-reduced-motion` disables parallax, particles, camera easing, shake
- Minimal `<noscript>` + semantic content block until the text route lands
- Panel surfaces get their own readable background — the dungeon palette is dark,
  so panel text contrast is verified independently against WCAG AA

---

## 9. Systems

- Fixed-timestep update, decoupled render
- Horizontal run, gravity, AABB vs tile grid
- Camera: horizontal follow with deadzone, clamped to map bounds; slight vertical lerp
- 3–4 parallax background layers
- Lighting: darkness overlay + additive radial lights (torches, lit monoliths,
  soft player aura) composited into an offscreen buffer once per frame
- Particles: dust motes, torch embers, moss spores

---

## 10. Phases

1. **Engine skeleton** — loop, run/gravity/collision, camera, parallax, greybox blocks
2. **🚦 ART GATE** — palette, bitmap font, character idle/walk, monolith ×3 states,
   a lit stone-and-moss wall section, at final scale.
   **Approved before any world is built.**
3. World build — corridor, 6 archways, 23 monolith placements
4. Interaction + DOM panels + `content.js` with all existing copy verbatim
5. Lighting, particles, atmosphere
6. HUD, fast travel, read-state, accessibility, fallback
7. Mobile — two-button controls, portrait, full-screen panel sheets
8. Polish + perf (target 60fps; lighting is the budget risk)

---

## 11. Risks

- **Art remains the whole project.** Stone/moss/gold is forgiving, but Phase 2 is
  the genuine go/no-go. If the sample reads as clean-but-soulless, the honest fix
  is a real pixel artist for the character and monoliths.
- **Corridor length** — 15 screens is a lot of walking. Fast travel and biome
  variety are the mitigations; run speed needs tuning against a tedium test.
- **Lighting cost on mobile** — may need a cheaper path at lower scale.
- **Scope discipline** — no combat, no NPCs, no dialogue trees, no puzzles.
  Walk, approach, read.

---

## 12. As built

| File | Role |
|---|---|
| `index.html` | Game shell — canvas, HUD, panel/map `<dialog>`s, touch controls, noscript |
| `classic.html` | The previous portfolio page, unchanged apart from a "Play" link |
| `game/content.js` | Single source of truth. Merged from the classic page + latest résumé (résumé wins) |
| `game/palette.js` | §1 palette keyed by one character, seeded RNG, hash |
| `game/font.js` | 5×7 bitmap font for world labels |
| `game/sprites.js` | All art, baked to ASSETS.md sheet layouts; `OVERRIDES` for PNG swaps |
| `game/world.js` | Corridor layout + baking of the static back/front layers |
| `game/render.js` | Camera, parallax, lighting, particles, labels |
| `game/engine.js` | Input, player physics, fixed-timestep loop |
| `game/ui.js` | Panels, HUD, map/fast travel, read-state, touch |
| `game/main.js` | Boot |

Deviations from the plan: archway is 96×96 (80 was too narrow for "CERTIFICATES" in the
bitmap font); 25 records in the progress count (23 monoliths + slab + shrine); panels have
prev/next so a reader can page through every record without walking.

### Round 2 (2026-09-24, after play-test)
- Fixed: held keys stuck "down" after opening a panel (releases now always register; `releaseAll()` on every dialog).
- Read-state is **per visit only** — nothing persists across reloads (supersedes §5 step 5 and §7).
- Gates are now **walk-through rooms**: open-cavern passage → entrance arch in a thick facade (front layer) → enclosed room with a lower ceiling → exit arch "NEXT GATE →". The shrine room ends the world.
- Guidance: title card on every load (Enter the dungeon / Plain view), a PORTFOLIO → signpost at spawn, a lit "← PLAIN VIEW" doorway in the left wall (walk into it or press ↑), HUD "Next: …" line and an edge chevron toward the next unread record.

### Round 3 (2026-09-24) — rooms and portals
- The corridor is split into **sealed rooms**: Atrium, then one per section. Solid rock (`WALL`) between them; passages, ledges and exit arches are gone. Each room is at least 480px wide, and the camera is clamped to the current room, so you never see a neighbour.
- Every room ends in a **signboard** (`NEXT / <ROOM> →`; Contact's reads `BACK TO / THE ATRIUM →`) and a **portal**. ↑ / E / click at a portal opens the map dialog in portal mode ("The Portal"): the current room is disabled and the next room is preselected. Choosing one plays a short light flash (skipped with reduced motion) and teleports you.
- The HUD "Next: …" line and the edge chevron are **removed**. Visitors go at their own pace; the signboards are the only guidance.
- Tab / Map fast travel is unchanged.
- "Classic view" renamed **Plain view** (file stays `classic.html`).
