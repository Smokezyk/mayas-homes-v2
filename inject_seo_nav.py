import os
import re
from pathlib import Path

html_files = []
for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root or "heavy_backups" in root: continue
    for f in files:
        if f.endswith(".html"):
            html_files.append(Path(root) / f)

for p in html_files:
    content = p.read_text()
    
    rel = p.relative_to(".")
    parts = list(rel.parts)
    is_pt = len(parts) > 0 and parts[0] == "pt"
    
    if is_pt:
        en_parts = parts[1:]
    else:
        en_parts = parts
        
    en_url_parts = en_parts[:-1] if len(en_parts) > 0 and en_parts[-1] == "index.html" else en_parts
    en_url = "/" + "/".join(en_url_parts)
    if not en_url.endswith("/"): en_url += "/"
    if en_url == "//": en_url = "/"
    
    pt_url = "/pt" + en_url if en_url != "/" else "/pt/"

    # 1. Hreflang
    content = re.sub(r'<link rel="alternate" hreflang=.*?>\n?', '', content)
    hreflang_tags = f"""  <link rel="alternate" hreflang="en" href="https://mayashomes.com{en_url}" />
  <link rel="alternate" hreflang="pt-PT" href="https://mayashomes.com{pt_url}" />
  <link rel="alternate" hreflang="x-default" href="https://mayashomes.com{en_url}" />\n"""
    content = content.replace("</head>", hreflang_tags + "</head>")
    
    # 2. Nav toggle
    if "nav-lang-toggle" not in content:
        en_active = "" if is_pt else ' class="is-active"'
        pt_active = ' class="is-active"' if is_pt else ""
        
        toggle_html = f"""
    <div class="nav-lang-toggle">
      <a href="{en_url}"{en_active}>EN</a>
      <span aria-hidden="true">/</span>
      <a href="{pt_url}"{pt_active}>PT</a>
    </div>"""
        
        content = content.replace('<div class="nav-tools">', f'<div class="nav-tools">{toggle_html}')
        
        drawer_toggle = f"""
      <div class="nav-drawer__lang">
        <a href="{en_url}"{en_active}>EN</a>
        <span aria-hidden="true">/</span>
        <a href="{pt_url}"{pt_active}>PT</a>
      </div>"""
        content = content.replace('<div class="nav-drawer__footer">', f'{drawer_toggle}\n      <div class="nav-drawer__footer">')

    p.write_text(content)

# Append CSS
css_path = Path("css/index.css")
if css_path.exists():
    css_content = css_path.read_text()
    if ".nav-lang-toggle" not in css_content:
        css_content += """
/* Language Toggle */
.nav-lang-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 13px;
  text-transform: uppercase;
  color: var(--mid);
  margin-right: 0.5rem;
}
.nav-lang-toggle a {
  color: var(--mid);
  text-decoration: none;
  transition: color 0.25s ease;
}
.nav-lang-toggle a:hover,
.nav-lang-toggle a.is-active {
  color: var(--ink);
}
.nav-lang-toggle span {
  opacity: 0.4;
}

.nav-drawer__lang {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--mid);
  margin-bottom: 2rem;
}
.nav-drawer__lang a {
  color: var(--mid);
  text-decoration: none;
}
.nav-drawer__lang a.is-active {
  color: var(--ink);
}
"""
        css_path.write_text(css_content)

print("Injected hreflang tags, navigation toggles, and updated CSS.")
