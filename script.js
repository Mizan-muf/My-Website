const themeToggle = document.getElementById("themeToggle");
const sidebarThemeToggle = document.getElementById("sidebarThemeToggle");
const body = document.body;
let savedTheme = localStorage.getItem("theme");

// Default to light
if (savedTheme === null) {
  savedTheme = "light";
}

if (savedTheme === "dark") {
  body.classList.remove("light");
  if (themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  if (sidebarThemeToggle) sidebarThemeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
} else {
  body.classList.add("light");
  if (themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
  if (sidebarThemeToggle) sidebarThemeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
}

function toggleTheme() {
  body.classList.toggle("light");
  const isLight = body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  const icon = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
  if (themeToggle) themeToggle.innerHTML = icon;
  if (sidebarThemeToggle) sidebarThemeToggle.innerHTML = icon;
}

if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
if (sidebarThemeToggle) sidebarThemeToggle.addEventListener("click", toggleTheme);

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.12,
  }
);

revealElements.forEach((el) => revealObserver.observe(el));

// Sidebar Logic
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarLinks = document.querySelectorAll(".sidebar-link");

function openSidebar() {
  if (sidebar) sidebar.classList.add("open");
  if (sidebarOverlay) sidebarOverlay.classList.add("open");
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
  if (sidebarOverlay) sidebarOverlay.classList.remove("open");
}

if (menuToggle) menuToggle.addEventListener("click", openSidebar);
if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);
if (sidebarLinks) sidebarLinks.forEach(link => link.addEventListener("click", closeSidebar));