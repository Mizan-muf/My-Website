import re

html_path = "index.html"
css_path = "styles.css"

with open(html_path, "r") as f:
    html = f.read()

# 1. Remove meta-row
html = re.sub(r'\s*<div class="meta-row">.*?</div>', '', html, flags=re.DOTALL)

# 2. Merge hero and projects
# Find the end of hero section and start of projects section
#     </section>
#
#     <section id="projects" class="section">
#       <div class="container">
#         <div class="section-head reveal">
#           <p class="section-kicker">Selected Work</p>
#           <h2>Projects</h2>
#         </div>

merge_regex = r'    </section>\s*<section id="projects" class="section">\s*<div class="container">\s*<div class="section-head reveal">\s*<p class="section-kicker">Selected Work</p>\s*<h2>Projects</h2>\s*</div>'
html = re.sub(merge_regex, '', html, flags=re.DOTALL)

# Add id="projects" to the hero section instead
html = html.replace('<section class="hero section">', '<section id="projects" class="hero section" style="padding-bottom: 2rem;">')

with open(html_path, "w") as f:
    f.write(html)

with open(css_path, "r") as f:
    css = f.read()

# Reduce h1 font size
old_h1 = "font-size: clamp(1.75rem, 3.5vw, 3.25rem);"
new_h1 = "font-size: clamp(1.25rem, 2.5vw, 2.25rem);"
css = css.replace(old_h1, new_h1)

with open(css_path, "w") as f:
    f.write(css)

print("Done")
