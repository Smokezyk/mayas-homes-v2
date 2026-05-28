import os
import shutil
from pathlib import Path

# Create pt directory
pt_dir = Path("pt")
if not pt_dir.exists():
    pt_dir.mkdir()

# Directories to ignore
ignore_dirs = {".git", "node_modules", "assets", "css", "js", "vendor", "pt", "heavy_backups", ".gemini", "logo"}

# We will collect all HTML files
html_files = []
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in ignore_dirs]
    for f in files:
        if f.endswith(".html"):
            html_files.append(Path(root) / f)

# Make sure index.html uses absolute paths for CSS so it doesn't break in /pt/
idx_path = Path("index.html")
if idx_path.exists():
    idx_content = idx_path.read_text()
    idx_content = idx_content.replace('href="css/', 'href="/css/')
    idx_content = idx_content.replace('href="js/', 'href="/js/')
    idx_path.write_text(idx_content)

for p in html_files:
    rel_path = p.relative_to(".")
    pt_path = pt_dir / rel_path
    
    pt_path.parent.mkdir(parents=True, exist_ok=True)
    
    content = p.read_text()
    
    # Change lang
    content = content.replace('<html lang="en">', '<html lang="pt">')
    
    # Fix relative paths in index.html specifically before saving to /pt/
    if p.name == "index.html" and p.parent == Path("."):
        content = content.replace('href="css/', 'href="/css/')
        content = content.replace('href="js/', 'href="/js/')
        
    pt_path.write_text(content)

print(f"✅ Copied {len(html_files)} files to /pt/ directory structure.")
