/* ------------------------------------------------------------------------
   Meezaan Chishty — portfolio behaviour
   Plain script, no modules, no build step. Loaded at the end of <body>,
   so the DOM is already parsed and no readyState guard is needed.

   Three jobs:
     1. Theme     — light/dark, persisted to localStorage["theme"]
     2. Sidebar   — mobile drawer
     3. Reveal    — IntersectionObserver adds .visible to .reveal
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  /* ======================================================================
     0. Small helpers
     ====================================================================== */

  /* The site is served from GitHub Pages but must also work when the file
     is opened directly from disk (file://). Under file:// — and in private
     modes, and when storage is blocked — touching localStorage can throw.
     Every access goes through these two, so a throw can never stop the
     rest of the script from running. */
  function readStored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeStored(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* Non-fatal: the theme still applies for this page view, it just
         will not be remembered on the next one. */
    }
  }

  function prefersReducedMotion() {
    return !!(
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /* ======================================================================
     1. THEME
     Light is the default. `body.light` is the light stock; its absence is
     the dark "ink" stock. `html.pre-dark` is set by the blocking inline
     script in <head> so a returning dark-mode reader never sees a cream
     flash; it must be kept in sync here or a reader who switches back to
     light keeps a dark <html> behind a light <body> — visible in the
     overscroll area and in the native scrollbar.
     ====================================================================== */

  var THEME_KEY = "theme";
  var ICON_MOON = '<i class="fa-solid fa-moon"></i>'; // shown in light mode: "go dark"
  var ICON_SUN = '<i class="fa-solid fa-sun"></i>'; // shown in dark mode:  "go light"

  var body = document.body;
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");
  var sidebarThemeToggle = document.getElementById("sidebarThemeToggle");

  function paintTheme(isLight) {
    if (body) body.classList.toggle("light", isLight);
    if (root) root.classList.toggle("pre-dark", !isLight);

    var icon = isLight ? ICON_MOON : ICON_SUN;
    if (themeToggle) themeToggle.innerHTML = icon;
    if (sidebarThemeToggle) sidebarThemeToggle.innerHTML = icon;
  }

  /* Anything that is not exactly "dark" — including a missing key, a
     cleared store, or a value written by some earlier version — falls
     through to light. */
  paintTheme(readStored(THEME_KEY) !== "dark");

  function toggleTheme() {
    var isLight = !(body && body.classList.contains("light"));
    paintTheme(isLight);
    writeStored(THEME_KEY, isLight ? "light" : "dark");
  }

  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  if (sidebarThemeToggle) sidebarThemeToggle.addEventListener("click", toggleTheme);

  /* ======================================================================
     2. SIDEBAR (mobile drawer)
     ====================================================================== */

  var menuToggle = document.getElementById("menuToggle");
  var sidebar = document.getElementById("sidebar");
  var sidebarOverlay = document.getElementById("sidebarOverlay");
  var sidebarClose = document.getElementById("sidebarClose");
  var sidebarLinks = document.querySelectorAll(".sidebar-link");

  function sidebarIsOpen() {
    return !!(sidebar && sidebar.classList.contains("open"));
  }

  function openSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (sidebarOverlay) sidebarOverlay.classList.add("open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
    /* Move focus into the drawer so keyboard and screen-reader users are
       not left behind on the (now visually hidden) header button. */
    if (sidebarClose && typeof sidebarClose.focus === "function") {
      sidebarClose.focus();
    }
  }

  /* `restoreFocus` is opt-in rather than derived from the event, because
     these handlers are also wired straight to addEventListener, which
     would otherwise pass a (truthy) Event object as the first argument. */
  function closeSidebar(restoreFocus) {
    if (sidebar) sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      /* Only when the drawer was dismissed rather than navigated away
         from — on a link click the anchor target should keep focus. */
      if (restoreFocus === true && typeof menuToggle.focus === "function") {
        menuToggle.focus();
      }
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      if (sidebarIsOpen()) {
        closeSidebar(true);
      } else {
        openSidebar();
      }
    });
  }

  if (sidebarClose) {
    sidebarClose.addEventListener("click", function () {
      closeSidebar(true);
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", function () {
      closeSidebar(false);
    });
  }

  for (var i = 0; i < sidebarLinks.length; i++) {
    sidebarLinks[i].addEventListener("click", function () {
      closeSidebar(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    var key = event.key;
    if ((key === "Escape" || key === "Esc") && sidebarIsOpen()) {
      closeSidebar(true);
    }
  });

  /* ======================================================================
     3. SCROLL REVEAL
     ====================================================================== */

  var revealElements = document.querySelectorAll(".reveal");

  function revealAll() {
    for (var n = 0; n < revealElements.length; n++) {
      revealElements[n].classList.add("visible");
    }
  }

  /* Two ways to skip the animation entirely, both of which reveal the
     content immediately rather than leaving it observed:
       - the reader asked for reduced motion (the stylesheet also forces
         this, with !important; doing it here too avoids pointlessly
         holding an observer open)
       - IntersectionObserver is unavailable, so nothing would ever add
         .visible and every .reveal would be stranded at opacity:0 */
  if (prefersReducedMotion() || typeof window.IntersectionObserver !== "function") {
    revealAll();
    return;
  }

  var revealObserver = new window.IntersectionObserver(
    function (entries, observer) {
      for (var k = 0; k < entries.length; k++) {
        var entry = entries[k];
        if (!entry.isIntersecting) continue;

        /* 0.12 is the intended trigger, but the ratio of an element that
           is taller than the viewport is capped at viewportHeight /
           elementHeight, so a very tall block could in principle never
           reach it. The height test is the escape hatch: once such a
           block is on screen at all, reveal it. */
        var viewportHeight = window.innerHeight || 0;
        var isTall = entry.boundingClientRect.height > viewportHeight * 0.75;

        if (entry.intersectionRatio >= 0.12 || isTall) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: [0, 0.12] }
  );

  /* A fast flick can carry the viewport past an element between two
     observer samples, which leaves it stranded at opacity:0 until the
     reader happens to scroll back to it. Anything already above the fold
     has been "read past" and is revealed unconditionally. */
  function revealPassed() {
    for (var m = 0; m < revealElements.length; m++) {
      var el = revealElements[m];
      if (el.classList.contains("visible")) continue;
      if (el.getBoundingClientRect().bottom < 0) {
        el.classList.add("visible");
        revealObserver.unobserve(el);
      }
    }
  }
  window.addEventListener("scroll", revealPassed, { passive: true });

  for (var j = 0; j < revealElements.length; j++) {
    revealObserver.observe(revealElements[j]);
  }
})();
