const themeToggle = document.getElementById("themeToggle");
const body = document.body;
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
  body.classList.add("light");
  themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("light");
  const isLight = body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  themeToggle.innerHTML = isLight
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
});

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

const sections = document.querySelectorAll("main section[id], main[id='top']");
const dockLinks = document.querySelectorAll(".dock-item");

function setActiveDock() {
  const scrollY = window.scrollY + window.innerHeight * 0.28;
  let current = "top";

  document.querySelectorAll("section[id]").forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    if (scrollY >= top && scrollY < top + height) {
      current = section.id;
    }
  });

  if (window.scrollY < 120) {
    current = "top";
  }

  dockLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.section === current);
  });
}

window.addEventListener("scroll", setActiveDock);
window.addEventListener("load", setActiveDock);