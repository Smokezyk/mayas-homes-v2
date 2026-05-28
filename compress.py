import os
import subprocess
from pathlib import Path

assets_dir = Path("assets/images")
backup_dir = assets_dir / "heavy_backups"
backup_dir.mkdir(exist_ok=True)

# Find large files
heavy_files = []
for root, _, files in os.walk(assets_dir):
    if "heavy_backups" in root: continue
    for f in files:
        if f.lower().endswith(('.png', '.jpg', '.jpeg')):
            p = Path(root) / f
            if p.stat().st_size > 1024 * 1024:  # > 1MB
                heavy_files.append(p)

replacements = []

for p in heavy_files:
    print(f"Compressing {p.name} ({p.stat().st_size / 1024 / 1024:.2f} MB)...")
    webp_path = p.with_suffix('.webp')
    
    # Run cwebp
    cmd = ['cwebp', '-q', '80', '-resize', '2500', '0', str(p), '-o', str(webp_path)]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode == 0:
        print(f"✅ Success: {webp_path.name}")
        # Move original
        backup_p = backup_dir / p.name
        p.rename(backup_p)
        
        # Record replacement 
        old_str = p.name
        new_str = webp_path.name
        replacements.append((old_str, new_str))
    else:
        print(f"❌ Failed: {p.name}")
        print(res.stderr.decode())

if replacements:
    print("\nUpdating HTML and CSS files...")
    # Find all html and css files
    for root, _, files in os.walk("."):
        if ".git" in root or "heavy_backups" in root: continue
        for f in files:
            if f.endswith('.html') or f.endswith('.css'):
                filepath = Path(root) / f
                try:
                    with open(filepath, 'r') as file:
                        content = file.read()
                    
                    new_content = content
                    for old_str, new_str in replacements:
                        new_content = new_content.replace(old_str, new_str)
                        
                    if new_content != content:
                        with open(filepath, 'w') as file:
                            file.write(new_content)
                        print(f"Updated {filepath}")
                except Exception as e:
                    print(f"Could not update {filepath}: {e}")

print("\nDone! All heavy images compressed and references updated.")
