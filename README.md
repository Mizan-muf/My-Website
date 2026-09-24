# My Website

Link: mizan-muf.github.io/My-Website

Personal portfolio, played as a small 2D side-scroller: walk right from the atrium through
six arched rooms (Projects, Experience, Skills, Certificates, Education, Contact) and read
the monoliths. Every record opens a normal, selectable, linkable panel.

The plain scrolling page ("Plain view") is at `classic.html` — offered on the title card,
in the HUD, and through the lit doorway to the left of the spawn point.

## Controls

- `←` `→` / `A` `D` walk · `Space` jump · `↑` / `E` / `Enter` read · `Tab` gate map
- Click any monolith to read it. Touch devices get on-screen buttons.

## Files

- `index.html`, `game/` — the game (vanilla JS + Canvas, no dependencies, no build step)
- `game/content.js` — all portfolio copy; edit this to update the game
- `classic.html`, `styles.css`, `script.js` — the plain view
- `GAME_PLAN.md`, `ASSETS.md` — design plan and art manifest

## Run locally

Open `index.html` directly in your browser, or serve the folder (`python3 -m http.server`).
