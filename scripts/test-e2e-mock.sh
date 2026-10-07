#!/usr/bin/env bash
# ==============================================================================
# End-to-End Mock Integration Test for Android ↔ macOS Bridge
# ==============================================================================

set -e

GREEN="\033[32m"
CYAN="\033[36m"
RED="\033[31m"
BOLD="\033[1m"
RESET="\033[0m"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo -e "${BOLD}${CYAN}=== Running E2E Mock Integration Test ===${RESET}\n"

# Create isolated test directory
TMP_CONFIG_DIR=$(mktemp -d /tmp/android-sync-e2e-XXXXXX)
export ANDROID_SYNC_DIR="$TMP_CONFIG_DIR"

cleanup() {
    echo -e "\nCleaning up test environment ($TMP_CONFIG_DIR)..."
    if [ -n "$BRIDGE_PID" ]; then
        kill "$BRIDGE_PID" 2>/dev/null || true
    fi
    rm -rf "$TMP_CONFIG_DIR"
}
trap cleanup EXIT

# 1. Initialize config and generate SSH key
echo -e "${GREEN}[1/5] Initializing isolated config and keys in $TMP_CONFIG_DIR...${RESET}"
node -e "
import('./dist/shared/config.js').then(({ PathManager }) => {
  PathManager.initialize();
  return import('./dist/device-manager/keys.js').then(({ KeyManager }) => KeyManager.ensureKeyPair());
}).then(() => console.log('✓ Initialized.'));
"

# 2. Add mock device to store
echo -e "\n${GREEN}[2/5] Adding mock paired device (Pixel 9 Pro)...${RESET}"
node -e "
import('./dist/device-manager/store.js').then(({ DeviceStore }) => {
  DeviceStore.saveDevice({
    id: 'pixel-9-pro',
    name: 'Pixel 9 Pro',
    host: '127.0.0.1',
    port: 8022,
    capabilities: ['notifications', 'device', 'clipboard', 'files'],
    pairedAt: new Date().toISOString(),
    status: 'connected',
    notificationFilter: { enabled: true }
  });
  console.log('✓ Mock device saved.');
});
"

# 3. Test CLI non-interactive JSON commands
echo -e "\n${GREEN}[3/5] Testing 'android-sync devices --json'...${RESET}"
DEV_JSON=$(node bin/android-sync.js devices --json)
echo "$DEV_JSON"
if echo "$DEV_JSON" | grep -q "pixel-9-pro"; then
    echo -e "${GREEN}✓ 'devices --json' returned paired device successfully${RESET}"
else
    echo -e "${RED}✗ Failed to find pixel-9-pro in JSON output${RESET}"
    exit 1
fi

echo -e "\n${GREEN}[4/5] Testing 'android-sync status --json'...${RESET}"
STATUS_JSON=$(node bin/android-sync.js status --json)
echo "$STATUS_JSON"
if echo "$STATUS_JSON" | grep -q "devicesCount"; then
    echo -e "${GREEN}✓ 'status --json' succeeded${RESET}"
else
    echo -e "${RED}✗ Status output missing devicesCount${RESET}"
    exit 1
fi

# 5. Test streaming protocol & notification pipeline
echo -e "\n${GREEN}[5/5] Testing protocol streaming & notification delivery...${RESET}"
node -e "
import { LineProtocolParser, encodeMessage } from './dist/protocol/parser.js';
import { NotificationRenderer } from './dist/notifications/renderer.js';

const parser = new LineProtocolParser();
let notifReceived = false;

parser.on('message', async (msg) => {
  if (msg.event === 'notification.created') {
    notifReceived = true;
    console.log('✓ Protocol parsed notification message: ' + msg.payload.title);
    const rendered = await NotificationRenderer.render(msg.payload);
    console.log('✓ NotificationRenderer executed (rendered: ' + rendered + ')');
  }
});

// Simulate streaming message from Android bridge
const testMsg = encodeMessage({
  type: 'event',
  capability: 'notifications',
  event: 'notification.created',
  payload: {
    event: 'notification.created',
    deviceId: 'pixel-9-pro',
    package: 'com.whatsapp',
    app: 'WhatsApp',
    title: 'Alice',
    body: 'Coffee at 3?',
    timestamp: Date.now(),
    notificationId: 'notif-999'
  }
});

parser.feed(testMsg);

if (!notifReceived) {
  process.exit(1);
}
"

echo -e "\n${BOLD}${GREEN}=== All E2E Integration Tests Passed! ===${RESET}\n"
