import re

filepath = "/Users/syedmohammed/Documents/Pjt/Project-Dargah/My-Website/styles.css"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update :root radius
content = content.replace("--radius: 24px;", "--radius: 12px;")

# 2. Update body.light theme
old_light = """body.light {
  --bg: #f5f7fb;
  --bg-elev: rgba(255, 255, 255, 0.82);
  --bg-card: rgba(255, 255, 255, 0.9);
  --border: rgba(15, 23, 42, 0.08);
  --text: #18212f;
  --muted: #5f6b7a;
  --heading: #0f172a;
  --accent: #315efb;
  --accent-2: #0f766e;
  --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}"""
new_light = """body.light {
  --bg: #fafafa;
  --bg-elev: #ffffff;
  --bg-card: #ffffff;
  --border: #cccccc;
  --text: #212121;
  --muted: #666666;
  --heading: #000000;
  --accent: #315efb;
  --accent-2: #0f766e;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}"""
content = content.replace(old_light, new_light)

# 3. Reduce heading text sizes
old_h1 = """  font-size: clamp(2.3rem, 5vw, 4.6rem);
  line-height: 1.02;
  letter-spacing: -0.045em;
  color: var(--heading);
  max-width: 11ch;"""
new_h1 = """  font-size: clamp(2rem, 4vw, 3.8rem);
  line-height: 1.05;
  letter-spacing: -0.045em;
  color: var(--heading);
  max-width: 14ch;"""
content = content.replace(old_h1, new_h1)

old_h2 = """  font-size: clamp(1.75rem, 3vw, 2.5rem);"""
new_h2 = """  font-size: clamp(1.5rem, 2.5vw, 2rem);"""
content = content.replace(old_h2, new_h2)

# 4. Remove dock styling (around line 448 to 484)
dock_match = re.search(r'\.dock \{.*?\n\}\n\nbody\.light \.dock \{.*?\n\}\n\n\.dock-item \{.*?\n\}\n\n\.dock-item\.active,\n\.dock-item:hover \{.*?\n\}\n', content, flags=re.DOTALL)
if dock_match:
    content = content.replace(dock_match.group(0), "")
else:
    # Fallback to general dock search
    content = re.sub(r'\.dock \{.*?\n\}\n', '', content, flags=re.DOTALL)
    content = re.sub(r'body\.light \.dock \{.*?\n\}\n', '', content, flags=re.DOTALL)
    content = re.sub(r'\.dock-item \{.*?\n\}\n', '', content, flags=re.DOTALL)
    content = re.sub(r'\.dock-item\.active,[\s\S]*?\{.*?\n\}\n', '', content, flags=re.DOTALL)

# 5. Remove dock styling in media query (around line 534 to 542)
dock_mq_match = re.search(r'  \.dock \{.*?\n  \}\n\n  \.dock-item \{.*?\n  \}\n', content, flags=re.DOTALL)
if dock_mq_match:
    content = content.replace(dock_mq_match.group(0), "")
else:
    content = re.sub(r'  \.dock \{.*?\n  \}\n', '', content, flags=re.DOTALL)
    content = re.sub(r'  \.dock-item \{.*?\n  \}\n', '', content, flags=re.DOTALL)

# 6. Add new sidebar and header styles before media queries
new_styles = """
/* Desktop & Mobile Utilities */
.desktop-only { display: flex; }
.mobile-only { display: none; }

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header-icon {
  color: var(--muted);
  font-size: 1.25rem;
  transition: color 0.2s ease;
}
.header-icon:hover {
  color: var(--heading);
}
.menu-toggle {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--heading);
  cursor: pointer;
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: 0;
  right: -320px;
  width: 280px;
  height: 100vh;
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  z-index: 100;
  padding: 2rem;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: column;
}
.sidebar.open {
  right: 0;
}
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 99;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.sidebar-overlay.open {
  opacity: 1;
  pointer-events: auto;
}
.sidebar-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: var(--heading);
  cursor: pointer;
  align-self: flex-end;
  margin-bottom: 2rem;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.sidebar-link {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--heading);
}
.sidebar-actions {
  margin-top: auto;
  display: flex;
  gap: 1.25rem;
  align-items: center;
}
"""

content = content.replace("@media (max-width: 980px)", new_styles + "\n@media (max-width: 980px)")

# 7. Add mobile utilities to 760px media query
mq_760 = """@media (max-width: 760px) {
  .top-nav {
    display: none;
  }"""
new_mq_760 = """@media (max-width: 760px) {
  .desktop-only { display: none !important; }
  .mobile-only { display: block; }
  .top-nav {
    display: none;
  }"""
content = content.replace(mq_760, new_mq_760)

with open(filepath, "w") as f:
    f.write(content)
print("Done updating styles.css")
