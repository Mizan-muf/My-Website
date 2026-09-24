/* ------------------------------------------------------------------------
   World — lays the dungeon out from content.js and bakes its static art.

   One continuous floor, left to right:

     [Plain-view door] ATRIUM (slab)
       → passage → ENTRANCE ARCH → room I (monoliths) → EXIT ARCH
       → passage → … → ENTRANCE ARCH → shrine room (end of the world)

   Passages are open caverns: no back wall, so the parallax shows through,
   and a floating ledge to jump on. Rooms are enclosed: tinted back wall,
   lower ceiling, torches. Each arch sits in a thick facade drawn on the
   *front* layer, so the player visibly walks under and through it.

   Every monolith is reachable by holding →. Nothing requires a jump.

   Static art is baked once into two world-sized canvases (back / front).
   Per frame the renderer blits a view-sized slice of each, plus the
   animated bits.
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var G = (window.G = window.G || {});
  var P = G.PAL;
  var S = function () {
    return G.sprites;
  };

  var T = 16;
  var ROWS = 12; // 0 ceiling · 1–8 open hall · 9 floor surface · 10–11 fill
  var FLOOR_Y = 9 * T; // 144
  var PAD_ROWS = 6; // baked rock above the ceiling / below the floor for tall views

  var EMPTY = 0;
  var FLOOR = 1;
  var FILL = 2;
  var CEIL = 3;
  var LEDGE = 4;
  var WALL = 5;

  var MONO_W = 32;
  var MONO_GAP = 48;
  var ARCH_W = 96;
  var PASSAGE_W = 128;

  var BIOMES = {
    atrium: { tint: "#d9ab3c", light: "#ffb85c", moss: 0.35 },
    passage: { tint: "#3a4a6a", light: "#9fb4e0", moss: 0.5 },
    moss: { tint: "#3c5c2e", light: "#ff9a3c", moss: 0.65 },
    amber: { tint: "#b5451c", light: "#ffc457", moss: 0.25 },
    azure: { tint: "#3a5a9a", light: "#8ec5ff", moss: 0.2 },
    violet: { tint: "#7a4f96", light: "#c9a0ff", moss: 0.3 },
    rose: { tint: "#9a3a4a", light: "#ff9c8a", moss: 0.3 },
    gold: { tint: "#b08424", light: "#ffd76a", moss: 0.4 }
  };

  var NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

  function snap(x) {
    return Math.ceil(x / T) * T;
  }

  /* ======================================================================
     Layout
     ====================================================================== */

  function build(content) {
    var W = {
      T: T,
      ROWS: ROWS,
      FLOOR_Y: FLOOR_Y,
      PAD_ROWS: PAD_ROWS,
      ARCH_W: ARCH_W,
      sections: [],
      passage: { id: "passage", name: "Passage", numeral: "", biome: BIOMES.passage, items: [] },
      things: [], // records: slab, monoliths, shrine
      torches: [], // {x, y, color, front?}
      arches: [], // {x, kind: "entry" | "exit", section}
      rooms: [], // [x0, x1] enclosed: back wall
      lowCeil: [], // [x0, x1] where the ceiling drops a row
      passages: [], // [x0, x1] open caverns
      ledges: [], // [col0, col1, row]
      pillars: [], // x px of free-standing pillars in passages
      decor: [] // {sheet, c, r, x, y, tint?}
    };

    /* ── ATRIUM ─────────────────────────────────────────────────────── */
    var atrium = {
      id: "atrium",
      name: "Atrium",
      numeral: "",
      biome: BIOMES.atrium,
      x0: 0,
      x1: 400,
      items: []
    };
    W.sections.push(atrium);
    W.rooms.push([0, 400]);
    W.spawn = { x: 80, y: FLOOR_Y - 22 };
    W.door = { kind: "door", x: 36, y: FLOOR_Y - 48, w: 26, h: 48, range: 22, label: "PLAIN VIEW" };
    W.door.cx = W.door.x + W.door.w / 2;
    W.sign = { x: 104, y: FLOOR_Y - 32 };

    var slab = {
      id: "atrium",
      kind: "slab",
      data: content.atrium,
      section: atrium,
      x: 196,
      y: FLOOR_Y - 96,
      w: 160,
      h: 96,
      range: 72,
      label: "",
      read: false,
      glow: 0
    };
    slab.cx = slab.x + slab.w / 2;
    W.things.push(slab);
    atrium.items.push(slab);
    W.torches.push({ x: 176, y: 76, color: BIOMES.atrium.light });
    W.torches.push({ x: 360, y: 76, color: BIOMES.atrium.light });
    W.pillars.push(384);
    var x = 400;

    /* ── GATES ──────────────────────────────────────────────────────── */
    content.sections.forEach(function (sec, si) {
      var biome = BIOMES[sec.biome] || BIOMES.moss;
      var last = si === content.sections.length - 1;

      /* passage: open cavern, two pillars, a floating ledge */
      W.passages.push([x, x + PASSAGE_W]);
      W.pillars.push(x + 16, x + PASSAGE_W - 32);
      W.ledges.push([Math.floor((x + 48) / T), Math.floor((x + 48) / T) + 2, 6]);
      x += PASSAGE_W;

      var gateX = x;
      var section = {
        id: sec.id,
        name: sec.name,
        kicker: sec.kicker,
        numeral: NUMERALS[si],
        biome: biome,
        x0: gateX,
        gateX: gateX,
        items: []
      };
      W.sections.push(section);
      W.arches.push({ x: gateX, kind: "entry", section: section });
      W.torches.push({ x: gateX - 14, y: 74, color: biome.light, front: true });
      W.torches.push({ x: gateX + ARCH_W - 2, y: 74, color: biome.light, front: true });
      x = gateX + ARCH_W + 36;

      sec.items.forEach(function (item, ii) {
        var t;
        if (item.shrine) {
          t = { kind: "shrine", w: 48, h: 64, range: 40 };
          t.x = x + 8;
          t.y = FLOOR_Y - 64;
          x += 48 + 16 + MONO_GAP;
        } else {
          t = { kind: "monolith", w: MONO_W, h: 48, range: 36 };
          t.x = x;
          t.y = FLOOR_Y - 48;
          x += MONO_W + MONO_GAP;
        }
        t.id = sec.id + ":" + ii;
        t.data = item;
        t.section = section;
        t.index = ii;
        t.label = item.label || "";
        t.number = ("0" + (ii + 1)).slice(-2);
        t.cx = t.x + t.w / 2;
        t.read = false;
        t.glow = 0; // eased 0..1 for the igniting state
        W.things.push(t);
        section.items.push(t);

        /* between monoliths: torches on even gaps, banners every third */
        var gapX = x - MONO_GAP;
        if (ii < sec.items.length - 1) {
          if (ii % 2 === 0) W.torches.push({ x: gapX + MONO_GAP / 2 - 8, y: 70, color: biome.light });
          if (ii % 3 === 1) W.decor.push({ sheet: "props32", c: 2, r: 0, x: gapX + MONO_GAP / 2 - 8, y: 34, tint: biome.tint });
        }
      });

      var roomEnd = snap(x - 16);
      if (last) {
        /* the shrine room is the end of the world */
        W.endX = roomEnd + 32;
        section.x1 = W.endX;
        W.rooms.push([gateX, W.endX]);
        W.lowCeil.push([gateX + ARCH_W, W.endX]);
        x = W.endX;
      } else {
        section.exitX = roomEnd;
        section.x1 = roomEnd + ARCH_W;
        W.rooms.push([gateX, roomEnd + ARCH_W]);
        W.lowCeil.push([gateX + ARCH_W, roomEnd]);
        W.arches.push({ x: roomEnd, kind: "exit", section: section });
        W.torches.push({ x: roomEnd - 14, y: 74, color: biome.light, front: true });
        W.torches.push({ x: roomEnd + ARCH_W - 2, y: 74, color: BIOMES.passage.light, front: true });
        x = roomEnd + ARCH_W + 16;
      }
    });

    W.cols = W.endX / T + 2;
    W.width = W.cols * T;

    /* ── TILE GRID ──────────────────────────────────────────────────── */
    var grid = new Uint8Array(W.cols * ROWS);
    var c, r;
    for (c = 0; c < W.cols; c++) {
      grid[c] = CEIL;
      grid[9 * W.cols + c] = FLOOR;
      grid[10 * W.cols + c] = FILL;
      grid[11 * W.cols + c] = FILL;
    }
    W.lowCeil.forEach(function (lc) {
      for (var cc = lc[0] / T; cc < lc[1] / T; cc++) {
        grid[cc] = FILL;
        grid[W.cols + cc] = CEIL;
      }
    });
    /* end walls */
    for (r = 0; r < ROWS; r++) {
      grid[r * W.cols] = WALL;
      grid[r * W.cols + 1] = WALL;
      for (c = W.endX / T; c < W.cols; c++) grid[r * W.cols + c] = WALL;
    }
    W.ledges.forEach(function (l) {
      for (var cc = l[0]; cc <= l[1]; cc++) grid[l[2] * W.cols + cc] = LEDGE;
    });
    W.grid = grid;

    W.solidAt = function (col, row) {
      if (col < 0 || col >= W.cols || row < 0 || row >= ROWS) return true;
      return grid[row * W.cols + col] !== EMPTY;
    };

    W.ceilBottom = function (col) {
      return grid[W.cols + col] === CEIL ? 2 * T : T;
    };

    /* the room (or atrium) a point is in — passages between rooms */
    W.sectionAt = function (px) {
      for (var i = 0; i < W.sections.length; i++) {
        var s = W.sections[i];
        if (px >= s.x0 && px < s.x1) return s;
      }
      return W.passage;
    };

    bake(W);
    return W;
  }

  /* ======================================================================
     Baking
     ====================================================================== */

  function inRange(list, px) {
    for (var i = 0; i < list.length; i++) {
      if (px >= list[i][0] && px < list[i][1]) return list[i];
    }
    return null;
  }

  function tile(ctx, c, r, x, y) {
    S().draw(ctx, "tiles", c, r, x, y);
  }

  function tintRect(ctx, x, y, w, h, color, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  function pillar(ctx, x, oy, top) {
    tile(ctx, 0, 2, x, oy + top * T);
    for (var r = top + 1; r <= 7; r++) tile(ctx, 1, 2, x, oy + r * T);
    tile(ctx, 2, 2, x, oy + 8 * T);
  }

  /* The plain-view doorway in the atrium's left wall. */
  function drawDoor(ctx, d, oy) {
    var x0 = d.x - 6;
    var y0 = oy + d.y - 10;
    var w = d.w + 12;
    var h = d.h + 10;
    ctx.fillStyle = P["3"];
    ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = P["5"];
    ctx.fillRect(x0, y0, w, 1);
    ctx.fillRect(x0, y0, 1, h);
    ctx.fillStyle = P["1"];
    ctx.fillRect(x0 + w - 1, y0, 1, h);
    /* arched opening, warm light spilling from it */
    for (var x = 0; x < d.w; x++) {
      var t = (x - d.w / 2 + 0.5) / (d.w / 2);
      var top = Math.round((1 - Math.sqrt(Math.max(0, 1 - t * t))) * 8);
      for (var y = top; y < d.h; y++) {
        var k = y < top + 2 ? "h" : y < 18 ? "n" : y < 34 ? "m" : "l";
        ctx.fillStyle = P[k];
        ctx.fillRect(d.x + x, oy + d.y + y, 1, 1);
      }
      ctx.fillStyle = P.i;
      ctx.fillRect(d.x + x, oy + d.y + top - 1, 1, 1);
    }
    ctx.fillStyle = P.h;
    ctx.fillRect(d.x - 1, oy + d.y + 6, 1, d.h - 6);
    ctx.fillRect(d.x + d.w, oy + d.y + 6, 1, d.h - 6);
  }

  function drawSign(ctx, s, oy) {
    S().draw(ctx, "signpost", 0, 0, s.x, oy + s.y);
    G.font.draw(ctx, "PORTFOLIO →", s.x + 33, oy + s.y + 6, { color: P.j, shadow: P.o, align: "center" });
  }

  /* A thick stone facade around an arch — lives on the FRONT layer. */
  function drawFacade(ctx, a, oy) {
    var biome = a.section.biome;
    var c0 = a.x / T - 1;
    var c1 = (a.x + ARCH_W) / T;
    for (var c = c0; c <= c1; c++) {
      for (var r = 1; r <= 3; r++) {
        var h = G.hash(c, r + 60);
        tile(ctx, 5 + Math.floor(h * 3), 0, c * T, oy + r * T);
      }
    }
    /* lit top edge where the facade meets the ceiling, shaded sides */
    ctx.fillStyle = P["4"];
    ctx.fillRect(c0 * T, oy + T, (c1 - c0 + 1) * T, 1);
    /* buttresses */
    pillar(ctx, c0 * T, oy, 4);
    pillar(ctx, c1 * T, oy, 4);
    S().draw(ctx, "archway", 0, 0, a.x, oy + FLOOR_Y - 96);
    tintRect(ctx, c0 * T, oy + T, (c1 - c0 + 1) * T, 8 * T, biome.tint, 0.12);
    if (a.kind === "entry") {
      G.font.draw(ctx, a.section.numeral, a.x + 48, oy + FLOOR_Y - 92, { color: P.i, align: "center" });
      G.font.draw(ctx, a.section.name, a.x + 48, oy + FLOOR_Y - 81, { color: P.j, shadow: P.f, align: "center" });
    } else {
      G.font.draw(ctx, "→", a.x + 48, oy + FLOOR_Y - 92, { color: P.i, align: "center" });
      G.font.draw(ctx, "NEXT GATE →", a.x + 48, oy + FLOOR_Y - 81, { color: P.i, shadow: P.f, align: "center" });
    }
  }

  function bake(W) {
    var oy = PAD_ROWS * T; // baked canvases include rock above and below
    var H = (ROWS + PAD_ROWS * 2) * T;
    var back = S().canvas(W.width, H);
    var front = S().canvas(W.width, H);
    var bctx = back.ctx;
    var fctx = front.ctx;
    var c, r, h, x;

    /* ── back wall: rooms only; passages open onto the cavern ──────── */
    for (c = 0; c < W.cols; c++) {
      var cx = c * T;
      if (!inRange(W.rooms, cx + 8)) continue;
      for (r = W.ceilBottom(c) / T; r <= 8; r++) {
        h = G.hash(c, r);
        var tc = h < 0.08 ? 3 + (h < 0.04 ? 0 : 1) : h < 0.22 ? 6 + (h < 0.15 ? 0 : 1) : h < 0.225 ? 5 : Math.floor(h * 37) % 3;
        tile(bctx, tc, 1, cx, oy + r * T);
      }
    }
    /* biome wash — tints only the stone that is there (source-atop) */
    W.sections.forEach(function (s) {
      tintRect(bctx, s.x0, oy + T, s.x1 - s.x0, 8 * T, s.biome.tint, 0.16);
    });

    /* free-standing pillars in the passages */
    W.pillars.forEach(function (px0) {
      pillar(bctx, px0, oy, 1);
    });

    /* hanging decor inside rooms */
    W.rooms.forEach(function (room) {
      for (var xx = room[0]; xx < room[1]; xx += T) {
        var hh = G.hash(xx, 77);
        var top = oy + W.ceilBottom(xx / T);
        if (hh < 0.12) S().draw(bctx, "props16", 6, 0, xx, top); // chain
        else if (hh < 0.2) S().draw(bctx, "props16", 4 + (hh < 0.16 ? 0 : 1), 0, xx, top); // roots
        else if (hh > 0.93) S().draw(bctx, "props16", 8 + (hh > 0.965 ? 1 : 0), 0, xx, oy + 3 * T + Math.floor(hh * 60)); // cracks
      }
    });
    /* roots dangling into the passages */
    W.passages.forEach(function (p) {
      for (var xx = p[0]; xx < p[1]; xx += T) {
        if (G.hash(xx, 78) < 0.35) S().draw(bctx, "props16", 4 + (G.hash(xx, 79) < 0.5 ? 0 : 1), 0, xx, oy + T);
      }
    });

    W.decor.forEach(function (d) {
      if (d.tint) {
        var tmp = S().canvas(16, 32);
        S().draw(tmp.ctx, d.sheet, d.c, d.r, 0, 0);
        tintRect(tmp.ctx, 0, 2, 16, 30, d.tint, 0.55);
        bctx.drawImage(tmp.c, d.x, oy + d.y);
      } else {
        S().draw(bctx, d.sheet, d.c, d.r, d.x, oy + d.y);
      }
    });

    drawDoor(bctx, W.door, oy);
    drawSign(bctx, W.sign, oy);

    /* slab and shrine are static; monoliths are drawn live */
    W.things.forEach(function (t) {
      if (t.kind === "slab") S().draw(bctx, "slab", 0, 0, t.x, oy + t.y);
      if (t.kind === "shrine") S().draw(bctx, "shrine", 0, 0, t.x, oy + t.y);
    });

    /* floor-level props */
    for (x = 4 * T; x < W.endX; x += 8) {
      h = G.hash(x, 91);
      if (h < 0.05) S().draw(bctx, "props16", h < 0.025 ? 0 : 1, 0, x, oy + FLOOR_Y - 16);
      else if (h < 0.065) S().draw(bctx, "props16", 2, 0, x, oy + FLOOR_Y - 16);
      else if (h > 0.992) S().draw(bctx, "props16", 7, 0, x, oy + FLOOR_Y - 16);
    }

    /* ── front: ceiling, floor, ledges, walls ───────────────────────── */
    for (c = 0; c < W.cols; c++) {
      var x0 = c * T;
      /* rock above the ceiling and below the floor, for tall viewports */
      for (r = -PAD_ROWS; r < 0; r++) tile(fctx, 8, 0, x0, oy + r * T);
      for (r = ROWS; r < ROWS + PAD_ROWS; r++) tile(fctx, 8, 0, x0, oy + r * T);
      for (r = 0; r < ROWS; r++) {
        var k = W.grid[r * W.cols + c];
        h = G.hash(c, r + 40);
        if (k === CEIL) tile(fctx, 6, 2, x0, oy + r * T);
        else if (k === FLOOR) tile(fctx, Math.floor(h * 3), 0, x0, oy + r * T);
        else if (k === FILL) tile(fctx, r === 11 || r === 0 ? 8 : 5 + Math.floor(h * 3), 0, x0, oy + r * T);
        else if (k === LEDGE) tile(fctx, 3, 2, x0, oy + r * T);
        else if (k === WALL) tile(fctx, r === 0 ? 0 : r === 9 ? 2 : 1, 2, x0, oy + r * T);
      }
    }

    /* arch facades — in front of the player */
    W.arches.forEach(function (a) {
      drawFacade(fctx, a, oy);
    });

    /* moss — floor tufts, ceiling drips, vines, ledge tops */
    for (c = 2; c < W.cols - 2; c++) {
      var sx = c * T;
      var biome = W.sectionAt(sx).biome;
      var cb = oy + W.ceilBottom(c);
      h = G.hash(c, 7);
      if (h < biome.moss * 0.7) S().draw(fctx, "moss", h < biome.moss * 0.25 ? 2 : h < biome.moss * 0.5 ? 1 : 0, 0, sx, oy + FLOOR_Y - 4);
      h = G.hash(c, 8);
      if (h < biome.moss * 0.8) S().draw(fctx, "moss", 5, 0, sx, cb - 1);
      h = G.hash(c, 9);
      if (h < biome.moss * 0.5) S().draw(fctx, "moss", 6 + Math.floor(G.hash(c, 10) * 3), 0, sx, cb);
    }
    W.ledges.forEach(function (l) {
      S().draw(fctx, "moss", 3, 0, l[0] * T, oy + l[2] * T - 4);
      S().draw(fctx, "moss", 1, 0, (l[0] + 1) * T, oy + l[2] * T - 4);
      S().draw(fctx, "moss", 4, 0, l[1] * T, oy + l[2] * T - 4);
    });

    W.back = back.c;
    W.front = front.c;
    W.bakeOffsetY = oy;
  }

  G.world = { build: build, BIOMES: BIOMES };
})();
