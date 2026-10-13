#!/usr/bin/env bash
set -euo pipefail

# Publish website files only; keep repository notes and tools outside the site.
test -f index.html
test -f css/build/base-08a0d16e3081297b.css
rm -rf dist/site
mkdir -p dist/site

for path in \
  404.html _redirects index.html robots.txt sitemap.xml \
  assets brand contact css fonts journal js logo media privacy profile \
  projects pt services terms thank-you vendor; do
  cp -R "$path" dist/site/
done

printf 'Prepared website-only publish directory: dist/site\n'
