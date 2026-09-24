/* ------------------------------------------------------------------------
   UI — DOM panels, HUD, gate map, read-state, touch controls.

   Panels are real DOM (<dialog>), not canvas text: links stay real
   <a href>, text is selectable, screen readers can read it. showModal()
   gives the focus trap and Esc-to-close for free; on close, focus goes
   back to the game canvas.
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var G = (window.G = window.G || {});

  var READ_KEY = "mc-dungeon-read-v1";
  var W, player;
  var els = {};
  var current = null; // thing shown in the panel
  var order = []; // every thing, walking order — for prev / next
  var toastTimer = 0;

  /* the game's move / jump / read keys (engine.js), minus the map keys */
  var CLOSE_KEYS = {
    ArrowLeft: 1, KeyA: 1, ArrowRight: 1, KeyD: 1,
    ArrowUp: 1, KeyW: 1, Space: 1, KeyZ: 1, KeyK: 1,
    KeyE: 1, Enter: 1
  };

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function isExternal(href) {
    return /^https?:/.test(href);
  }

  function link(l, cls) {
    var ext = isExternal(l.href) || /\.pdf$/.test(l.href);
    return '<a class="' + (cls || "p-link") + '" href="' + esc(l.href) + '"' + (ext ? ' target="_blank" rel="noreferrer"' : "") + ">" + esc(l.text) + (ext ? ' <span aria-hidden="true">↗</span>' : "") + "</a>";
  }

  /* Read-state lasts for the current visit only. Earlier builds saved it to
     localStorage; clear that once so old progress doesn't linger. */
  function clearOldProgress() {
    try {
      window.localStorage.removeItem(READ_KEY);
    } catch (e) {
      /* storage blocked — nothing to clear */
    }
  }

  /* ======================================================================
     Panel content, per kind
     ====================================================================== */

  function metrics(list) {
    if (!list || !list.length) return "";
    return (
      '<ul class="p-metrics">' +
      list
        .map(function (m) {
          return '<li><span class="p-metric-value">' + esc(m.value) + '</span><span class="p-metric-label">' + esc(m.label) + "</span></li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function chips(list, cls) {
    if (!list || !list.length) return "";
    return (
      '<ul class="' + (cls || "p-chips") + '">' +
      list
        .map(function (s) {
          return "<li>" + esc(s) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function paras(list) {
    return (list || [])
      .map(function (p) {
        return "<p>" + p + "</p>"; // authored HTML from content.js
      })
      .join("");
  }

  function body(t) {
    var d = t.data;
    switch (d.kind) {
      case "about":
        return (
          '<p class="p-lead">' + esc(d.subtitle) + "</p>" +
          paras(d.body) +
          '<dl class="p-facts">' +
          d.facts
            .map(function (f) {
              return "<div><dt>" + esc(f.label) + "</dt><dd>" + esc(f.value) + "</dd></div>";
            })
            .join("") +
          "</dl>" +
          '<p class="p-hint">' + esc(d.hint) + "</p>" +
          '<p class="p-actions">' +
          link({ text: "Résumé (PDF)", href: G.content.profile.resume }, "p-btn") +
          '<button type="button" class="p-btn" data-open-contact>Contact</button>' +
          "</p>"
        );
      case "project":
        return (
          '<p class="p-meta">' + esc(d.year) + (d.tag ? " · " + esc(d.tag) : "") + "</p>" +
          '<p class="p-lead">' + d.deck + "</p>" +
          paras(d.body) +
          metrics(d.metrics) +
          chips(d.stack) +
          (d.links ? '<p class="p-actions">' + d.links.map(function (l) { return link(l, "p-btn"); }).join("") + "</p>" : "")
        );
      case "job":
        return (
          '<p class="p-meta">' + esc(d.company) + " · " + esc(d.place) + "<br>" + esc(d.dates) + "</p>" +
          metrics(d.metrics) +
          '<ul class="p-points">' +
          d.body
            .map(function (b) {
              return "<li>" + b + "</li>";
            })
            .join("") +
          "</ul>"
        );
      case "skills":
        return chips(d.pills, "p-chips p-chips--lg");
      case "certs":
        return (
          '<ul class="p-certs">' +
          d.certs
            .map(function (c) {
              return "<li>" + link({ text: c[0], href: c[1] }) + "</li>";
            })
            .join("") +
          "</ul>"
        );
      case "edu":
        return (
          '<p class="p-lead">' + esc(d.degree) + "</p>" +
          '<p class="p-meta">' + esc(d.dates) + "</p>" +
          '<p class="p-score">' + esc(d.score) + "</p>" +
          (d.note ? "<p>" + esc(d.note) + "</p>" : "")
        );
      case "contact":
        return (
          paras(d.body) +
          '<ul class="p-contact">' +
          d.links
            .map(function (l) {
              return "<li>" + link(l) + "</li>";
            })
            .join("") +
          "</ul>"
        );
    }
    return "";
  }

  function kicker(t) {
    var s = t.section;
    if (t.kind === "slab") return "The Atrium";
    var parts = ["Gate " + s.numeral, s.name];
    if (s.items.length > 1) parts.push(t.number + " / " + ("0" + s.items.length).slice(-2));
    return parts.join(" · ");
  }

  function title(t) {
    return t.data.title;
  }

  /* ======================================================================
     Open / close
     ====================================================================== */

  function open(t) {
    if (!t) return;
    if (t.kind === "door") return goPlain();
    if (t.kind === "portal") return openPortal(t);
    G.engine.releaseAll();
    current = t;
    els.panelKicker.textContent = kicker(t);
    els.panelTitle.textContent = title(t);
    els.panelBody.innerHTML = body(t);
    els.panel.dataset.kind = t.data.kind;
    var i = order.indexOf(t);
    els.prev.disabled = i <= 0;
    els.next.disabled = i >= order.length - 1;
    els.prev.querySelector("span").textContent = i > 0 ? order[i - 1].data.label || order[i - 1].data.title : "";
    els.next.querySelector("span").textContent = i < order.length - 1 ? order[i + 1].data.label || order[i + 1].data.title : "";
    if (!els.panel.open) {
      closeMap();
      els.panel.showModal();
    }
    els.panelBody.scrollTop = 0;
    els.close.focus();
    if (!t.read) {
      t.read = true;
      updateHud(true);
    }
    player.interact = 0.4;
    player.vx = 0;
  }

  function close() {
    if (els.panel.open) els.panel.close();
  }

  function isOpen() {
    return titleOn || warping || els.panel.open || els.map.open;
  }

  function goPlain() {
    window.location.href = "classic.html";
  }

  /* Move the player to stand before a thing — used by prev/next and the map. */
  function travelTo(x) {
    player.x = x;
    player.y = W.FLOOR_Y - player.h;
    player.vx = player.vy = 0;
    G.render.updateCamera(W, player, true);
  }

  function step(delta) {
    var i = order.indexOf(current) + delta;
    if (i < 0 || i >= order.length) return;
    var t = order[i];
    travelTo(t.cx - player.w / 2 - (t.kind === "slab" ? 40 : 0));
    player.facing = 1;
    open(t);
  }

  /* ======================================================================
     Gate map — fast travel, and the keyboard path through everything.
     A portal opens the same list: the room you're in is marked, the next
     room is preselected, and choosing one warps you there.
     ====================================================================== */

  var portal = null; // the portal the map was opened from, if any
  var warping = false;

  function renderMap() {
    var here = portal ? W.sections.indexOf(portal.section) : -1;
    els.mapList.innerHTML = W.sections
      .map(function (s, i) {
        var read = s.items.filter(function (t) {
          return t.read;
        }).length;
        var label = s.numeral ? "Gate " + s.numeral + " · " + s.name : "Atrium · Introduction";
        var badge = "";
        if (i === here) badge = '<span class="map-badge">You are here</span>';
        else if (portal && i === portal.nextIndex) badge = '<span class="map-badge map-badge--next">Next</span>';
        return (
          '<li><button type="button" class="map-gate' + (portal && i === portal.nextIndex ? " is-next" : "") + '" data-gate="' + i + '"' + (i === here ? " disabled" : "") + ">" +
          '<span class="map-name">' + esc(label) + badge + "</span>" +
          '<span class="map-count">' + read + " / " + s.items.length + "</span>" +
          "</button></li>"
        );
      })
      .join("");
  }

  function showMap(from) {
    G.engine.releaseAll();
    portal = from || null;
    els.mapKicker.textContent = portal ? "Step through to" : "Fast travel";
    els.mapTitle.textContent = portal ? "The Portal" : "The Gates";
    els.map.classList.toggle("is-portal", !!portal);
    renderMap();
    if (!els.map.open) els.map.showModal();
    var first = portal ? els.mapList.querySelector('[data-gate="' + portal.nextIndex + '"]') : els.mapList.querySelector("button");
    if (first) first.focus();
  }

  function openMap() {
    showMap(null);
  }

  function openPortal(p) {
    player.interact = 0.4;
    player.vx = 0;
    showMap(p);
  }

  function closeMap() {
    if (els.map.open) els.map.close();
  }

  function goGate(i) {
    var s = W.sections[i];
    var viaPortal = !!portal;
    closeMap();
    function arrive() {
      travelTo(s.gateX ? s.gateX + W.ARCH_W + 8 : W.spawn.x);
      player.facing = 1;
      toast(s);
    }
    if (!viaPortal || G.reduced) return arrive();
    /* a short flash of light covers the jump */
    warping = true;
    G.engine.releaseAll();
    els.warp.style.setProperty("--warp", s.biome.light);
    els.warp.classList.add("is-on");
    setTimeout(function () {
      arrive();
      els.warp.classList.remove("is-on");
      setTimeout(function () {
        warping = false;
        els.screen.focus();
      }, 120);
    }, 260);
  }

  /* ======================================================================
     HUD
     ====================================================================== */

  var lastSection = null;

  function updateHud(force) {
    var s = W.sectionAt(player.x + player.w / 2);
    if (s !== lastSection || force) {
      if (s !== lastSection && lastSection && s.items.length) toast(s);
      lastSection = s;
      els.hudSection.textContent = s.numeral ? "Gate " + s.numeral + " · " + s.name : s.name;
    }
    if (force) {
      var n = W.things.filter(function (t) {
        return t.read;
      }).length;
      els.hudRead.textContent = n;
      els.hudTotal.textContent = W.things.length;
      els.hudBar.style.width = (n / W.things.length) * 100 + "%";
    }
  }

  function toast(s) {
    var n = s.items.length;
    els.toast.innerHTML =
      (s.numeral ? '<span class="toast-kicker">Gate ' + esc(s.numeral) + "</span>" : "") +
      '<span class="toast-name">' + esc(s.numeral ? s.name : "The Atrium") + "</span>" +
      '<span class="toast-sub">' + (s.kicker ? esc(s.kicker) + " · " : "") + n + (n === 1 ? " record" : " records") + "</span>";
    els.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove("is-on");
    }, 2400);
  }

  function hideHint() {
    els.hint.classList.add("is-off");
  }

  /* ======================================================================
     Touch controls
     ====================================================================== */

  function bindHold(el, on, off) {
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      el.classList.add("is-down");
      on();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) {
      el.addEventListener(ev, function () {
        el.classList.remove("is-down");
        off();
      });
    });
  }

  function enableTouch() {
    if (G.state.touch) return;
    G.state.touch = true;
    document.body.classList.add("is-touch");
    els.hint.textContent = "Hold ◀ ▶ to walk · tap READ at a glowing monolith";
    G.resize();
  }

  /* ======================================================================
     Init
     ====================================================================== */

  function init(world, p) {
    W = world;
    player = p;
    order = W.things.slice();

    [
      "panel", "panelKicker", "panelTitle", "panelBody", "prev", "next", "close",
      "map", "mapList", "mapClose", "hudSection", "hudRead", "hudTotal", "hudBar",
      "toast", "hint", "btnMap", "btnContact", "screen", "mapKicker", "mapTitle", "warp",
      "title", "titleStart",
      "tLeft", "tRight", "tJump", "tRead"
    ].forEach(function (id) {
      els[id] = $(id);
    });

    clearOldProgress();

    els.close.addEventListener("click", close);
    els.prev.addEventListener("click", function () {
      step(-1);
    });
    els.next.addEventListener("click", function () {
      step(1);
    });
    els.panel.addEventListener("close", function () {
      current = null;
      els.screen.focus();
    });
    /* click on the backdrop closes */
    els.panel.addEventListener("click", function (e) {
      if (e.target === els.panel) close();
      if (e.target.closest("[data-open-contact]")) openContact();
    });
    /* Any movement or read key closes the record and hands control back
       to the game. Enter / Space still activate a focused link or button;
       held-key repeats are ignored so the key that opened it can't close it. */
    els.panel.addEventListener("keydown", function (e) {
      if (!CLOSE_KEYS[e.code] || e.repeat) return;
      var onControl = e.target.closest("a, button") && e.target !== els.close;
      if (onControl && (e.code === "Enter" || e.code === "Space")) return;
      e.preventDefault();
      /* ↑ / E / Enter would re-read the monolith; walk and jump keys pass
         through so the player moves off straight away */
      if (/^(ArrowUp|KeyW|KeyE|Enter)$/.test(e.code)) e.stopPropagation();
      close();
    });

    els.btnMap.addEventListener("click", openMap);
    els.mapClose.addEventListener("click", closeMap);
    els.map.addEventListener("close", function () {
      portal = null;
      els.screen.focus();
    });
    els.map.addEventListener("click", function (e) {
      if (e.target === els.map) closeMap();
      var b = e.target.closest("[data-gate]");
      if (b && !b.disabled) goGate(+b.dataset.gate);
      if (e.target.closest("[data-open-contact]")) openContact();
    });
    els.btnContact.addEventListener("click", openContact);

    /* click a monolith on screen to read it */
    els.screen.addEventListener("click", function (e) {
      var t = thingAt(e.clientX, e.clientY);
      if (t) open(t);
      else els.screen.focus();
    });
    els.screen.addEventListener("mousemove", function (e) {
      els.screen.style.cursor = thingAt(e.clientX, e.clientY) ? "pointer" : "";
    });

    /* touch */
    var input = G.engine.input;
    bindHold(els.tLeft, function () { input.touchLeft = true; }, function () { input.touchLeft = false; });
    bindHold(els.tRight, function () { input.touchRight = true; }, function () { input.touchRight = false; });
    bindHold(els.tJump, function () { input.jumpPressed = true; input.touchJump = true; }, function () { input.touchJump = false; });
    bindHold(els.tRead, function () { input.readPressed = true; }, function () {});
    window.addEventListener("touchstart", enableTouch, { passive: true, once: true });
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) enableTouch();

    els.titleStart.addEventListener("click", startGame);
    window.addEventListener("keydown", function (e) {
      if (!titleOn) return;
      /* let Tab / Enter work normally on the Plain view link */
      if (document.activeElement && document.activeElement.tagName === "A") return;
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight" || e.key === "Escape") {
        e.preventDefault();
        startGame();
      }
    });

    updateHud(true);
    showTitle();
    setTimeout(hideHint, 20000);
  }

  /* ======================================================================
     Title card — every visit starts here: enter the game, or plain view
     ====================================================================== */

  var titleOn = false;

  function showTitle() {
    titleOn = true;
    G.engine.releaseAll();
    els.title.hidden = false;
    els.titleStart.focus();
  }

  function startGame() {
    if (!titleOn) return;
    titleOn = false;
    els.title.hidden = true;
    G.engine.releaseAll();
    els.screen.focus();
    toast(W.sections[0]);
  }

  function openContact() {
    var t = W.things.filter(function (x) {
      return x.kind === "shrine";
    })[0];
    open(t);
  }

  function thingAt(clientX, clientY) {
    var p = G.render.toWorld(clientX, clientY);
    var d = W.door;
    if (p.x >= d.x && p.x <= d.x + d.w && p.y >= d.y - 24 && p.y <= d.y + d.h) return d;
    var all = W.things.concat(W.portals);
    for (var i = 0; i < all.length; i++) {
      var t = all[i];
      if (p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y - 14 && p.y <= t.y + t.h) return t;
    }
    return null;
  }

  function frame() {
    updateHud(false);
    els.tRead.classList.toggle("is-ready", !!G.state.near);
    if (player.moved > 160) hideHint();
  }

  G.ui = {
    init: init,
    open: open,
    goPlain: goPlain,
    openMap: openMap,
    openPortal: openPortal,
    isOpen: isOpen,
    frame: frame
  };
})();
