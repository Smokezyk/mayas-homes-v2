#!/usr/bin/env python3
"""
audit_assets.py — classify every file under assets/ as USED or ORPHANED
by scanning all HTML/CSS/JS/XML/JSON for references to its filename.

Read-only. Writes two reports to scripts/_audit/ for review:
    used.txt      — assets referenced somewhere
    orphans.txt   — assets referenced nowhere (deletion candidates)

Matching is by basename, tested both raw and URL-encoded (# -> %23,
space -> %20), so it catches /assets/... paths, ?v= query strings, and
the encoded '#'/space filenames this repo uses. Conservative: if a
basename appears anywhere in the corpus, the asset is treated as USED.
"""

import os
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
OUT = ROOT / "scripts" / "_audit"
CORPUS_EXT = {".html", ".css", ".js", ".xml", ".json", ".webmanifest", ".txt", ".md"}

def human(kb):
    return f"{kb/1024:.1f} MB" if kb >= 1024 else f"{kb} KB"

def main():
    OUT.mkdir(parents=True, exist_ok=True)

    # 1. Load the corpus into one blob.
    blob = []
    for p in ROOT.rglob("*"):
        if p.is_file() and p.suffix.lower() in CORPUS_EXT and "node_modules" not in p.parts \
           and ASSETS not in p.parents:
            try:
                blob.append(p.read_text(encoding="utf-8", errors="ignore"))
            except Exception:
                pass
    corpus = "\n".join(blob)

    # 2. Classify each asset.
    used, orphans = [], []
    used_kb = orphan_kb = 0
    for f in sorted(ASSETS.rglob("*")):
        if not f.is_file():
            continue
        base = f.name
        enc = quote(base)            # '#'->%23, ' '->%20, etc.
        kb = max(1, f.stat().st_size // 1024)
        rel = f.relative_to(ROOT).as_posix()
        if base in corpus or enc in corpus:
            used.append((rel, kb)); used_kb += kb
        else:
            orphans.append((rel, kb)); orphan_kb += kb

    (OUT / "used.txt").write_text(
        "\n".join(f"{kb}\t{rel}" for rel, kb in used), encoding="utf-8")
    (OUT / "orphans.txt").write_text(
        "\n".join(f"{kb}\t{rel}" for rel, kb in sorted(orphans, key=lambda x: -x[1])),
        encoding="utf-8")

    print(f"USED:     {len(used):4d} files  ({human(used_kb)})")
    print(f"ORPHANED: {len(orphans):4d} files  ({human(orphan_kb)})")
    print()
    # Orphans grouped by top-level folder under assets/
    by_dir = {}
    for rel, kb in orphans:
        d = "/".join(rel.split("/")[:3]) if rel.count("/") >= 2 else os.path.dirname(rel)
        by_dir.setdefault(d, [0, 0])
        by_dir[d][0] += 1; by_dir[d][1] += kb
    print("Orphans by folder:")
    for d, (n, kb) in sorted(by_dir.items(), key=lambda x: -x[1][1]):
        print(f"  {human(kb):>10}  {n:4d}  {d}/")
    print()
    print("Top 15 largest orphans:")
    for rel, kb in sorted(orphans, key=lambda x: -x[1])[:15]:
        print(f"  {human(kb):>10}  {rel}")

if __name__ == "__main__":
    main()
