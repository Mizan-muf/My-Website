/* ------------------------------------------------------------------------
   Renderer — one internal low-res buffer, integer-scaled by CSS.

   Draw order:
     parallax far / mid → baked back layer → torches, monoliths, player →
     baked front layer → darkness + light holes → additive glow →
     particles → emissive labels and prompts → foreground silhouettes

   Lights are pre-rendered radial sprites (one per colour), so a frame is
   a handful of drawImage calls — no gradients are created per frame.
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var G = (window.G = window.G || {});
  var P = G.PAL;

  var view = { w: 320, h: 180, scale: 6 };
  var cam = { x: 0, y: 0 };
  var ctx, canvas, light;
  var lightSprites = {};
  var particles = [];
  var MAX_PARTICLES = 140;
  var time = 0;

  function init(cnv) {
    canvas = cnv;
    ctx = canvas.getContext("2d");
    light = G.sprites.canvas(view.w, view.h);
  }

  /* ======================================================================
     Sizing — keep at least 240×180 of world visible (180 wide on portrait
     phones), integer scale when the screen is big enough to afford it.
     ====================================================================== */

  function resize(availW, availH, maxH, minW) {
    var sf = Math.min(availW / (minW || 240), availH / 180);
    var s = sf >= 2 ? Math.floor(sf) : Math.max(sf, 0.5);
    view.scale = s;
    view.w = Math.min(Math.ceil(availW / s), 480);
    view.h = Math.min(Math.ceil(availH / s), maxH || 270);
    canvas.width = view.w;
    canvas.height = view.h;
    canvas.style.width = view.w * s + "px";
    canvas.style.height = view.h * s + "px";
    light.c.width = view.w;
    light.c.height = view.h;
    ctx.imageSmoothingEnabled = false;
  }

  /* ======================================================================
     Camera — horizontal follow with a deadzone and look-ahead
     ====================================================================== */

  function updateCamera(W, p, snap) {
    var targetX = p.x + p.w / 2 - view.w / 2 + p.facing * 28;
    var dz = 20;
    var cx = cam.x;
    if (targetX > cx + dz) cx = targetX - dz;
    else if (targetX < cx - dz) cx = targetX + dz;
    var baseY = (180 - view.h) / 2;
    var targetY = baseY + Math.max(-24, Math.min(0, (p.y - (W.FLOOR_Y - 22)) * 0.3));
    if (snap || G.reduced) {
      cam.x = cx;
      cam.y = baseY;
    } else {
      cam.x += (cx - cam.x) * 0.14;
      cam.y += (targetY - cam.y) * 0.08;
    }
    cam.x = Math.max(0, Math.min(W.width - view.w, cam.x));
  }

  /* ======================================================================
     Lights
     ====================================================================== */

  function lightSprite(color) {
    if (lightSprites[color]) return lightSprites[color];
    var s = G.sprites.canvas(128, 128);
    var g = s.ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color);
    g.addColorStop(0.35, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    s.ctx.fillStyle = g;
    s.ctx.fillRect(0, 0, 128, 128);
    lightSprites[color] = s.c;
    return s.c;
  }

  function flicker(seed) {
    if (G.reduced) return 1;
    return 0.92 + Math.sin(time * 9.1 + seed) * 0.04 + Math.sin(time * 23.7 + seed * 3) * 0.03;
  }

  function collectLights(W, p, state) {
    var L = [];
    var x0 = cam.x - 80;
    var x1 = cam.x + view.w + 80;
    W.torches.forEach(function (t, i) {
      if (t.x < x0 || t.x > x1) return;
      L.push({ x: t.x + 8, y: t.y + 4, r: 74 * flicker(i), c: t.color, a: 0.32 });
    });
    W.things.forEach(function (t) {
      if (t.x + t.w < x0 || t.x > x1) return;
      if (t.kind === "monolith") {
        var lit = t.read ? 1 : 0;
        var r = 16 + t.glow * 26 + lit * 18;
        L.push({ x: t.cx, y: t.y + 24, r: r, c: G.PAL.n, a: 0.12 + t.glow * 0.2 + lit * 0.12 });
      } else if (t.kind === "slab") {
        L.push({ x: t.cx, y: t.y + 40, r: 110, c: "#ffcf7a", a: 0.14 + t.glow * 0.1 });
      } else if (t.kind === "shrine") {
        L.push({ x: t.cx, y: t.y + 12, r: 96 * flicker(7), c: "#ffd76a", a: 0.38 });
      }
    });
    /* passages: cool, dim cavern light */
    W.passages.forEach(function (ps) {
      if (ps[1] < x0 || ps[0] > x1) return;
      L.push({ x: (ps[0] + ps[1]) / 2, y: 60, r: 70, c: "#6f86c8", a: 0.12 });
    });
    /* the plain-view doorway glows warm */
    var d = W.door;
    if (d.x < x1) L.push({ x: d.cx, y: d.y + 24, r: 40 + (state.near === d ? 14 : 0), c: "#ffb85c", a: 0.3 });
    L.push({ x: p.x + p.w / 2, y: p.y + 10, r: 54, c: "#ffe2b0", a: 0.08 });
    return L;
  }

  function drawLighting(L) {
    var l = light.ctx;
    l.globalCompositeOperation = "source-over";
    l.fillStyle = "rgba(5,5,12,0.84)";
    l.fillRect(0, 0, view.w, view.h);
    l.globalCompositeOperation = "destination-out";
    var white = lightSprite("rgba(255,255,255,1)");
    L.forEach(function (li) {
      l.drawImage(white, li.x - cam.x - li.r, li.y - cam.y - li.r, li.r * 2, li.r * 2);
    });
    ctx.drawImage(light.c, 0, 0);

    /* additive colour */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    L.forEach(function (li) {
      ctx.globalAlpha = li.a;
      ctx.drawImage(lightSprite(li.c), li.x - cam.x - li.r, li.y - cam.y - li.r, li.r * 2, li.r * 2);
    });
    ctx.restore();
  }

  /* ======================================================================
     Particles — dust motes, torch embers, moss spores, landing puffs
     ====================================================================== */

  function spawn(pt) {
    if (G.reduced || particles.length >= MAX_PARTICLES) return;
    pt.life = 0;
    particles.push(pt);
  }

  function puff(x, y, n) {
    for (var i = 0; i < n; i++) {
      spawn({ x: x + (Math.random() - 0.5) * 8, y: y, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 20, max: 0.4 + Math.random() * 0.3, c: P["4"], add: false, g: 30 });
    }
  }

  function updateParticles(W, dt) {
    if (G.reduced) {
      particles.length = 0;
      return;
    }
    /* embers rising from visible torches */
    W.torches.forEach(function (t) {
      if (t.x < cam.x - 16 || t.x > cam.x + view.w + 16) return;
      if (Math.random() < dt * 3) {
        spawn({ x: t.x + 7 + Math.random() * 3, y: t.y + 1, vx: (Math.random() - 0.5) * 8, vy: -14 - Math.random() * 14, max: 1 + Math.random() * 0.8, c: Math.random() < 0.5 ? P.n : P.m, add: true, g: -4 });
      }
    });
    /* ambient dust */
    if (Math.random() < dt * 6) {
      spawn({ x: cam.x + Math.random() * view.w, y: 20 + Math.random() * 120, vx: 3 + Math.random() * 4, vy: (Math.random() - 0.5) * 3, max: 4 + Math.random() * 3, c: P["5"], add: false, g: 0, dust: true });
    }
    /* spores drifting up from mossy floor */
    var biome = W.sectionAt(cam.x + view.w / 2).biome;
    if (Math.random() < dt * biome.moss * 5) {
      spawn({ x: cam.x + Math.random() * view.w, y: W.FLOOR_Y - 2, vx: (Math.random() - 0.5) * 4, vy: -5 - Math.random() * 6, max: 3 + Math.random() * 2, c: P.e, add: true, g: 0 });
    }
    for (var i = particles.length - 1; i >= 0; i--) {
      var q = particles[i];
      q.life += dt;
      if (q.life >= q.max) {
        particles.splice(i, 1);
        continue;
      }
      q.vy += (q.g || 0) * dt;
      if (q.dust) q.vx += Math.sin(time * 1.3 + i) * dt * 2;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
  }

  function drawParticles() {
    particles.forEach(function (q) {
      var k = 1 - q.life / q.max;
      ctx.globalCompositeOperation = q.add ? "lighter" : "source-over";
      ctx.globalAlpha = q.dust ? Math.min(k, q.life) * 0.35 : k * 0.9;
      ctx.fillStyle = q.c;
      ctx.fillRect(Math.round(q.x - cam.x), Math.round(q.y - cam.y), 1, 1);
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /* ======================================================================
     Frame
     ====================================================================== */

  function parallax(img, factor, y) {
    var w = img.width;
    var off = G.reduced ? 0 : -Math.round((cam.x * factor) % w);
    for (var x = off; x < view.w; x += w) ctx.drawImage(img, x, y);
  }

  function frame(W, p, state, dt) {
    time += dt;
    var cx = Math.round(cam.x);
    var cy = Math.round(cam.y);
    var oy = W.bakeOffsetY;

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = P["0"];
    ctx.fillRect(0, 0, view.w, view.h);

    parallax(G.sprites.sheet("bgFar"), 0.15, -cy);
    parallax(G.sprites.sheet("bgMid"), 0.4, -cy);

    /* baked back layer */
    ctx.drawImage(W.back, cx, oy + cy, view.w, view.h, 0, 0, view.w, view.h);

    /* torches on the back wall (arch torches come after the front layer) */
    drawTorches(W, cx, cy, false);

    /* monoliths, shrine flame */
    W.things.forEach(function (t) {
      if (t.x + t.w < cx || t.x > cx + view.w) return;
      if (t.kind === "monolith") {
        var st = t.read ? 2 : t.glow > 0.5 ? 1 : 0;
        G.sprites.draw(ctx, "monolith", st, 0, t.x - cx, t.y - cy);
        var pulse = G.reduced ? 0.6 : 0.5 + Math.sin(time * 2.4 + t.x) * 0.25;
        var a = t.read ? pulse * 0.8 : t.glow * pulse;
        if (a > 0.02) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = a;
          G.sprites.draw(ctx, "monolith", 3, 0, t.x - cx, t.y - cy);
          ctx.restore();
        }
      } else if (t.kind === "shrine") {
        drawShrineFlame(t.x - cx + 24, t.y - cy + 16);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.5 + (G.reduced ? 0 : Math.sin(time * 3) * 0.2);
        G.sprites.draw(ctx, "shrineGlow", 0, 0, t.x - cx, t.y - cy);
        ctx.restore();
      }
    });

    /* player */
    G.sprites.draw(ctx, "char", p.frame, p.row, Math.round(p.x) - 3 - cx, Math.round(p.y) - 2 - cy, p.facing < 0);

    /* baked front layer */
    ctx.drawImage(W.front, cx, oy + cy, view.w, view.h, 0, 0, view.w, view.h);
    drawTorches(W, cx, cy, true);

    drawLighting(collectLights(W, p, state));
    drawParticles();
    drawLabels(W, state, cx, cy);
    drawGuide(W, state, cx, cy);

    parallax(G.sprites.sheet("bgNear"), 1.3, W.FLOOR_Y + 36 - 48 - cy);
  }

  function drawTorches(W, cx, cy, front) {
    var tf = G.reduced ? 0 : Math.floor(time * 8.3) % 4;
    W.torches.forEach(function (t, i) {
      if (!!t.front !== front || t.x < cx - 16 || t.x > cx + view.w) return;
      G.sprites.draw(ctx, "torch", (tf + i) % 4, 0, t.x - cx, t.y - cy);
    });
  }

  /* Off-screen guide: a pulsing chevron at the screen edge pointing to the
     next unread record (state.target, chosen by ui.js). */
  function drawGuide(W, state, cx, cy) {
    var t = state.target;
    if (!t) return;
    var sx = t.cx - cx;
    if (sx > 8 && sx < view.w - 8) return;
    var right = sx >= view.w - 8;
    var dir = right ? 1 : -1;
    var pulse = G.reduced ? 0 : Math.round(Math.sin(time * 5) * 2);
    var x = right ? view.w - 12 + pulse : 12 - pulse;
    var y = W.FLOOR_Y - 40 - cy;
    /* a 9px-tall chevron, 2px stroke, dark outline */
    for (var pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass ? P.j : P["0"];
      for (var i = 0; i < 9; i++) {
        var off = (4 - Math.abs(i - 4)) * dir;
        if (pass) ctx.fillRect(x + off - 1, y + i, 2, 1);
        else ctx.fillRect(x + off - 2, y + i - 1, 4, 3);
      }
    }
    G.font.draw(ctx, "NEXT", x - dir * 2, y + 12, { color: P.j, shadow: P["0"], align: right ? "right" : "left" });
  }

  function drawShrineFlame(x, y) {
    var t = G.reduced ? 0 : time;
    var h = 9 + Math.round(Math.sin(t * 7) * 1.5 + Math.sin(t * 13) * 1);
    for (var i = -4; i <= 4; i++) {
      var ch = Math.max(0, h - Math.abs(i) * 2 + Math.round(Math.sin(t * 11 + i) * 1));
      for (var j = 0; j < ch; j++) {
        var k = j > ch - 2 ? "l" : Math.abs(i) <= 1 && j < ch - 3 ? "n" : "m";
        ctx.fillStyle = P[k];
        ctx.fillRect(x + i, y - j, 1, 1);
      }
    }
  }

  /* Gate names and monolith labels are gold engravings — they glow, so
     they are drawn after the darkness pass to stay legible. */
  function drawLabels(W, state, cx, cy) {
    var bob = G.reduced ? 0 : Math.round(Math.sin(time * 4) * 1.5);
    W.arches.forEach(function (a) {
      if (a.x + 96 < cx || a.x > cx + view.w) return;
      var entry = a.kind === "entry";
      G.font.draw(ctx, entry ? a.section.numeral : "→", a.x + 48 - cx, W.FLOOR_Y - 92 - cy, { color: P.i, align: "center" });
      G.font.draw(ctx, entry ? a.section.name : "NEXT GATE →", a.x + 48 - cx, W.FLOOR_Y - 81 - cy, { color: entry ? P.j : P.i, shadow: P.f, align: "center" });
    });
    /* signpost and plain-view door */
    var sg = W.sign;
    if (sg.x < cx + view.w && sg.x + 72 > cx) {
      G.font.draw(ctx, "PORTFOLIO →", sg.x + 33 - cx, sg.y + 6 - cy, { color: P.j, shadow: P.o, align: "center" });
    }
    var d = W.door;
    if (d.x < cx + view.w + 40) {
      var nearDoor = state.near === d;
      G.font.draw(ctx, "← PLAIN VIEW", d.cx + 8 - cx, d.y - 22 - cy, { color: nearDoor ? P.j : P.i, shadow: P["0"], align: "center" });
      if (nearDoor) {
        G.font.draw(ctx, state.touch ? "TAP READ" : "↑ ENTER", d.cx + 8 - cx, d.y - 34 + bob - cy, { color: P.w, shadow: P["0"], align: "center" });
      }
    }
    W.things.forEach(function (t) {
      if (t.x + t.w < cx - 40 || t.x > cx + view.w + 40) return;
      var near = state.near === t;
      if (t.kind === "monolith") {
        /* dormant labels only surface as the player approaches */
        var dist = Math.abs(state.px - t.cx);
        if (near || t.read || dist < 150) {
          var color = near ? P.j : t.read ? P.h : P["5"];
          G.font.draw(ctx, t.label, t.cx - cx, t.y - 11 - cy, { color: color, shadow: near || t.read ? P["0"] : null, align: "center" });
        }
      } else if (t.kind === "shrine") {
        G.font.draw(ctx, "CONTACT", t.cx - cx, t.y - 14 - cy, { color: near ? P.j : P.h, shadow: P["0"], align: "center" });
      }
      if (near) {
        var py = t.kind === "monolith" ? t.y - 24 : t.kind === "shrine" ? t.y - 26 : t.y - 12;
        G.font.draw(ctx, state.touch ? "TAP READ" : "↑ READ", t.cx - cx, py + bob - cy, { color: P.w, shadow: P["0"], align: "center" });
      }
    });
  }

  /* screen px → world px, for canvas clicks */
  function toWorld(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * view.w + cam.x,
      y: ((clientY - r.top) / r.height) * view.h + cam.y
    };
  }

  G.render = {
    init: init,
    resize: resize,
    frame: frame,
    updateCamera: updateCamera,
    updateParticles: updateParticles,
    puff: puff,
    toWorld: toWorld,
    view: view,
    cam: cam
  };
})();
