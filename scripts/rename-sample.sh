#!/usr/bin/env bash
# rename-sample.sh — rename a sample directory and sync its package.json name
#
# Usage: rename-sample.sh <old-dirname> <new-dirname>
# Example: rename-sample.sh hbox-layout-demo layout-hbox-demo

set -euo pipefail

SAMPLES_DIR="$(cd "$(dirname "$0")/../samples" && pwd)"

OLD_DIR="$1"
NEW_DIR="$2"

OLD_PATH="$SAMPLES_DIR/$OLD_DIR"
NEW_PATH="$SAMPLES_DIR/$NEW_DIR"

OLD_PKG="@framesquared/sample-$OLD_DIR"
NEW_PKG="@framesquared/sample-$NEW_DIR"

# ── Validate ──────────────────────────────────────────────────────────────────

if [[ -z "$OLD_DIR" || -z "$NEW_DIR" ]]; then
  echo "Usage: $(basename "$0") <old-dirname> <new-dirname>" >&2
  exit 1
fi

if [[ ! -d "$OLD_PATH" ]]; then
  echo "Error: '$OLD_PATH' does not exist." >&2
  exit 1
fi

if [[ -d "$NEW_PATH" ]]; then
  echo "Error: '$NEW_PATH' already exists." >&2
  exit 1
fi

PKG_JSON="$OLD_PATH/package.json"
if [[ ! -f "$PKG_JSON" ]]; then
  echo "Error: '$PKG_JSON' not found." >&2
  exit 1
fi

# ── Rename directory ──────────────────────────────────────────────────────────

mv "$OLD_PATH" "$NEW_PATH"
echo "Renamed directory: $OLD_DIR → $NEW_DIR"

# ── Update package.json name ──────────────────────────────────────────────────

NEW_PKG_JSON="$NEW_PATH/package.json"
sed -i "s|\"$OLD_PKG\"|\"$NEW_PKG\"|g" "$NEW_PKG_JSON"
echo "Updated package name: $OLD_PKG → $NEW_PKG"
