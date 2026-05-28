#!/usr/bin/env bash
# Web-encode any video to editorial-grade compressed MP4.
# Usage: ./scripts/encode-web.sh path/to/video.mp4
# Output replaces the original after verifying the new file is smaller.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 path/to/video.mp4 [more.mp4 ...]"
  exit 1
fi

for input in "$@"; do
  if [[ ! -f "$input" ]]; then
    echo "Skipping (not found): $input"
    continue
  fi

  tmp="${input%.mp4}.tmp.mp4"
  echo "Encoding: $input"

  ffmpeg -y -i "$input" \
    -vcodec libx264 \
    -crf 22 \
    -preset slow \
    -vf "scale='min(1920,iw)':-2" \
    -an \
    -movflags +faststart \
    "$tmp" \
    -loglevel error -stats

  orig_size=$(stat -f%z "$input" 2>/dev/null || stat -c%s "$input")
  new_size=$(stat -f%z "$tmp" 2>/dev/null || stat -c%s "$tmp")

  if (( new_size < orig_size )); then
    mv "$tmp" "$input"
    echo "  ✓ $input — $orig_size → $new_size bytes ($(( 100 - (new_size * 100 / orig_size) ))% smaller)"
  else
    rm "$tmp"
    echo "  ⚠ Skipped overwrite — encoded version was not smaller"
  fi
done
