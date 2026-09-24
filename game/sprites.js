/* ------------------------------------------------------------------------
   Sprite sheets — all art is drawn here, in code, from the palette.

   Each sheet is baked once into an offscreen canvas that follows the exact
   layout in ASSETS.md (cell size, rows, columns). That is deliberate: a
   hand-drawn PNG with the same layout can replace any sheet by adding it to
   OVERRIDES below — no other code changes. Example:

       OVERRIDES.char = "assets/game/char.png";

   Rules from ASSETS.md §0 hold here too: one palette, light from top-left,
   no anti-aliasing, character drawn facing right only (code mirrors it).
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var G = (window.G = window.G || {});
  var P = G.PAL;

  /* Hand-drawn replacements, keyed by sheet name. Empty = all code art. */
  var OVERRIDES = {};

  /* ======================================================================
     Drawing helpers
     ====================================================================== */

  function canvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return { c: c, ctx: ctx };
  }

  function col(k) {
    return P[k] || k;
  }

  function px(ctx, x, y, k) {
    ctx.fillStyle = col(k);
    ctx.fillRect(x, y, 1, 1);
  }

  function rect(ctx, x, y, w, h, k) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = col(k);
    ctx.fillRect(x, y, w, h);
  }

  /* Paint a grid of palette keys. "." is transparent. */
  function grid(ctx, ox, oy, rows) {
    for (var y = 0; y < rows.length; y++) {
      var r = rows[y];
      for (var x = 0; x < r.length; x++) {
        var k = r.charAt(x);
        if (k !== ".") px(ctx, ox + x, oy + y, k);
      }
    }
  }

  function bits(pattern) {
    return pattern.split(" ").map(function (row) {
      return row.split("").map(function (b) {
        return b === "1";
      });
    });
  }

  /* ======================================================================
     Character — 16×24 cells, 6 cols × 5 rows (ASSETS.md §3)
     Row 0 idle ×4 · 1 walk ×6 · 2 jump ×3 · 3 interact ×2 · 4 land ×1
     ====================================================================== */

  /* Upper body, standing. Hooded cloak, face in the hood's right opening,
     gold clasp and belt. Symmetric enough to survive mirroring. */
  var CHAR_UPPER = [
    "................",
    "......ssss......",
    ".....sttuus.....",
    "....sttuuuvs....",
    "....stuuuvuus...",
    "....stuusoqqs...",
    "....sttusqr0s...",
    "....sttusqrrs...",
    "....ssttspqqs...",
    "....sttttsiss...",
    "...sttuuuttts...",
    "...stuuuvuttts..",
    "...stuuvuuttts..",
    "...stuuuuutts...",
    "...shhiiihhhs...",
    "...sttuuuttts...",
    "..sttuuuutttts..",
    "..ssttttttttss.."
  ];

  /* One leg: from hip (hx, top) down to a boot at foot x, lifted by `lift`. */
  function leg(ctx, ox, oy, top, hipX, footX, lift, cloth, boot, bootDark) {
    var bottom = 23 - lift;
    var len = bottom - top;
    for (var y = top; y <= bottom - 2; y++) {
      var t = len > 0 ? (y - top) / len : 0;
      var x = Math.round(hipX + (footX - hipX) * t);
      px(ctx, ox + x, oy + y, cloth);
      px(ctx, ox + x + 1, oy + y, cloth);
    }
    /* boot: 3 wide, toe forward (right) */
    rect(ctx, ox + footX, oy + bottom - 1, 3, 1, boot);
    rect(ctx, ox + footX, oy + bottom, 3, 1, bootDark);
  }

  function drawChar(ctx, ox, oy, pose) {
    var bob = pose.bob || 0;
    var top = 18 + bob;
    /* back leg first (darker), then front leg */
    leg(ctx, ox, oy, top, 6, 6 + pose.b, pose.bl || 0, "s", "o", "0");
    leg(ctx, ox, oy, top, 8, 8 + pose.a, pose.al || 0, "t", "p", "o");
    grid(ctx, ox, oy + bob, CHAR_UPPER);
    /* cloak sway / flare */
    if (pose.sway) {
      px(ctx, ox + 13, oy + 16 + bob, "t");
      px(ctx, ox + 13, oy + 17 + bob, "s");
    }
    if (pose.flare) {
      px(ctx, ox + 1, oy + 17 + bob, "s");
      px(ctx, ox + 14, oy + 17 + bob, "s");
      px(ctx, ox + 1, oy + 16 + bob, "t");
      px(ctx, ox + 14, oy + 16 + bob, "t");
    }
    /* front hand peeking from the cloak, swings with the stride */
    if (pose.hand !== undefined) {
      px(ctx, ox + 11 + pose.hand, oy + 15 + bob, "q");
      px(ctx, ox + 11 + pose.hand, oy + 16 + bob, "p");
    }
    /* reaching arm (interact) */
    if (pose.reach) {
      rect(ctx, ox + 12, oy + 11 + bob, pose.reach, 2, "u");
      px(ctx, ox + 12, oy + 12 + bob, "t");
      px(ctx, ox + 12 + pose.reach, oy + 11 + bob, "r");
      px(ctx, ox + 12 + pose.reach, oy + 12 + bob, "q");
      if (pose.spark) px(ctx, ox + 15, oy + 10 + bob, "n");
    }
  }

  var CHAR_POSES = [
    /* idle — breathing */
    [
      { a: 1, b: -1, hand: 0 },
      { a: 1, b: -1, hand: 0 },
      { a: 1, b: -1, bob: 1, hand: 0, sway: 1 },
      { a: 1, b: -1, bob: 1, hand: 0, sway: 1 }
    ],
    /* walk — contact, down, passing, contact, down, passing */
    [
      { a: 3, b: -3, hand: 1 },
      { a: 1, b: -2, bl: 1, bob: 1, hand: 0 },
      { a: -1, b: 1, bl: 2, hand: -1, sway: 1 },
      { a: -3, b: 3, hand: -1 },
      { a: -2, b: 1, al: 1, bob: 1, hand: 0 },
      { a: 1, b: -1, al: 2, hand: 1, sway: 1 }
    ],
    /* jump — crouch, rise, fall */
    [
      { a: 2, b: -2, bob: 2, hand: 0 },
      { a: 2, b: -1, al: 2, bl: 3, hand: 1, flare: 0 },
      { a: 1, b: -2, hand: 1, flare: 1 }
    ],
    /* interact — reach */
    [
      { a: 1, b: -1, reach: 2 },
      { a: 1, b: -1, reach: 3, spark: 1 }
    ],
    /* land — squash */
    [{ a: 3, b: -3, bob: 2, hand: 0, flare: 1 }]
  ];

  function bakeChar() {
    var s = canvas(96, 120);
    CHAR_POSES.forEach(function (row, r) {
      row.forEach(function (pose, c) {
        drawChar(s.ctx, c * 16, r * 24, pose);
      });
    });
    return s.c;
  }

  /* ======================================================================
     Tileset — 16×16 cells, 16 cols × 4 rows (ASSETS.md §5)
     ====================================================================== */

  /* Cut stone blocks with 1px mortar on the right and bottom edge of each
     block, so neighbouring tiles line up seamlessly. */
  function stoneBlocks(ctx, ox, oy, rnd, courses, ramp) {
    var h = 16 / courses.length;
    courses.forEach(function (splits, ci) {
      var y0 = ci * h;
      var edges = [0].concat(splits, [16]);
      for (var i = 0; i < edges.length - 1; i++) {
        var x0 = edges[i];
        var x1 = edges[i + 1];
        rect(ctx, ox + x0, oy + y0, x1 - x0, h, ramp.mortar);
        rect(ctx, ox + x0, oy + y0, x1 - x0 - 1, h - 1, ramp.base);
        rect(ctx, ox + x0, oy + y0, x1 - x0 - 1, 1, ramp.light);
        rect(ctx, ox + x0, oy + y0, 1, h - 1, ramp.light);
        rect(ctx, ox + x0 + 1, oy + y0 + h - 2, x1 - x0 - 2, 1, ramp.dark);
        /* speckle */
        for (var y = y0 + 1; y < y0 + h - 2; y++) {
          for (var x = x0 + 1; x < x1 - 2; x++) {
            var r = rnd();
            if (r < 0.07) px(ctx, ox + x, oy + y, ramp.dark);
            else if (r < 0.11) px(ctx, ox + x, oy + y, ramp.light);
          }
        }
      }
    });
  }

  function crack(ctx, ox, oy, rnd, k, len) {
    var x = 3 + Math.floor(rnd() * 10);
    var y = 1 + Math.floor(rnd() * 4);
    for (var i = 0; i < len; i++) {
      px(ctx, ox + x, oy + y, k);
      y++;
      x += rnd() < 0.5 ? -1 : 1;
      x = Math.max(1, Math.min(14, x));
      if (y > 14) break;
    }
  }

  var WALL = { base: "2", light: "3", dark: "1", mortar: "0" };
  var FLOOR = { base: "3", light: "4", dark: "2", mortar: "1" };
  var FILL = { base: "2", light: "3", dark: "1", mortar: "1" };

  function bakeTiles() {
    var s = canvas(256, 64);
    var ctx = s.ctx;
    var i, ox, rnd;

    /* Row 0 — floor: surface A,B,C · left edge · right edge · fill A,B,C · deep */
    var surfaceCourses = [[[7], [3, 11]], [[10], [5, 13]], [[4, 12], [8]]];
    for (i = 0; i < 3; i++) {
      ox = i * 16;
      rnd = G.rng(100 + i);
      stoneBlocks(ctx, ox, 0, rnd, surfaceCourses[i], FLOOR);
      rect(ctx, ox, 0, 16, 1, "5");
      for (var x = 0; x < 16; x++) if (rnd() < 0.25) px(ctx, ox + x, 0, "6");
    }
    /* edges: surface with a lit / shadowed side */
    stoneBlocks(ctx, 48, 0, G.rng(110), surfaceCourses[0], FLOOR);
    rect(ctx, 48, 0, 16, 1, "5");
    rect(ctx, 48, 0, 1, 16, "5");
    stoneBlocks(ctx, 64, 0, G.rng(111), surfaceCourses[1], FLOOR);
    rect(ctx, 64, 0, 16, 1, "5");
    rect(ctx, 79, 0, 1, 16, "1");
    /* fill */
    var fillCourses = [[[6], [2, 11]], [[9], [4, 12]], [[5, 11], [8]]];
    for (i = 0; i < 3; i++) {
      stoneBlocks(ctx, 80 + i * 16, 0, G.rng(120 + i), fillCourses[i], FILL);
    }
    /* deep fill */
    rect(ctx, 128, 0, 16, 16, "1");
    rnd = G.rng(130);
    for (i = 0; i < 40; i++) px(ctx, 128 + Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.7 ? "2" : "0");

    /* Row 1 — wall: plain A,B,C · cracked A,B · broken through · brick A,B */
    var wallCourses = [[[8], [4, 12]], [[5, 13], [9]], [[11], [3, 7, 14]]];
    for (i = 0; i < 3; i++) stoneBlocks(ctx, i * 16, 16, G.rng(200 + i), wallCourses[i], WALL);
    for (i = 0; i < 2; i++) {
      rnd = G.rng(210 + i);
      stoneBlocks(ctx, 48 + i * 16, 16, rnd, wallCourses[i], WALL);
      crack(ctx, 48 + i * 16, 16, rnd, "0", 9 + i * 3);
    }
    /* broken through — a ragged hole into the void */
    rnd = G.rng(220);
    stoneBlocks(ctx, 80, 16, rnd, wallCourses[2], WALL);
    for (var y = 3; y < 14; y++) {
      var half = Math.round(Math.sin(((y - 3) / 11) * Math.PI) * 5 + rnd() * 1.5);
      rect(ctx, 80 + 8 - half, 16 + y, half * 2, 1, "0");
      px(ctx, 80 + 8 - half - 1, 16 + y, "3");
    }
    /* small bricks */
    for (i = 0; i < 2; i++) {
      stoneBlocks(ctx, 96 + i * 16, 16, G.rng(230 + i), i ? [[2, 6, 10, 14], [4, 8, 12], [2, 6, 10, 14], [4, 8, 12]] : [[4, 8, 12], [2, 6, 10, 14], [4, 8, 12], [2, 6, 10, 14]], WALL);
    }

    /* Row 2 — structure: pillar top · mid · base · step block ·
       inner corner · outer corner · ceiling edge */
    function pillarShaft(ox, oy, y0, y1) {
      for (var y = y0; y < y1; y++) {
        px(ctx, ox + 2, oy + y, "5");
        px(ctx, ox + 3, oy + y, "4");
        rect(ctx, ox + 4, oy + y, 6, 1, "3");
        px(ctx, ox + 6, oy + y, "2");
        px(ctx, ox + 9, oy + y, "2");
        rect(ctx, ox + 10, oy + y, 2, 1, "2");
        rect(ctx, ox + 12, oy + y, 2, 1, "1");
      }
    }
    /* top: capital with a gold band */
    pillarShaft(0, 32, 6, 16);
    rect(ctx, 0, 32, 16, 5, "3");
    rect(ctx, 0, 32, 16, 1, "5");
    rect(ctx, 0, 33, 16, 1, "4");
    rect(ctx, 0, 36, 16, 1, "1");
    rect(ctx, 1, 37, 14, 1, "h");
    px(ctx, 1, 37, "i");
    rect(ctx, 12, 37, 3, 1, "g");
    /* mid */
    pillarShaft(16, 32, 0, 16);
    /* base: plinth */
    pillarShaft(32, 32, 0, 10);
    rect(ctx, 33, 42, 14, 1, "g");
    rect(ctx, 32, 43, 16, 5, "3");
    rect(ctx, 32, 43, 16, 1, "4");
    rect(ctx, 32, 47, 16, 1, "1");
    rect(ctx, 44, 44, 4, 3, "2");
    /* step block (ledges) */
    stoneBlocks(ctx, 48, 32, G.rng(240), [[8], [4, 12]], FLOOR);
    rect(ctx, 48, 32, 16, 1, "5");
    rect(ctx, 48, 47, 16, 1, "1");
    /* inner / outer corners: floor surface meeting a wall */
    stoneBlocks(ctx, 64, 32, G.rng(241), [[8], [4, 12]], FILL);
    rect(ctx, 64, 32, 1, 16, "4");
    stoneBlocks(ctx, 80, 32, G.rng(242), [[8], [4, 12]], FILL);
    rect(ctx, 80, 32, 16, 1, "4");
    rect(ctx, 95, 32, 1, 16, "1");
    /* ceiling edge — fill with a ragged lit-from-below lip */
    rnd = G.rng(243);
    stoneBlocks(ctx, 96, 32, rnd, [[6], [3, 10]], FILL);
    for (x = 0; x < 16; x++) {
      var d = 12 + Math.floor(rnd() * 4);
      ctx.clearRect(96 + x, 32 + d, 1, 16 - d);
      px(ctx, 96 + x, 32 + d - 1, "3");
    }
    return s.c;
  }

  /* ======================================================================
     Moss — 16×16 cells, 9 cols (ASSETS.md §6). Transparent overlays.
     patch S, M, L · corner TL · corner TR · edge bottom · vine S, M, L
     Floor patches are drawn 4px above the tile so tufts poke up.
     ====================================================================== */

  function mossPatch(ctx, ox, rnd, x0, x1) {
    for (var x = x0; x <= x1; x++) {
      var edge = Math.min(x - x0, x1 - x);
      var tuft = edge > 0 && rnd() < 0.55 ? 1 + Math.floor(rnd() * 3) : 0;
      var drip = edge > 0 ? 1 + Math.floor(rnd() * (edge > 1 ? 4 : 2)) : 1;
      for (var t = 1; t <= tuft; t++) px(ctx, ox + x, 4 - t, t === tuft ? "e" : "d");
      px(ctx, ox + x, 4, "d");
      px(ctx, ox + x, 5, "c");
      for (var y = 6; y < 6 + drip; y++) px(ctx, ox + x, y, y === 5 + drip ? "a" : "b");
    }
  }

  function vine(ctx, ox, rnd, x, len) {
    for (var y = 0; y < len; y++) {
      px(ctx, ox + x, y, y % 3 === 0 ? "c" : "b");
      if (y > 1 && y % 3 === 1) {
        var side = rnd() < 0.5 ? -1 : 1;
        px(ctx, ox + x + side, y, "d");
        if (rnd() < 0.5) px(ctx, ox + x + side, y - 1, "e");
      }
    }
    px(ctx, ox + x, len, "e");
  }

  function bakeMoss() {
    var s = canvas(144, 16);
    var ctx = s.ctx;
    mossPatch(ctx, 0, G.rng(300), 5, 10);
    mossPatch(ctx, 16, G.rng(301), 2, 12);
    mossPatch(ctx, 32, G.rng(302), 0, 15);
    /* corners: moss spilling over an edge and down a side */
    var rnd = G.rng(303);
    mossPatch(ctx, 48, rnd, 0, 8);
    for (var y = 4; y < 12; y++) px(ctx, 48, y, y < 9 ? "c" : "b");
    rnd = G.rng(304);
    mossPatch(ctx, 64, rnd, 7, 15);
    for (y = 4; y < 12; y++) px(ctx, 79, y, y < 9 ? "c" : "b");
    /* edge bottom — hanging from a ceiling lip */
    rnd = G.rng(305);
    for (var x = 0; x < 16; x++) {
      var d = 1 + Math.floor(rnd() * 5);
      px(ctx, 80 + x, 0, "c");
      for (y = 1; y < d; y++) px(ctx, 80 + x, y, y === d - 1 ? "a" : "b");
      if (rnd() < 0.2) px(ctx, 80 + x, d, "d");
    }
    vine(ctx, 96, G.rng(306), 8, 6);
    vine(ctx, 112, G.rng(307), 7, 10);
    vine(ctx, 128, G.rng(308), 8, 14);
    return s.c;
  }

  /* ======================================================================
     Monolith — 32×48 cells, 4 cols (ASSETS.md §7)
     0 dormant · 1 igniting · 2 lit · 3 rune-glow overlay (additive)
     ====================================================================== */

  var RUNES = [
    "0110 1001 0110 0100",
    "1000 1110 1001 1110",
    "0110 0100 0110 0010",
    "1001 1111 1001 1001",
    "0010 0111 0010 0110",
    "1111 0100 0010 1111"
  ].map(bits);

  function monolithShape(x, y) {
    /* returns [x0, x1] span for row y, or null */
    if (y <= 5) {
      var hw = [2, 3, 5, 6, 8, 9][y];
      return [16 - hw, 16 + hw - 1];
    }
    if (y <= 7) return [5, 26];
    if (y <= 41) return [6, 25];
    if (y <= 43) return [4, 27];
    return [2, 29];
  }

  function drawMonolith(ctx, ox, state) {
    var rnd = G.rng(400);
    var y, x, span;
    var RUNE = [
      ["1", "0"],
      ["h", "g"],
      ["j", "i"]
    ];
    var FRAME = ["2", "g", "h"];

    if (state < 3) {
      for (y = 0; y < 48; y++) {
        span = monolithShape(0, y);
        for (x = span[0]; x <= span[1]; x++) {
          var k = "3";
          var fromL = x - span[0];
          var fromR = span[1] - x;
          if (fromL === 0) k = "5";
          else if (fromL === 1) k = "4";
          else if (fromR === 0) k = "1";
          else if (fromR <= 2) k = "2";
          else if (rnd() < 0.06) k = "2";
          else if (rnd() < 0.04) k = "4";
          px(ctx, ox + x, y, k);
        }
      }
      /* block tops catch the light */
      rect(ctx, ox + 5, 6, 22, 1, "4");
      rect(ctx, ox + 6, 8, 20, 1, "1");
      rect(ctx, ox + 4, 42, 24, 1, "4");
      rect(ctx, ox + 2, 44, 28, 1, "5");
      rect(ctx, ox + 2, 47, 28, 1, "1");
      /* tip */
      if (state === 1) {
        rect(ctx, ox + 14, 0, 4, 1, "h");
        rect(ctx, ox + 13, 1, 6, 1, "g");
      } else if (state === 2) {
        rect(ctx, ox + 14, 0, 4, 1, "j");
        rect(ctx, ox + 13, 1, 6, 1, "i");
        rect(ctx, ox + 12, 2, 8, 1, "h");
      }
      /* recessed rune panel */
      rect(ctx, ox + 11, 10, 10, 29, FRAME[state]);
      rect(ctx, ox + 12, 11, 8, 27, "2");
      rect(ctx, ox + 12, 11, 8, 1, "1");
      rect(ctx, ox + 12, 11, 1, 27, "1");
      /* crack on the shadow side */
      var cx = 22;
      for (y = 18; y < 31; y++) {
        px(ctx, ox + cx, y, "1");
        if (y % 3 === 0) cx += y % 2 ? 1 : -1;
      }
      /* moss creeping up the plinth */
      var mr = G.rng(401);
      for (x = 2; x < 14; x++) {
        var hgt = Math.floor(mr() * (x < 8 ? 5 : 3));
        for (y = 0; y < hgt; y++) px(ctx, ox + x, 44 - y, y === hgt - 1 ? "d" : "c");
      }
      for (x = 5; x < 11; x++) if (mr() < 0.6) px(ctx, ox + x, 41 - Math.floor(mr() * 2), "c");
    }

    /* runes */
    for (var r = 0; r < 5; r++) {
      var glyph = RUNES[(r * 2 + 1) % RUNES.length];
      var gy = 13 + r * 5;
      for (y = 0; y < 4; y++) {
        for (x = 0; x < 4; x++) {
          if (!glyph[y][x]) continue;
          if (state === 3) {
            px(ctx, ox + 14 + x, gy + y, "w");
          } else {
            px(ctx, ox + 14 + x, gy + y, RUNE[state][0]);
            if (state > 0) px(ctx, ox + 14 + x, gy + y + 1, RUNE[state][1]);
          }
        }
      }
    }
    if (state === 3) {
      /* soft halo around the runes and tip — the one semi-transparent cell */
      ctx.globalAlpha = 0.45;
      rect(ctx, ox + 13, 12, 6, 25, "n");
      rect(ctx, ox + 13, 0, 6, 3, "n");
      ctx.globalAlpha = 1;
      rect(ctx, ox + 14, 0, 4, 1, "w");
    }
  }

  function bakeMonolith() {
    var s = canvas(128, 48);
    for (var i = 0; i < 4; i++) drawMonolith(s.ctx, i * 32, i);
    return s.c;
  }

  /* ======================================================================
     Structures (ASSETS.md §8)
     ====================================================================== */

  /* Archway 96×96 — pediment, name-plate lintel, two fluted pillars, an
     arch ring with a gold keystone. Name and numeral are drawn at runtime. */
  function bakeArchway() {
    var s = canvas(96, 96);
    var ctx = s.ctx;
    var x, y;
    var rnd = G.rng(500);

    /* pediment */
    for (y = 0; y < 12; y++) {
      var hw = 14 + y * 3;
      rect(ctx, 48 - hw, y, hw * 2, 1, "3");
      px(ctx, 48 - hw, y, "5");
      px(ctx, 48 - hw + 1, y, "4");
      px(ctx, 48 + hw - 1, y, "1");
    }
    rect(ctx, 34, 0, 28, 1, "5");
    /* numeral plate */
    rect(ctx, 36, 2, 24, 10, "g");
    rect(ctx, 37, 3, 22, 8, "1");

    /* lintel with name plate */
    rect(ctx, 0, 12, 96, 12, "3");
    rect(ctx, 0, 12, 96, 1, "5");
    rect(ctx, 0, 13, 96, 1, "4");
    rect(ctx, 0, 23, 96, 1, "1");
    rect(ctx, 6, 14, 84, 9, "g");
    rect(ctx, 7, 15, 82, 7, "0");
    rect(ctx, 7, 14, 82, 1, "h");

    /* arch ring */
    for (x = 16; x < 80; x++) {
      var t = (x - 47.5) / 32;
      var inner = 24 + 6 + Math.round((1 - Math.sqrt(Math.max(0, 1 - t * t))) * 20);
      for (y = 24; y < inner; y++) {
        var k = y === inner - 1 ? "2" : "3";
        if (y === 24) k = "1";
        if (rnd() < 0.05) k = "2";
        px(ctx, x, y, k);
      }
      /* voussoir joints */
      if (x % 8 === 0) for (y = 25; y < inner; y++) px(ctx, x, y, "1");
    }
    /* keystone */
    rect(ctx, 44, 24, 8, 8, "h");
    rect(ctx, 44, 24, 8, 1, "j");
    rect(ctx, 44, 24, 1, 8, "i");
    rect(ctx, 51, 25, 1, 7, "g");
    rect(ctx, 45, 31, 6, 1, "f");

    /* pillars */
    function pillar(px0) {
      rect(ctx, px0, 24, 18, 4, "3");
      rect(ctx, px0, 24, 18, 1, "5");
      rect(ctx, px0, 27, 18, 1, "1");
      rect(ctx, px0 + 1, 28, 16, 1, "h");
      for (var yy = 29; yy < 90; yy++) {
        px(ctx, px0 + 2, yy, "5");
        px(ctx, px0 + 3, yy, "4");
        rect(ctx, px0 + 4, yy, 8, 1, "3");
        px(ctx, px0 + 6, yy, "2");
        px(ctx, px0 + 10, yy, "2");
        rect(ctx, px0 + 12, yy, 2, 1, "2");
        rect(ctx, px0 + 14, yy, 2, 1, "1");
      }
      rect(ctx, px0 + 1, 89, 16, 1, "g");
      rect(ctx, px0, 90, 18, 6, "3");
      rect(ctx, px0, 90, 18, 1, "4");
      rect(ctx, px0, 95, 18, 1, "1");
      rect(ctx, px0 + 13, 91, 5, 4, "2");
    }
    pillar(0);
    pillar(78);

    /* moss and vines hanging from the lintel */
    var mr = G.rng(501);
    for (x = 0; x < 96; x++) {
      if (mr() < 0.35) {
        var len = 1 + Math.floor(mr() * (mr() < 0.15 ? 9 : 3));
        for (y = 0; y < len; y++) px(ctx, x, 24 + y, y === len - 1 ? "d" : y % 2 ? "b" : "c");
      }
    }
    for (x = 0; x < 18; x++) if (mr() < 0.7) px(ctx, x, 88 - Math.floor(mr() * 3), "c");
    return s.c;
  }

  /* Atrium slab 160×96 — the engraved name, baked into the art. */
  function bakeSlab() {
    var s = canvas(160, 96);
    var ctx = s.ctx;
    var rnd = G.rng(600);
    var x, y;

    /* tablet */
    rect(ctx, 6, 0, 148, 86, "2");
    for (y = 0; y < 86; y++) {
      for (x = 6; x < 154; x++) {
        var r = rnd();
        if (r < 0.05) px(ctx, x, y, "1");
        else if (r < 0.09) px(ctx, x, y, "3");
      }
    }
    rect(ctx, 6, 0, 148, 2, "5");
    rect(ctx, 6, 0, 2, 86, "5");
    rect(ctx, 8, 2, 144, 1, "4");
    rect(ctx, 8, 2, 1, 83, "4");
    rect(ctx, 152, 0, 2, 86, "1");
    rect(ctx, 6, 84, 148, 2, "1");
    /* rounded corners */
    ctx.clearRect(6, 0, 2, 1);
    ctx.clearRect(6, 0, 1, 2);
    ctx.clearRect(152, 0, 2, 1);
    ctx.clearRect(153, 0, 1, 2);

    /* engraved gold border */
    rect(ctx, 13, 6, 134, 1, "h");
    rect(ctx, 13, 78, 134, 1, "h");
    rect(ctx, 13, 6, 1, 73, "h");
    rect(ctx, 146, 6, 1, 73, "h");
    rect(ctx, 14, 7, 132, 1, "f");
    rect(ctx, 14, 7, 1, 71, "f");
    /* corner studs */
    [[12, 5], [145, 5], [12, 77], [145, 77]].forEach(function (p) {
      rect(ctx, p[0], p[1], 3, 3, "i");
      px(ctx, p[0], p[1], "j");
    });

    /* the lettering */
    G.font.draw(ctx, "MEEZAAN", 80, 11, { color: P.j, shadow: P.f, scale: 2, align: "center" });
    G.font.draw(ctx, "CHISHTY", 80, 28, { color: P.j, shadow: P.f, scale: 2, align: "center" });
    rect(ctx, 34, 46, 92, 1, "h");
    rect(ctx, 35, 47, 92, 1, "f");
    rect(ctx, 78, 45, 4, 3, "i");
    G.font.draw(ctx, "AI/ML ENGINEER", 80, 52, { color: P.i, shadow: P.f, align: "center" });
    G.font.draw(ctx, "BACKEND DEVELOPER", 80, 61, { color: P.i, shadow: P.f, align: "center" });
    G.font.draw(ctx, "PRODUCT BUILDER", 80, 70, { color: P.i, shadow: P.f, align: "center" });

    /* cracks */
    var cx = 140;
    for (y = 30; y < 60; y++) {
      px(ctx, cx, y, "0");
      if (rnd() < 0.4) cx += rnd() < 0.5 ? -1 : 1;
    }

    /* plinth */
    rect(ctx, 0, 86, 160, 10, "3");
    rect(ctx, 0, 86, 160, 1, "5");
    rect(ctx, 0, 87, 160, 1, "4");
    rect(ctx, 0, 95, 160, 1, "1");
    for (x = 16; x < 160; x += 24) rect(ctx, x, 88, 1, 7, "2");

    /* moss creeping over the top-left and along the base */
    var mr = G.rng(601);
    for (x = 6; x < 60; x++) {
      var depth = Math.max(0, Math.round((60 - x) / 7 + mr() * 3 - 1));
      for (y = 0; y < depth; y++) px(ctx, x, y, y === depth - 1 ? "b" : y === 0 ? "d" : "c");
      if (depth && mr() < 0.2) {
        var len = 3 + Math.floor(mr() * 10);
        for (y = depth; y < depth + len; y++) px(ctx, x, y, y % 2 ? "b" : "c");
        px(ctx, x, depth + len, "e");
      }
    }
    for (y = 0; y < 40; y++) if (mr() < 0.6) px(ctx, 6 + Math.floor(mr() * 3), y, "c");
    for (x = 0; x < 160; x++) {
      var h = mr() < 0.5 ? Math.floor(mr() * 4) : 0;
      for (y = 0; y < h; y++) px(ctx, x, 86 - y, y === h - 1 ? "e" : "d");
    }
    return s.c;
  }

  /* Shrine 48×64 — contact altar. The flame above the bowl is animated in
     the renderer; shrine-glow is its additive overlay. */
  function bakeShrine() {
    var s = canvas(48, 64);
    var ctx = s.ctx;
    /* steps */
    rect(ctx, 0, 56, 48, 8, "3");
    rect(ctx, 0, 56, 48, 1, "5");
    rect(ctx, 0, 63, 48, 1, "1");
    rect(ctx, 6, 50, 36, 6, "3");
    rect(ctx, 6, 50, 36, 1, "5");
    rect(ctx, 6, 55, 36, 1, "2");
    /* pedestal */
    for (var y = 26; y < 50; y++) {
      px(ctx, 14, y, "5");
      px(ctx, 15, y, "4");
      rect(ctx, 16, y, 13, 1, "3");
      rect(ctx, 29, y, 3, 1, "2");
      px(ctx, 32, y, "1");
      px(ctx, 33, y, "1");
    }
    rect(ctx, 14, 29, 20, 2, "h");
    rect(ctx, 14, 29, 20, 1, "i");
    rect(ctx, 14, 46, 20, 2, "h");
    rect(ctx, 14, 47, 20, 1, "g");
    /* engraved sigil */
    rect(ctx, 21, 34, 6, 8, "1");
    rect(ctx, 22, 35, 4, 6, "g");
    rect(ctx, 23, 36, 2, 4, "i");
    /* bowl */
    for (y = 18; y < 26; y++) {
      var inset = Math.floor((y - 18) * 0.8);
      rect(ctx, 8 + inset, y, 32 - inset * 2, 1, y < 20 ? "i" : y > 23 ? "g" : "h");
      px(ctx, 8 + inset, y, "j");
      px(ctx, 39 - inset, y, "f");
    }
    rect(ctx, 8, 18, 32, 1, "j");
    rect(ctx, 10, 17, 28, 1, "k");
    /* moss on the steps */
    var mr = G.rng(700);
    for (var x = 0; x < 48; x++) if (mr() < 0.4) px(ctx, x, 55 - Math.floor(mr() * 2), mr() < 0.5 ? "d" : "c");
    return s.c;
  }

  function bakeShrineGlow() {
    var s = canvas(48, 64);
    var ctx = s.ctx;
    ctx.globalAlpha = 0.5;
    rect(ctx, 10, 12, 28, 8, "n");
    rect(ctx, 21, 34, 6, 8, "n");
    ctx.globalAlpha = 1;
    return s.c;
  }

  /* ======================================================================
     Props (ASSETS.md §9)
     ====================================================================== */

  function bakeTorch() {
    var s = canvas(64, 16);
    var ctx = s.ctx;
    var FLAMES = [
      [1, 4, 6, 7, 4, 1],
      [2, 5, 7, 6, 3, 1],
      [1, 3, 6, 8, 5, 2],
      [2, 4, 7, 6, 4, 1]
    ];
    FLAMES.forEach(function (heights, f) {
      var ox = f * 16;
      /* wall plate + arm */
      rect(ctx, ox + 6, 11, 4, 4, "2");
      px(ctx, ox + 6, 11, "4");
      px(ctx, ox + 9, 14, "1");
      rect(ctx, ox + 7, 10, 2, 1, "1");
      /* cup */
      rect(ctx, ox + 5, 8, 6, 2, "g");
      rect(ctx, ox + 5, 8, 6, 1, "h");
      px(ctx, ox + 10, 9, "f");
      /* flame */
      heights.forEach(function (h, i) {
        var x = ox + 5 + i;
        for (var y = 8 - h; y < 8; y++) {
          var k = "l";
          if (y === 8 - h) k = h > 2 ? "l" : "k";
          else if ((i === 2 || i === 3) && y >= 5) k = "n";
          else if (i >= 1 && i <= 4) k = "m";
          px(ctx, x, y, k);
        }
      });
    });
    return s.c;
  }

  function bakeProps16() {
    var s = canvas(192, 16);
    var ctx = s.ctx;
    var rnd, x, y;

    function rock(ox, cx, w, h, seed) {
      var r = G.rng(seed);
      for (var yy = 0; yy < h; yy++) {
        var hw = Math.round((w / 2) * Math.sqrt(1 - Math.pow((h - yy) / h, 2)) + r() * 0.8);
        for (var xx = cx - hw; xx <= cx + hw; xx++) {
          var k = "3";
          if (xx === cx - hw || yy === 0) k = "4";
          else if (xx >= cx + hw - 1) k = "2";
          px(ctx, ox + xx, 16 - h + yy, k);
        }
      }
      px(ctx, ox + cx - 1, 16 - h, "5");
    }
    /* rubble A, B */
    rock(0, 4, 5, 3, 800);
    rock(0, 10, 7, 5, 801);
    rock(0, 14, 3, 2, 802);
    rock(16, 5, 7, 4, 803);
    rock(16, 11, 5, 3, 804);
    rock(16, 2, 2, 2, 805);
    /* rock small, large */
    rock(32, 8, 7, 5, 806);
    rock(48, 8, 13, 10, 807);
    /* roots A, B — hanging */
    [[64, 810], [80, 811]].forEach(function (p) {
      rnd = G.rng(p[1]);
      for (var n = 0; n < 3; n++) {
        x = 3 + Math.floor(rnd() * 10);
        var len = 6 + Math.floor(rnd() * 9);
        for (y = 0; y < len; y++) {
          px(ctx, p[0] + x, y, y % 4 === 3 ? "o" : "p");
          if (rnd() < 0.25) x += rnd() < 0.5 ? -1 : 1;
        }
      }
    });
    /* chain */
    for (y = 0; y < 16; y += 4) {
      rect(ctx, 96 + 7, y, 2, 3, "3");
      px(ctx, 96 + 7, y, "5");
      px(ctx, 96 + 8, y + 2, "1");
      px(ctx, 96 + 7, y + 3, "2");
    }
    /* bone */
    rect(ctx, 114, 12, 9, 2, "6");
    rect(ctx, 113, 11, 2, 2, "w");
    rect(ctx, 113, 13, 2, 2, "6");
    rect(ctx, 122, 11, 2, 2, "w");
    rect(ctx, 122, 13, 2, 2, "6");
    rect(ctx, 115, 13, 7, 1, "5");
    /* crack decals */
    [[128, 820, 14], [144, 821, 10]].forEach(function (p) {
      rnd = G.rng(p[1]);
      crack(ctx, p[0], 0, rnd, "1", p[2]);
    });
    /* keycaps E, ↑ */
    [[160, "E"], [176, "↑"]].forEach(function (p) {
      rect(ctx, p[0] + 2, 2, 12, 12, "1");
      rect(ctx, p[0] + 2, 2, 12, 10, "4");
      rect(ctx, p[0] + 2, 2, 12, 1, "6");
      G.font.draw(ctx, p[1], p[0] + 8, 4, { color: P["1"], align: "center" });
    });
    return s.c;
  }

  function bakeProps32() {
    var s = canvas(64, 32);
    var ctx = s.ctx;
    var y, x;
    /* broken column */
    for (y = 8; y < 32; y++) {
      px(ctx, 3, y, "5");
      px(ctx, 4, y, "4");
      rect(ctx, 5, y, 5, 1, "3");
      px(ctx, 7, y, "2");
      rect(ctx, 10, y, 2, 1, "2");
      px(ctx, 12, y, "1");
    }
    var tops = [9, 8, 10, 7, 9, 11, 8, 10, 12, 10];
    tops.forEach(function (t, i) {
      ctx.clearRect(3 + i, 8, 1, t - 8);
      px(ctx, 3 + i, t, "4");
    });
    rect(ctx, 1, 28, 14, 4, "3");
    rect(ctx, 1, 28, 14, 1, "4");
    /* stalagmite */
    for (y = 4; y < 32; y++) {
      var hw = Math.round(((y - 4) / 28) * 6);
      for (x = 24 - hw; x <= 24 + hw; x++) {
        var k = x < 24 - hw + 2 ? "4" : x > 24 + hw - 2 ? "2" : "3";
        px(ctx, x, y, k);
      }
    }
    px(ctx, 24, 4, "5");
    /* banner */
    rect(ctx, 33, 0, 14, 2, "g");
    rect(ctx, 33, 0, 14, 1, "h");
    for (y = 2; y < 26; y++) {
      rect(ctx, 34, y, 12, 1, "t");
      px(ctx, 34, y, "u");
      px(ctx, 45, y, "s");
    }
    rect(ctx, 34, 2, 12, 1, "s");
    for (x = 0; x < 6; x++) {
      rect(ctx, 34 + x, 26 + x, 1, 1, "t");
      rect(ctx, 45 - x, 26 + x, 1, 1, "t");
    }
    rect(ctx, 38, 8, 4, 10, "h");
    rect(ctx, 39, 10, 2, 6, "j");
    /* pipe / conduit */
    rect(ctx, 53, 0, 6, 32, "2");
    rect(ctx, 53, 0, 1, 32, "4");
    rect(ctx, 58, 0, 1, 32, "1");
    for (y = 4; y < 32; y += 10) {
      rect(ctx, 52, y, 8, 2, "3");
      rect(ctx, 52, y, 8, 1, "5");
    }
    return s.c;
  }

  /* Signpost 72×32 — wooden board with an arrow tip on a post. The words
     are lettered at runtime so the same board can say anything. */
  function bakeSignpost() {
    var s = canvas(72, 32);
    var ctx = s.ctx;
    /* post */
    rect(ctx, 30, 14, 4, 18, "p");
    rect(ctx, 30, 14, 1, 18, "q");
    rect(ctx, 33, 14, 1, 18, "o");
    rect(ctx, 27, 29, 10, 3, "3");
    rect(ctx, 27, 29, 10, 1, "4");
    /* board with an arrow-shaped right end */
    for (var y = 2; y < 16; y++) {
      var tip = 7 - Math.abs(y - 8.5) | 0;
      rect(ctx, 0, y, 64 + tip, 1, "p");
      px(ctx, 63 + tip, y, "o");
    }
    rect(ctx, 0, 2, 64, 1, "q");
    rect(ctx, 0, 2, 1, 14, "q");
    rect(ctx, 0, 15, 64, 1, "o");
    /* grain + nails */
    var rnd = G.rng(950);
    for (var i = 0; i < 18; i++) rect(ctx, 2 + Math.floor(rnd() * 58), 4 + Math.floor(rnd() * 10), 3, 1, "o");
    px(ctx, 3, 4, "6");
    px(ctx, 3, 13, "6");
    return s.c;
  }

  /* Signboard 112×40 — the wide two-line board that stands before every
     portal: a small top line ("NEXT") over the room name, arrow tip
     pointing right at the portal. Lettered at runtime, like the signpost. */
  function bakeSignboard() {
    var s = canvas(112, 40);
    var ctx = s.ctx;
    /* post */
    rect(ctx, 54, 26, 4, 14, "p");
    rect(ctx, 54, 26, 1, 14, "q");
    rect(ctx, 57, 26, 1, 14, "o");
    rect(ctx, 50, 37, 12, 3, "3");
    rect(ctx, 50, 37, 12, 1, "4");
    /* board with an arrow-shaped right end */
    for (var y = 1; y < 26; y++) {
      var tip = Math.max(0, 8 - Math.abs(y - 13));
      rect(ctx, 0, y, 104 + tip, 1, "p");
      px(ctx, 103 + tip, y, "o");
    }
    rect(ctx, 0, 1, 104, 1, "q");
    rect(ctx, 0, 1, 1, 25, "q");
    rect(ctx, 0, 25, 104, 1, "o");
    /* a seam between the two lines, grain + nails */
    rect(ctx, 2, 13, 100, 1, "o");
    var rnd = G.rng(951);
    for (var i = 0; i < 16; i++) rect(ctx, 2 + Math.floor(rnd() * 98), 3 + Math.floor(rnd() * 21), 3, 1, "o");
    px(ctx, 3, 3, "6");
    px(ctx, 3, 23, "6");
    px(ctx, 99, 3, "6");
    px(ctx, 99, 23, "6");
    return s.c;
  }

  /* Portal 32×48 — a rune-cut stone ring on a plinth. The opening is left
     transparent: the renderer paints the swirling vortex behind it. */
  function bakePortal() {
    var s = canvas(32, 48);
    var ctx = s.ctx;
    function outer(x, y) {
      if (x < 0 || x > 31 || y < 0) return false;
      if (y >= 16) return true;
      var dx = x - 15.5;
      var dy = y - 16;
      return dx * dx + dy * dy <= 256;
    }
    function inner(x, y) {
      if (y > 43) return false;
      if (y >= 16) return x >= 6 && x <= 25;
      var dx = x - 15.5;
      var dy = y - 16;
      return dx * dx + dy * dy <= 100;
    }
    for (var y = 0; y < 44; y++) {
      for (var x = 0; x < 32; x++) {
        if (!outer(x, y) || inner(x, y)) continue;
        var k = "4";
        if (!outer(x - 1, y) || !outer(x, y - 1)) k = "5";
        else if (!outer(x + 1, y)) k = "2";
        else if (inner(x - 1, y) || inner(x + 1, y) || inner(x, y + 1)) k = "1";
        else if (y >= 16 && (y - 16) % 8 === 7) k = "3";
        else if (y < 16) {
          var deg = (Math.atan2(y - 16, x - 15.5) * 180) / Math.PI + 180;
          if (deg % 30 < 4) k = "3";
        }
        px(ctx, x, y, k);
      }
    }
    /* plinth */
    rect(ctx, 0, 44, 32, 4, "3");
    rect(ctx, 0, 44, 32, 1, "5");
    rect(ctx, 0, 47, 32, 1, "1");
    /* gold keystone and runes */
    rect(ctx, 13, 0, 6, 4, "h");
    rect(ctx, 14, 1, 4, 2, "i");
    [[2, 22], [2, 32], [28, 22], [28, 32], [4, 10], [26, 10]].forEach(function (r) {
      px(ctx, r[0], r[1], "i");
      px(ctx, r[0] + 1, r[1], "h");
      px(ctx, r[0], r[1] + 1, "h");
    });
    return s.c;
  }

  /* ======================================================================
     Parallax backgrounds (ASSETS.md §10). Tile seamlessly left↔right:
     every shape is drawn at x and x ± width.
     ====================================================================== */

  function wrapRect(ctx, W, x, y, w, h, k) {
    rect(ctx, x, y, w, h, k);
    if (x + w > W) rect(ctx, x - W, y, w, h, k);
    if (x < 0) rect(ctx, x + W, y, w, h, k);
  }

  function bakeBgFar() {
    var W = 320;
    var s = canvas(W, 180);
    var ctx = s.ctx;
    var rnd = G.rng(900);
    rect(ctx, 0, 0, W, 180, "0");
    /* colossal distant arches */
    for (var a = 0; a < 3; a++) {
      var cx = 50 + a * 110;
      for (var x = -44; x <= 44; x++) {
        var t = x / 44;
        var top = 40 + Math.round((1 - Math.sqrt(1 - t * t)) * 50);
        var inner = Math.abs(x) < 30 ? 60 + Math.round((1 - Math.sqrt(1 - Math.pow(x / 30, 2))) * 60) : 180;
        wrapRect(ctx, W, cx + x, top, 1, Math.min(inner, 180) - top, "1");
      }
      wrapRect(ctx, W, cx - 44, 40, 1, 140, "2");
    }
    /* distant braziers */
    for (var i = 0; i < 7; i++) {
      var bx = Math.floor(rnd() * W);
      var by = 95 + Math.floor(rnd() * 40);
      wrapRect(ctx, W, bx, by, 1, 1, rnd() < 0.5 ? "k" : "l");
    }
    /* dust stars */
    for (i = 0; i < 40; i++) wrapRect(ctx, W, Math.floor(rnd() * W), Math.floor(rnd() * 180), 1, 1, "2");
    return s.c;
  }

  function bakeBgMid() {
    var W = 320;
    var s = canvas(W, 180);
    var ctx = s.ctx;
    var rnd = G.rng(910);
    for (var p = 0; p < 4; p++) {
      var x0 = p * 80 + 10;
      wrapRect(ctx, W, x0, 20, 18, 160, "1");
      wrapRect(ctx, W, x0, 20, 2, 160, "2");
      wrapRect(ctx, W, x0 - 3, 20, 24, 6, "1");
      wrapRect(ctx, W, x0 - 3, 20, 24, 1, "2");
      /* arch to the next pillar */
      for (var x = 0; x < 62; x++) {
        var t = (x - 31) / 31;
        var y = 26 + Math.round((1 - Math.sqrt(1 - t * t)) * 22);
        wrapRect(ctx, W, x0 + 18 + x, 20, 1, y - 20, "1");
      }
      /* hanging chain */
      var cx = x0 + 40 + Math.floor(rnd() * 20);
      var len = 20 + Math.floor(rnd() * 40);
      for (var yy = 30; yy < 30 + len; yy += 3) wrapRect(ctx, W, cx, yy, 1, 2, "2");
    }
    return s.c;
  }

  function bakeBgNear() {
    var W = 320;
    var s = canvas(W, 48);
    var ctx = s.ctx;
    var rnd = G.rng(920);
    for (var i = 0; i < 9; i++) {
      var cx = Math.floor(rnd() * W);
      var h = 6 + Math.floor(rnd() * 16);
      var w = 6 + Math.floor(rnd() * 14);
      for (var x = -w; x <= w; x++) {
        var col = Math.round(h * Math.sqrt(Math.max(0, 1 - Math.pow(x / w, 2))) + rnd());
        wrapRect(ctx, W, cx + x, 48 - col, 1, col, "0");
        wrapRect(ctx, W, cx + x, 48 - col, 1, 1, "1");
      }
    }
    return s.c;
  }

  /* ======================================================================
     Registry + loader
     ====================================================================== */

  var SHEETS = {
    char: { cw: 16, ch: 24, bake: bakeChar },
    tiles: { cw: 16, ch: 16, bake: bakeTiles },
    moss: { cw: 16, ch: 16, bake: bakeMoss },
    monolith: { cw: 32, ch: 48, bake: bakeMonolith },
    archway: { cw: 96, ch: 96, bake: bakeArchway },
    slab: { cw: 160, ch: 96, bake: bakeSlab },
    shrine: { cw: 48, ch: 64, bake: bakeShrine },
    shrineGlow: { cw: 48, ch: 64, bake: bakeShrineGlow },
    torch: { cw: 16, ch: 16, bake: bakeTorch },
    props16: { cw: 16, ch: 16, bake: bakeProps16 },
    props32: { cw: 16, ch: 32, bake: bakeProps32 },
    signpost: { cw: 72, ch: 32, bake: bakeSignpost },
    signboard: { cw: 112, ch: 40, bake: bakeSignboard },
    portal: { cw: 32, ch: 48, bake: bakePortal },
    bgFar: { cw: 320, ch: 180, bake: bakeBgFar },
    bgMid: { cw: 320, ch: 180, bake: bakeBgMid },
    bgNear: { cw: 320, ch: 48, bake: bakeBgNear }
  };

  var baked = {};
  var mirrored = {};

  function load(done) {
    var pending = 0;
    Object.keys(SHEETS).forEach(function (name) {
      baked[name] = SHEETS[name].bake();
      if (OVERRIDES[name]) {
        pending++;
        var img = new Image();
        img.onload = function () {
          baked[name] = img;
          delete mirrored[name];
          if (--pending === 0) done();
        };
        img.onerror = function () {
          /* Keep the code art if a hand-drawn file is missing. */
          if (--pending === 0) done();
        };
        img.src = OVERRIDES[name];
      }
    });
    if (pending === 0) done();
  }

  /* Horizontally mirrored copy, cell by cell, for left-facing sprites. */
  function mirror(name) {
    if (mirrored[name]) return mirrored[name];
    var src = baked[name];
    var def = SHEETS[name];
    var s = canvas(src.width, src.height);
    var cols = Math.floor(src.width / def.cw);
    for (var c = 0; c < cols; c++) {
      s.ctx.save();
      s.ctx.translate(c * def.cw * 2 + def.cw, 0);
      s.ctx.scale(-1, 1);
      s.ctx.drawImage(src, c * def.cw, 0, def.cw, src.height, c * def.cw, 0, def.cw, src.height);
      s.ctx.restore();
    }
    mirrored[name] = s.c;
    return s.c;
  }

  /* draw(ctx, sheet, col, row, x, y, flip) */
  function draw(ctx, name, c, r, x, y, flip) {
    var def = SHEETS[name];
    var img = flip ? mirror(name) : baked[name];
    ctx.drawImage(img, c * def.cw, r * def.ch, def.cw, def.ch, Math.round(x), Math.round(y), def.cw, def.ch);
  }

  G.sprites = {
    load: load,
    draw: draw,
    sheet: function (name) {
      return baked[name];
    },
    size: function (name) {
      return SHEETS[name];
    },
    canvas: canvas,
    OVERRIDES: OVERRIDES
  };
})();
