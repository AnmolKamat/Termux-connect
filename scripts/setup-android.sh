#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Android ↔ macOS Bridge — Termux Setup Script
# ==============================================================================
# This script sets up OpenSSH, Termux:API, Node.js, and installs the
# android-sync-bridge daemon on your Android device via Termux.
# ==============================================================================

set -e

GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RED="\033[31m"
BOLD="\033[1m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}=== Android ↔ macOS Bridge Setup (Termux) ===${RESET}\n"

# 1. Verify Termux environment
if [ -z "$PREFIX" ]; then
    echo -e "${RED}[ERROR] This script must be run inside Termux on Android.${RESET}"
    exit 1
fi

# 2. Update package repositories and install dependencies
echo -e "${GREEN}[1/6] Installing required Termux packages (openssh, termux-api, nodejs)...${RESET}"
pkg update -y
pkg install -y openssh termux-api nodejs git

# 3. Configure SSH server
echo -e "${GREEN}[2/6] Configuring OpenSSH server...${RESET}"
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
touch "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"

# Set SSH password if not set
echo -e "${YELLOW}Note: If you have not set a Termux password yet, you can run 'passwd' to set one.${RESET}"

# Start sshd if not running
if ! pgrep -x "sshd" > /dev/null; then
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
    echo -e "Copying bridge files from local repository ($SCRIPT_DIR)..."
    cp -r "$SCRIPT_DIR/dist" "$BRIDGE_DIR/" 2>/dev/null || true
    cp -r "$SCRIPT_DIR/bin" "$BRIDGE_DIR/" 2>/dev/null || true
    cp "$SCRIPT_DIR/package.json" "$BRIDGE_DIR/" 2>/dev/null || true
else
    # Running via curl | bash
    echo -e "Fetching android-sync from GitHub..."
    REPO_DIR="$BRIDGE_DIR/repo"
    rm -rf "$REPO_DIR"
    git clone --depth 1 https://github.com/AnmolKamat/Termux-connect.git "$REPO_DIR"
    cd "$REPO_DIR"
    echo -e "Setting up runtime dependencies..."
    npm install --omit=dev 2>/dev/null || npm install
    npm run build 2>/dev/null || true
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
    echo -e " 1. Install the ${BOLD}Termux:API${RESET} APK from F-Droid (if not installed)."
    echo -e " 2. Open Android Settings -> Apps -> Special app access -> Notification access."
    echo -e " 3. Enable toggle for ${BOLD}Termux:API${RESET}."
    echo -e "${YELLOW}===================================================================${RESET}\n"
else
    echo -e "${GREEN}✓ Termux:API notification access verified!${RESET}"
fi

# Request wake lock to prevent Android from killing background sync
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
echo -e "Daemon Log:  ${BOLD}~/.android-sync-bridge.log${RESET}"
echo -e "--------------------------------------------------------"
echo -e "\n${BOLD}To pair with your Mac, run on macOS terminal:${RESET}"
echo -e "${CYAN}android-sync devices pair ${LOCAL_IP} 8022${RESET}\n"
