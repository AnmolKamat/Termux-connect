#!/usr/bin/env bash
# ==============================================================================
# Android ↔ macOS Bridge — Termux Setup Script
# ==============================================================================
# Single-command setup for Android Termux:
# curl -sSL https://raw.githubusercontent.com/AnmolKamat/Termux-connect/main/scripts/setup-android.sh | bash
# ==============================================================================

set -e

GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RED="\033[31m"
BOLD="\033[1m"
RESET="\033[0m"

echo -e "\n${BOLD}${CYAN}=== Android ↔ macOS Bridge Setup (Termux) ===${RESET}\n"

# 1. Verify Termux environment
if [ -z "$PREFIX" ] && [ ! -d "/data/data/com.termux/files/usr" ]; then
    echo -e "${RED}[ERROR] This script must be run inside Termux on Android.${RESET}"
    exit 1
fi

PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
HOME="${HOME:-/data/data/com.termux/files/home}"

# 2. Install required packages
echo -e "${GREEN}[1/6] Installing required Termux packages (openssh, termux-api, nodejs, git)...${RESET}"
pkg install -y openssh termux-api nodejs git

# 3. Configure SSH server
echo -e "${GREEN}[2/6] Configuring OpenSSH server...${RESET}"
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
touch "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"

# Set SSH password if not set
echo -e "${YELLOW}Note: Termux has NO default password. You must set one for first-time pairing.${RESET}"
if [ -e /dev/tty ]; then
    read -p "Set a password now? (Y/n): " -n 1 -r < /dev/tty || true
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        passwd < /dev/tty || true
    fi
fi

# Start sshd if not running
if ! pgrep -x "sshd" > /dev/null 2>&1; then
    echo -e "${GREEN}[3/6] Starting OpenSSH daemon on port 8022...${RESET}"
    sshd
else
    echo -e "${GREEN}[3/6] OpenSSH daemon is already running.${RESET}"
fi

# 4. Install / deploy android-sync-bridge
echo -e "${GREEN}[4/6] Installing android-sync-bridge agent...${RESET}"
BRIDGE_DIR="$HOME/.android-sync-bridge"
mkdir -p "$BRIDGE_DIR"

SCRIPT_DIR=""
if [ -n "${BASH_SOURCE[0]}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/package.json" ]; then
    # Running from cloned repo
    echo -e "Using local repository at $SCRIPT_DIR..."
    if [ ! -d "$SCRIPT_DIR/dist" ]; then
        cd "$SCRIPT_DIR" && npm install && npm run build
    fi
    cp -r "$SCRIPT_DIR/dist" "$BRIDGE_DIR/"
    cp -r "$SCRIPT_DIR/bin" "$BRIDGE_DIR/"
    cp "$SCRIPT_DIR/package.json" "$BRIDGE_DIR/"
else
    # Running via curl | bash
    echo -e "Downloading pre-built android-sync-bridge from GitHub..."
    REPO_DIR="$BRIDGE_DIR/repo"
    rm -rf "$REPO_DIR"
    git clone --depth 1 https://github.com/AnmolKamat/Termux-connect.git "$REPO_DIR"
    
    if [ ! -d "$REPO_DIR/dist" ]; then
        echo -e "Building runtime..."
        cd "$REPO_DIR"
        npm install
        npm run build
    fi

    cp -r "$REPO_DIR/dist" "$BRIDGE_DIR/"
    cp -r "$REPO_DIR/bin" "$BRIDGE_DIR/"
    cp "$REPO_DIR/package.json" "$BRIDGE_DIR/"
fi

# Create global wrapper in $PREFIX/bin
cat << 'EOF' > "$PREFIX/bin/android-sync-bridge"
#!/data/data/com.termux/files/usr/bin/bash
BRIDGE_DIR="$HOME/.android-sync-bridge"
if [ -f "$BRIDGE_DIR/bin/android-sync-bridge.js" ]; then
    exec node "$BRIDGE_DIR/bin/android-sync-bridge.js" "$@"
elif [ -f "$BRIDGE_DIR/repo/bin/android-sync-bridge.js" ]; then
    exec node "$BRIDGE_DIR/repo/bin/android-sync-bridge.js" "$@"
else
    echo "android-sync-bridge: runtime files not found in $BRIDGE_DIR"
    exit 1
fi
EOF

chmod +x "$PREFIX/bin/android-sync-bridge"

# 5. Configure Termux:Boot autostart (if Termux:Boot installed)
echo -e "${GREEN}[5/6] Configuring boot autostart...${RESET}"
BOOT_DIR="$HOME/.termux/boot"
mkdir -p "$BOOT_DIR"
cat << 'EOF' > "$BOOT_DIR/android-sync.sh"
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
sshd
android-sync-bridge --daemon > /dev/null 2>&1 &
EOF
chmod +x "$BOOT_DIR/android-sync.sh"

# 6. Verify Termux:API permissions
echo -e "${GREEN}[6/6] Verifying Termux:API notification access...${RESET}"
set +e
TEST_NOTIF=$(termux-notification-list 2>&1)
NOTIF_EXIT=$?
set -e

if [ $NOTIF_EXIT -ne 0 ]; then
    echo -e "\n${YELLOW}===================================================================${RESET}"
    echo -e "${YELLOW}[ACTION REQUIRED] Grant Notification Access to Termux:API:${RESET}"
    echo -e " 1. Install ${BOLD}Termux:API${RESET} from F-Droid (if not installed)."
    echo -e " 2. Open Android Settings -> Apps -> Special app access -> Notification access."
    echo -e " 3. Enable toggle for ${BOLD}Termux:API${RESET}."
    echo -e "${YELLOW}===================================================================${RESET}\n"
else
    echo -e "${GREEN}✓ Termux:API notification access verified!${RESET}"
fi

# Request wake lock to prevent Android from sleeping
termux-wake-lock 2>/dev/null || true

# Start bridge daemon now
pkill -f "android-sync-bridge" 2>/dev/null || true
nohup android-sync-bridge --daemon > "$HOME/.android-sync-bridge.log" 2>&1 &

# Determine local IP address
LOCAL_IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "UNKNOWN_IP")

echo -e "\n${BOLD}${GREEN}✓ Android Bridge is successfully configured and running!${RESET}"
echo -e "--------------------------------------------------------"
echo -e "Device IP:   ${BOLD}${CYAN}${LOCAL_IP}${RESET}"
echo -e "SSH Port:    ${BOLD}${CYAN}8022${RESET}"
echo -e "SSH User:    ${BOLD}${CYAN}$(whoami)${RESET}"
echo -e "SSH Password: ${BOLD}${YELLOW}Run 'passwd' in Termux if asked during pairing${RESET}"
echo -e "Daemon Log:  ${BOLD}~/.android-sync-bridge.log${RESET}"
echo -e "--------------------------------------------------------"
echo -e "\n${BOLD}Now on your Mac, run:${RESET}"
echo -e "${CYAN}android-sync devices pair ${LOCAL_IP} 8022${RESET}\n"
