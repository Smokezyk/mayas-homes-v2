#!/usr/bin/env bash
# Generate a poster.jpg next to each video for use in the HTML <video poster="..."> attribute.
set -euo pipefail
for input in "$@"; do
  poster="${input%.mp4}-poster.jpg"
  ffmpeg -y -i "$input" -vframes 1 -q:v 2 "$poster" -loglevel error
  echo "  ✓ $poster"
done
