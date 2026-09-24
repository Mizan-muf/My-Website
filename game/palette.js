/* ------------------------------------------------------------------------
   The 30-colour palette from ASSETS.md §1, keyed by one character so that
   sprite code can say px(x, y, "h") instead of repeating hex strings.
   Every baked sprite picks from this table — nothing else.
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var G = (window.G = window.G || {});

  G.PAL = {
    /* stone (cool grey) */
    "0": "#0b0b10", // void / deepest shadow
    "1": "#1a1a24", // stone shadow
    "2": "#2b2b3a", // stone dark
    "3": "#3f4054", // stone base
    "4": "#575a70", // stone light
    "5": "#757a91", // stone highlight
    "6": "#9aa0b3", // stone rim

    /* moss */
    a: "#16241a",
    b: "#263d24",
    c: "#3c5c2e",
    d: "#567a36",
    e: "#7a9c45",

    /* gold / engraving */
    f: "#4a3410",
    g: "#7a5518",
    h: "#b08424",
    i: "#d9ab3c",
    j: "#f5d97a",

    /* torch / warm light */
    k: "#6b2410",
    l: "#b5451c",
    m: "#e87a2a",
    n: "#ffc457",

    /* skin */
    o: "#3a2418",
    p: "#7a4a2e",
    q: "#b5794c",
    r: "#e0b088",

    /* cloth / accent */
    s: "#2a1c3a",
    t: "#4a3060",
    u: "#7a4f96",
    v: "#a878c4",

    /* neutral */
    w: "#f0f0f5"
  };

  /* Deterministic RNG so procedural art is identical on every load. */
  G.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* Small integer hash — stable per-tile variation without storing it. */
  G.hash = function (x, y) {
    var h = (x * 374761393 + y * 668265263) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
})();
