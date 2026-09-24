/* ------------------------------------------------------------------------
   Boot and wiring. Loaded last.
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var G = (window.G = window.G || {});
  G.state = { near: null, touch: false };

  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  G.reduced = !!(mq && mq.matches);
  if (mq && mq.addEventListener) {
    mq.addEventListener("change", function (e) {
      G.reduced = e.matches;
    });
  }

  var canvas = document.getElementById("screen");
  var W, player;
  var doorPush = 0;

  /* Touch layout reserves a control strip under the game in portrait. */
  G.resize = function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var portrait = G.state.touch && h > w;
    if (portrait) h -= 320; // HUD above, controls below — matches game.css
    G.render.resize(w, h, portrait ? 220 : 270, portrait ? 180 : 240);
    if (W) G.render.updateCamera(W, player, true);
  };

  function nearest() {
    var best = null;
    var bestD = Infinity;
    var pcx = player.x + player.w / 2;
    W.things.concat(W.door).forEach(function (t) {
      var d = Math.abs(pcx - t.cx);
      if (d < t.range && d < bestD) {
        best = t;
        bestD = d;
      }
    });
    return best;
  }

  function update(dt) {
    var input = G.engine.input;
    if (G.ui.isOpen()) return;

    if (input.mapPressed) {
      G.ui.openMap();
      return;
    }

    var near = nearest();
    G.state.near = near;
    G.state.px = player.x + player.w / 2;
    if (near && (input.readPressed || input.upPressed)) {
      G.ui.open(near);
      return;
    }

    /* walking into the plain-view doorway (← held against the wall) */
    if (near === W.door && (input.left || input.touchLeft) && player.x <= W.T * 2 + 0.5) {
      doorPush += dt;
      if (doorPush > 0.3) {
        doorPush = 0;
        G.engine.releaseAll();
        G.ui.goPlain();
        return;
      }
    } else {
      doorPush = 0;
    }

    /* ↑ is "read" in range and "jump" everywhere else */
    G.engine.stepPlayer(W, player, dt, input.jumpPressed || (input.upPressed && !near));

    W.things.forEach(function (t) {
      var target = t === near ? 1 : 0;
      t.glow += (target - t.glow) * Math.min(1, dt * (G.reduced ? 60 : 6));
    });

    G.render.updateCamera(W, player, false);
    G.render.updateParticles(W, dt);
  }

  function draw(dt) {
    G.render.frame(W, player, G.state, dt);
    G.ui.frame();
  }

  function boot() {
    G.sprites.load(function () {
      W = G.world.build(G.content);
      player = G.engine.createPlayer(W.spawn);
      G.render.init(canvas);
      G.resize();
      window.addEventListener("resize", G.resize);
      G.ui.init(W, player);
      G.render.updateCamera(W, player, true);
      document.body.classList.add("is-ready");
      canvas.focus();
      G.engine.start(update, draw);
      G.debug = { world: W, player: player };
    });
  }

  boot();
})();
