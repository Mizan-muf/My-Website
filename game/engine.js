/* ------------------------------------------------------------------------
   Engine — input, player physics, fixed-timestep loop.

   Movement is tuned to feel good, not to challenge: there is no fail
   state, and nothing ever requires a jump. Variable jump height (release
   early for a short hop), coyote time and a jump buffer make it forgiving.
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var G = (window.G = window.G || {});

  /* ======================================================================
     Input — keyboard + touch buttons write into the same flags.
     *Pressed flags are edges, cleared after each update step.
     ====================================================================== */

  var input = {
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressed: false,
    upPressed: false,
    readPressed: false,
    mapPressed: false,
    touchLeft: false,
    touchRight: false
  };

  var KEYS = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    Space: "jump",
    KeyZ: "jump",
    KeyK: "jump",
    ArrowUp: "up",
    KeyW: "up",
    KeyE: "read",
    Enter: "read",
    Tab: "map",
    KeyM: "map"
  };

  function onKey(e, down) {
    var act = KEYS[e.code];
    if (!act) return;
    /* Releases always count, even while a dialog is open — otherwise a key
       held when a panel opens stays "down" after it closes. */
    if (!down) {
      if (act === "left") input.left = false;
      else if (act === "right") input.right = false;
      else if (act === "jump") input.jumpHeld = false;
      else if (act === "up") input.upHeld = false;
    }
    if (G.ui && G.ui.isOpen()) return; // dialogs own the keyboard
    /* Let Tab / Enter behave normally on focused HUD controls. */
    var el = document.activeElement;
    var inHud = el && el !== document.body && el.id !== "screen";
    if (inHud && (act === "map" || act === "read" || act === "jump")) return;
    e.preventDefault();
    if (act === "left") input.left = down;
    else if (act === "right") input.right = down;
    else if (act === "jump") {
      if (down && !input.jumpHeld) input.jumpPressed = true;
      input.jumpHeld = down;
    } else if (act === "up") {
      if (down && !e.repeat) input.upPressed = true;
      /* ↑ doubles as jump when nothing is in range; hold it for height */
      input.upHeld = down;
    } else if (down && !e.repeat) {
      if (act === "read") input.readPressed = true;
      if (act === "map") input.mapPressed = true;
    }
  }

  window.addEventListener("keydown", function (e) {
    onKey(e, true);
  });
  window.addEventListener("keyup", function (e) {
    onKey(e, false);
  });
  function releaseAll() {
    input.left = input.right = input.jumpHeld = input.upHeld = false;
    input.touchLeft = input.touchRight = input.touchJump = false;
    clearEdges();
  }

  /* Losing focus mid-press must not leave the character walking. */
  window.addEventListener("blur", releaseAll);

  function clearEdges() {
    input.jumpPressed = input.upPressed = input.readPressed = input.mapPressed = false;
  }

  /* ======================================================================
     Player
     ====================================================================== */

  var RUN = 118;
  var ACCEL = 1500;
  var AIR_ACCEL = 950;
  var FRICTION = 1900;
  var AIR_DRAG = 420;
  var GRAVITY = 1000;
  var JUMP_V = 338;
  var MAX_FALL = 420;
  var COYOTE = 0.1;
  var BUFFER = 0.12;

  function createPlayer(spawn) {
    return {
      x: spawn.x,
      y: spawn.y,
      w: 10,
      h: 22,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      coyote: 0,
      buffer: 0,
      crouch: 0,
      land: 0,
      interact: 0,
      stride: 0,
      idleT: 0,
      row: 0,
      frame: 0,
      moved: 0
    };
  }

  function solidRect(W, x, y, w, h) {
    var T = W.T;
    var c0 = Math.floor(x / T);
    var c1 = Math.floor((x + w - 0.001) / T);
    var r0 = Math.floor(y / T);
    var r1 = Math.floor((y + h - 0.001) / T);
    for (var r = r0; r <= r1; r++) {
      for (var c = c0; c <= c1; c++) {
        if (W.solidAt(c, r)) return { c: c, r: r };
      }
    }
    return null;
  }

  function stepPlayer(W, p, dt, wantsJump) {
    var T = W.T;
    var dir = (input.right || input.touchRight ? 1 : 0) - (input.left || input.touchLeft ? 1 : 0);

    /* horizontal */
    if (dir) {
      p.vx += dir * (p.onGround ? ACCEL : AIR_ACCEL) * dt;
      p.vx = Math.max(-RUN, Math.min(RUN, p.vx));
      p.facing = dir;
    } else {
      var d = (p.onGround ? FRICTION : AIR_DRAG) * dt;
      p.vx = Math.abs(p.vx) <= d ? 0 : p.vx - Math.sign(p.vx) * d;
    }

    /* jump: buffered press + coyote time */
    if (wantsJump) p.buffer = BUFFER;
    else p.buffer = Math.max(0, p.buffer - dt);
    p.coyote = p.onGround ? COYOTE : Math.max(0, p.coyote - dt);
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -JUMP_V;
      p.buffer = 0;
      p.coyote = 0;
      p.crouch = 0.07;
      p.onGround = false;
    }

    /* gravity — heavier when rising without the button held (short hop) */
    var held = input.jumpHeld || input.upHeld || input.touchJump;
    var g = GRAVITY;
    if (p.vy < 0 && !held) g *= 2.4;
    else if (p.vy > 0) g *= 1.25;
    p.vy = Math.min(MAX_FALL, p.vy + g * dt);

    /* move X, resolve */
    var oldX = p.x;
    p.x += p.vx * dt;
    var hit = solidRect(W, p.x, p.y, p.w, p.h);
    if (hit) {
      p.x = p.vx > 0 ? hit.c * T - p.w : (hit.c + 1) * T;
      p.vx = 0;
    }
    p.moved += Math.abs(p.x - oldX);

    /* move Y, resolve */
    var wasGround = p.onGround;
    var fallSpeed = p.vy;
    p.y += p.vy * dt;
    p.onGround = false;
    hit = solidRect(W, p.x, p.y, p.w, p.h);
    if (hit) {
      if (p.vy > 0) {
        p.y = hit.r * T - p.h;
        p.onGround = true;
      } else {
        p.y = (hit.r + 1) * T;
      }
      p.vy = 0;
    }
    if (p.onGround && !wasGround && fallSpeed > 160) {
      p.land = 0.1;
      if (G.render) G.render.puff(p.x + p.w / 2, p.y + p.h, 5);
    }

    /* animation */
    p.crouch = Math.max(0, p.crouch - dt);
    p.land = Math.max(0, p.land - dt);
    p.interact = Math.max(0, p.interact - dt);
    if (p.interact > 0) {
      p.row = 3;
      p.frame = p.interact > 0.2 ? 0 : 1;
    } else if (p.crouch > 0) {
      p.row = 2;
      p.frame = 0;
    } else if (!p.onGround) {
      p.row = 2;
      p.frame = p.vy < 40 ? 1 : 2;
    } else if (p.land > 0) {
      p.row = 4;
      p.frame = 0;
    } else if (Math.abs(p.vx) > 10) {
      /* stride advances with distance, so feet never skate */
      p.stride += Math.abs(p.vx) * dt;
      p.row = 1;
      p.frame = Math.floor(p.stride / 7) % 6;
      p.idleT = 0;
    } else {
      p.idleT += dt;
      p.row = 0;
      p.frame = Math.floor(p.idleT / 0.18) % 4;
    }
  }

  /* ======================================================================
     Loop — fixed 60 Hz update, render on rAF
     ====================================================================== */

  var STEP = 1 / 60;

  function start(update, draw) {
    var last = performance.now();
    var acc = 0;
    function tick(now) {
      var dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      acc += dt;
      var steps = 0;
      while (acc >= STEP && steps < 5) {
        update(STEP);
        clearEdges();
        acc -= STEP;
        steps++;
      }
      if (steps === 5) acc = 0;
      draw(dt);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  G.engine = {
    input: input,
    releaseAll: releaseAll,
    createPlayer: createPlayer,
    stepPlayer: stepPlayer,
    start: start
  };
})();
