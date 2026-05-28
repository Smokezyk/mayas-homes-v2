#!/usr/bin/env python3
"""
inject_consent.py — replace the GA4 placeholder block with the
consent-gated GA4 loader (js/consent.js) in every page.

The previous pass (inject_ga4.py) left a commented-out gtag scaffold in
each <head>. This swaps that whole block for a single script tag that
loads js/consent.js — which renders the GDPR banner and only loads GA4
(G-0W5WYQL10G) after the visitor clicks Accept.

Idempotent: if the consent script tag is already present, the file is
skipped. If neither the placeholder nor the consent tag is found, the
file is reported so it can be handled by hand.

Usage:
    python3 scripts/inject_consent.py
    python3 scripts/inject_consent.py --dry-run
"""

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The exact block written by inject_ga4.py (matched loosely on the
# stable first/last lines so minor whitespace drift doesn't break it).
PLACEHOLDER_RE = re.compile(
    r'[ \t]*<!-- Google Analytics 4 — TODO:.*?-->\n?',
    re.S,
)

CONSENT_TAG = (
    '  <!-- Cookie consent + consent-gated GA4 (G-0W5WYQL10G). '
    'GA4 loads only after the visitor clicks Accept. See js/consent.js. -->\n'
    '  <script src="/js/consent.js?v=1" defer></script>\n'
)

CONSENT_MARKER = '/js/consent.js'
# Fallback anchor for any file that somehow lacks the placeholder.
ANCHOR = '  <meta name="theme-color" content="#F4EFE6" />\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    pages = sorted(p for p in ROOT.rglob("index.html") if "node_modules" not in p.parts)

    swapped, already, anchored, missing = [], [], [], []
    for p in pages:
        text = p.read_text(encoding="utf-8")
        rel = p.relative_to(ROOT).as_posix()

        if CONSENT_MARKER in text:
            already.append(rel)
            continue

        if PLACEHOLDER_RE.search(text):
            new_text = PLACEHOLDER_RE.sub(CONSENT_TAG, text, count=1)
            note = swapped
        elif ANCHOR in text:
            new_text = text.replace(ANCHOR, ANCHOR + CONSENT_TAG, 1)
            note = anchored
        else:
            missing.append(rel)
            continue

        if not args.dry_run:
            p.write_text(new_text, encoding="utf-8")
        note.append(rel)

    pfx = "[dry-run] " if args.dry_run else ""
    print(f"{pfx}Swapped placeholder → consent tag in {len(swapped)} files.")
    if anchored:
        print(f"{pfx}Added consent tag via theme-color anchor in {len(anchored)} files (no placeholder found).")
    if already:
        print(f"Skipped {len(already)} (consent tag already present).")
    if missing:
        print(f"WARNING — {len(missing)} files had neither placeholder nor anchor:")
        for r in missing:
            print(f"  - {r}")


if __name__ == "__main__":
    main()
