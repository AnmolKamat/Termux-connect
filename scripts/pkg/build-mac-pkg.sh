#!/usr/bin/env bash
# ==============================================================================
# Build macOS distribution package (.tar.gz)
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_DIR"

echo "Building macOS distribution package..."
npm run build

DIST_PKG_DIR="$PROJECT_DIR/dist/packages/mac"
rm -rf "$DIST_PKG_DIR"
mkdir -p "$DIST_PKG_DIR/bin" "$DIST_PKG_DIR/dist" "$DIST_PKG_DIR/scripts"

cp -r "$PROJECT_DIR/bin/android-sync.js" "$DIST_PKG_DIR/bin/"
cp -r "$PROJECT_DIR/dist"/* "$DIST_PKG_DIR/dist/"
cp "$PROJECT_DIR/scripts/install-mac.sh" "$DIST_PKG_DIR/install.sh"
chmod +x "$DIST_PKG_DIR/install.sh"
cp "$PROJECT_DIR/scripts/com.android-sync.agent.plist" "$DIST_PKG_DIR/scripts/"
cp "$PROJECT_DIR/package.json" "$DIST_PKG_DIR/"
cp "$PROJECT_DIR/README.md" "$DIST_PKG_DIR/" 2>/dev/null || true

OUT_ARCHIVE="$PROJECT_DIR/dist/packages/android-sync-mac-v0.1.0.tar.gz"
tar -czf "$OUT_ARCHIVE" -C "$PROJECT_DIR/dist/packages" mac

echo "✓ Created macOS package: $OUT_ARCHIVE"
