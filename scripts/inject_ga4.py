#!/usr/bin/env python3
"""
inject_ga4.py — insert a GA4 placeholder into every page's <head>.

Adds a commented-out Google Analytics 4 (gtag.js) scaffold immediately
after the <meta name="theme-color"> line in all 38 HTML files (19 EN +
19 PT). The snippet ships commented out so nothing fires until the
owner is ready; activating it is two trivial steps:
    1. Replace G-XXXXXXXXXX with the real Measurement ID
    2. Uncomment the block

Idempotent: files that already contain the marker are skipped, so this
is safe to re-run.

Usage:
    python3 scripts/inject_ga4.py            # inject into all files
    python3 scripts/inject_ga4.py --dry-run  # report only, no writes
"""

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ANCHOR = '  <meta name="theme-color" content="#F4EFE6" />'
MARKER = "Google Analytics 4 — TODO"

GA4_BLOCK = """
  <!-- Google Analytics 4 — TODO: Insert GA4 Measurement ID here.
       Replace G-XXXXXXXXXX with your Measurement ID, then uncomment:
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
  -->"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    pages = sorted(p for p in ROOT.rglob("index.html") if "node_modules" not in p.parts)

    injected, skipped, missing_anchor = [], [], []
    for p in pages:
        text = p.read_text(encoding="utf-8")
        rel = p.relative_to(ROOT).as_posix()

        if MARKER in text:
            skipped.append(rel)
            continue
        if ANCHOR not in text:
            missing_anchor.append(rel)
            continue

        new_text = text.replace(ANCHOR, ANCHOR + GA4_BLOCK, 1)
        if not args.dry_run:
            p.write_text(new_text, encoding="utf-8")
        injected.append(rel)

    print(f"{'[dry-run] ' if args.dry_run else ''}Injected GA4 placeholder into {len(injected)} files.")
    if skipped:
        print(f"Skipped {len(skipped)} (already had the marker).")
    if missing_anchor:
        print(f"WARNING — {len(missing_anchor)} files missing the theme-color anchor:")
        for r in missing_anchor:
            print(f"  - {r}")


if __name__ == "__main__":
    main()
