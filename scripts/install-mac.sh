#!/usr/bin/env bash
# ==============================================================================
# Android ↔ macOS Bridge — macOS Installer Script
# ==============================================================================
# Single-command setup for macOS:
# curl -sSL https://raw.githubusercontent.com/AnmolKamat/Termux-connect/main/scripts/install-mac.sh | bash
# ==============================================================================

set -e

GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RED="\033[31m"
BOLD="\033[1m"
RESET="\033[0m"

echo -e "\n${BOLD}${CYAN}=== Android ↔ macOS Bridge Installer (macOS) ===${RESET}\n"

# 1. Verify macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}[ERROR] This installer is intended for macOS.${RESET}"
    exit 1
fi

# 2. Check Node.js
echo -e "${GREEN}[1/5] Checking Node.js installation...${RESET}"
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js is not installed. Please install Node.js via Homebrew:${RESET}"
    echo -e "  brew install node"
    exit 1
fi

NODE_VER=$(node -v)
echo -e "Found Node.js ${BOLD}${NODE_VER}${RESET}"

# 3. Resolve project source directory
SCRIPT_DIR=""
if [ -n "${BASH_SOURCE[0]}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

APP_DIR="$HOME/.android-sync/app"

if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/package.json" ]; then
    PROJECT_DIR="$SCRIPT_DIR"
else
    echo -e "Downloading android-sync from GitHub..."
    mkdir -p "$APP_DIR"
    if [ -d "$APP_DIR/.git" ]; then
        cd "$APP_DIR" && git pull --quiet
    else
        git clone --depth 1 https://github.com/AnmolKamat/Termux-connect.git "$APP_DIR"
    fi
    PROJECT_DIR="$APP_DIR"
fi

cd "$PROJECT_DIR"

if [ ! -d "$PROJECT_DIR/dist" ]; then
    echo -e "\n${GREEN}[2/5] Building project TypeScript...${RESET}"
    npm install
    npm run build
else
    echo -e "\n${GREEN}[2/5] Pre-built runtime verified.${RESET}"
fi

# 4. Install CLI binary symlink
echo -e "\n${GREEN}[3/5] Installing android-sync binary...${RESET}"
CLI_BIN="$PROJECT_DIR/bin/android-sync.js"
chmod +x "$CLI_BIN"

TARGET_DIR="/usr/local/bin"
if [ ! -w "$TARGET_DIR" ]; then
    TARGET_DIR="$HOME/.local/bin"
    mkdir -p "$TARGET_DIR"
fi

ln -sf "$CLI_BIN" "$TARGET_DIR/android-sync"
echo -e "Linked ${BOLD}android-sync${RESET} to ${CYAN}$TARGET_DIR/android-sync${RESET}"

if [[ ":$PATH:" != *":$TARGET_DIR:"* ]]; then
    echo -e "${YELLOW}Notice: $TARGET_DIR is not currently in your PATH.${RESET}"
    echo -e "Add this to your ~/.zshrc if needed: ${CYAN}export PATH=\"\$PATH:$TARGET_DIR\"${RESET}"
fi

# 5. Initialize config directory and SSH keys
echo -e "\n${GREEN}[4/5] Initializing ~/.android-sync configuration and SSH keys...${RESET}"
node -e "
import('./dist/shared/config.js').then(({ PathManager }) => {
  PathManager.initialize();
  return import('./dist/device-manager/keys.js').then(({ KeyManager }) => KeyManager.ensureKeyPair());
}).then(() => console.log('✓ Configuration and SSH keys initialized.'))
.catch(err => console.error('Key initialization notice:', err.message));
"

# 6. Ask to install background LaunchAgent
echo -e "\n${GREEN}[5/5] Background Service Setup...${RESET}"
REPLY="n"
if [ -t 0 ]; then
    read -p "Would you like to install the background LaunchAgent for automatic syncing? (y/N): " -n 1 -r
    echo
elif [ -e /dev/tty ]; then
    read -p "Would you like to install the background LaunchAgent for automatic syncing? (y/N): " -n 1 -r < /dev/tty
    echo
fi

if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$TARGET_DIR/android-sync" service install
fi

echo -e "\n${BOLD}${GREEN}✓ Installation complete!${RESET}\n"
echo -e "Get started with:"
echo -e "  ${CYAN}android-sync${RESET}                  Launch interactive terminal interface"
echo -e "  ${CYAN}android-sync devices discover${RESET} Scan local network for your Android phone"
echo -e "  ${CYAN}android-sync devices pair <ip>${RESET} Pair your phone directly\n"
