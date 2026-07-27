import re
import os

filepath = "/Users/syedmohammed/Documents/Pjt/Project-Dargah/My-Website/index.html"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update body to <body class="light">
content = content.replace("<body>", '<body class="light">')

# 2. Update header and add sidebar
old_header = """  <header class="site-header">
    <div class="container nav-wrap">
      <a class="brand" href="#top">Meezaan Chishty</a>

      <nav class="top-nav">
        <a href="#about">About</a>
        <a href="#experience">Experience</a>
        <a href="#projects">Projects</a>
        <a href="#skills">Skills</a>
        <a href="#certifications">Certificates</a>
        <a href="#contact">Contact</a>
      </nav>

      <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
        <i class="fa-solid fa-moon"></i>
      </button>
    </div>
  </header>"""

new_header = """  <header class="site-header">
    <div class="container nav-wrap">
      <a class="brand" href="#top">Meezaan Chishty</a>

      <nav class="top-nav desktop-only">
        <a href="#projects">Projects</a>
        <a href="#experience">Experience</a>
        <a href="#skills">Skills</a>
        <a href="#certifications">Certificates</a>
        <a href="#contact">Contact</a>
      </nav>

      <div class="header-actions desktop-only">
        <a href="mailto:syedmeezan905@gmail.com" class="header-icon" aria-label="Email"><i class="fa-regular fa-envelope"></i></a>
        <a href="https://github.com/Mizan-muf" target="_blank" rel="noreferrer" class="header-icon" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
          <i class="fa-solid fa-moon"></i>
        </button>
      </div>

      <button class="menu-toggle mobile-only" id="menuToggle" aria-label="Toggle menu">
        <i class="fa-solid fa-bars"></i>
      </button>
    </div>
  </header>

  <div class="sidebar" id="sidebar">
    <button class="sidebar-close" id="sidebarClose"><i class="fa-solid fa-xmark"></i></button>
    <nav class="sidebar-nav">
        <a href="#projects" class="sidebar-link">Projects</a>
        <a href="#experience" class="sidebar-link">Experience</a>
        <a href="#skills" class="sidebar-link">Skills</a>
        <a href="#certifications" class="sidebar-link">Certificates</a>
        <a href="#contact" class="sidebar-link">Contact</a>
    </nav>
    <div class="sidebar-actions">
        <a href="mailto:syedmeezan905@gmail.com" class="header-icon" aria-label="Email"><i class="fa-regular fa-envelope"></i></a>
        <a href="https://github.com/Mizan-muf" target="_blank" rel="noreferrer" class="header-icon" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
        <button class="theme-toggle" id="sidebarThemeToggle" aria-label="Toggle theme">
          <i class="fa-solid fa-moon"></i>
        </button>
    </div>
  </div>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>"""
content = content.replace(old_header, new_header)

# 3. Extract sections
about_match = re.search(r'    <section id="about" class="section">.*?</section>\n\n', content, flags=re.DOTALL)
experience_match = re.search(r'    <section id="experience" class="section">.*?</section>\n\n', content, flags=re.DOTALL)
projects_match = re.search(r'    <section id="projects" class="section">.*?</section>\n\n', content, flags=re.DOTALL)

# Remove about, and swap experience and projects
if about_match and experience_match and projects_match:
    content = content.replace(about_match.group(0), "")
    content = content.replace(experience_match.group(0), "___EXP___")
    content = content.replace(projects_match.group(0), "___PROJ___")
    
    content = content.replace("___EXP___", projects_match.group(0))
    content = content.replace("___PROJ___", experience_match.group(0))

# 4. Remove dock
dock_match = re.search(r'  <nav class="dock" id="dock">.*?</nav>\n\n', content, flags=re.DOTALL)
if dock_match:
    content = content.replace(dock_match.group(0), "")

with open(filepath, "w") as f:
    f.write(content)
print("Done updating index.html")
