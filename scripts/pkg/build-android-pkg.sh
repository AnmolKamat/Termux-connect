#!/usr/bin/env bash
# ==============================================================================
# Build Android Termux distribution package (.tar.gz)
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_DIR"

echo "Building Android Termux distribution package..."
npm run build

DIST_PKG_DIR="$PROJECT_DIR/dist/packages/android-termux"
rm -rf "$DIST_PKG_DIR"
mkdir -p "$DIST_PKG_DIR/bin" "$DIST_PKG_DIR/dist"

cp -r "$PROJECT_DIR/bin/android-sync-bridge.js" "$DIST_PKG_DIR/bin/"
cp -r "$PROJECT_DIR/dist"/* "$DIST_PKG_DIR/dist/"
cp "$PROJECT_DIR/scripts/setup-android.sh" "$DIST_PKG_DIR/install.sh"
chmod +x "$DIST_PKG_DIR/install.sh"
cp "$PROJECT_DIR/package.json" "$DIST_PKG_DIR/"

OUT_ARCHIVE="$PROJECT_DIR/dist/packages/android-sync-termux-v0.1.0.tar.gz"
tar -czf "$OUT_ARCHIVE" -C "$PROJECT_DIR/dist/packages" android-termux

echo "✓ Created Android Termux package: $OUT_ARCHIVE"
