# Android ↔ macOS Bridge (`android-sync`)

> Lightweight, local-first Android ↔ macOS device bridge over local network with automatic discovery, interactive CLI, and real-time notification synchronization.

Designed in accordance with the [PRD](PRD.md).

---

## 🌟 Highlights

- **Local-Only & Self-Hosted**: No cloud accounts, zero third-party telemetry, 100% private over Wi-Fi.
- **Interactive Terminal UI**: Beautiful modern CLI with arrow-key navigation, status badges, and spinners.
- **Automatic Device Discovery**: mDNS / Bonjour (`_android-sync._tcp`) + UDP broadcast fallback.
- **Secure Pairing**: Automatic Ed25519 SSH keypair generation, fingerprint verification, and key exchange.
- **Native macOS Notifications**: Real-time notification mirroring with `osascript` integration and app filtering.
- **Auto-Reconnect**: Exponential backoff reconnect engine (`1s → 2s → 4s → 8s → 16s → 30s`) surviving Wi-Fi switches and sleep.
- **Modular Capability Architecture**: Clear separation of Connection Layer and Capability Layer (Notifications, Battery/Specs, Clipboard, Files, Screen readiness).
- **Background Daemon**: macOS LaunchAgent support (`android-sync service install`) for 24/7 background syncing.

---

## 🏗 System Architecture

```text
┌──────────────────────────── Mac ────────────────────────────┐
│                                                             │
│  android-sync CLI                                           │
│       │                                                     │
│       ├── Device Discovery (mDNS + UDP)                     │
│       ├── Device Manager (~/.android-sync/devices.json)     │
│       ├── Pairing & Key Manager (~/.android-sync/id_ed25519)│
│       ├── Connection Manager (auto-reconnect + heartbeat)   │
│       ├── Capability Manager (info, clipboard, files)       │
│       └── Notification Renderer (osascript display)         │
│                         │                                   │
│                    SSH Transport                            │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │ Local Network (Wi-Fi)
┌─────────────────────────┼───────────────────────────────────┐
│                         │ Android (Termux)                  │
│                    OpenSSH (port 8022)                      │
│                         │                                   │
│              android-sync-bridge daemon                     │
│                         │                                   │
│       ┌─────────────────┼─────────────────┐                 │
│       │                 │                 │                 │
│ Notifications       Device Specs      Clipboard / Files     │
│ (Termux:API)      (Battery, Model)      (/sdcard, sync)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Android Setup (Termux)

On your Android device:
1. Install **[Termux](https://f-droid.org/packages/com.termux/)** and **[Termux:API](https://f-droid.org/packages/com.termux.api/)** from F-Droid.
2. Grant **Notification Access** to `Termux:API` in Android Settings:
   - *Android Settings → Apps → Special app access → Notification access → Termux:API (Toggle ON)*.
3. Open Termux and run the one-line setup command:

```bash
curl -sSL https://raw.githubusercontent.com/AnmolKamat/Termux-connect/main/scripts/setup-android.sh | bash
```

The script will automatically:
- Install `openssh`, `termux-api`, and `nodejs`.
- Start the SSH server on port `8022`.
- Install and launch the `android-sync-bridge` background agent.
- Display your phone's local IP address and pairing command.

---

### 2. macOS Setup

On your Mac, install via the one-line installer command:

```bash
curl -sSL https://raw.githubusercontent.com/AnmolKamat/Termux-connect/main/scripts/install-mac.sh | bash
```

This sets up dependencies, builds the project, links `android-sync` globally, and initializes `~/.android-sync`.

---

### 3. Pair & Connect

Launch the interactive interface:

```bash
android-sync
```

Or pair directly:

```bash
# Scan local network for devices
android-sync devices discover

# Pair with your Android phone
android-sync devices pair 192.168.1.42 8022

# Start syncing notifications
android-sync connect
```

---

## 💻 CLI Commands

| Command | Description |
|---|---|
| `android-sync` | Launch interactive terminal UI (TUI) |
| `android-sync devices` | List paired devices (`--json` supported) |
| `android-sync devices discover` | Scan local network via mDNS & UDP broadcast |
| `android-sync devices pair <ip> [port]` | Pair device and exchange SSH keys |
| `android-sync devices remove <id>` | Unpair and remove a saved device |
| `android-sync connect [id]` | Start persistent sync session |
| `android-sync status` | Inspect bridge and background service status |
| `android-sync notifications` | List active notifications on phone |
| `android-sync notifications --watch` | Stream notifications live in terminal & Notification Center |
| `android-sync info [id]` | Display phone specs, battery %, charging state, storage |
| `android-sync clipboard --get` | Fetch clipboard from phone and copy to Mac clipboard |
| `android-sync clipboard --set <text>` | Set phone clipboard |
| `android-sync files list [path]` | List files on Android (default: `/sdcard`) |
| `android-sync files pull <remote> [dest]` | Download file from phone via `scp` |
| `android-sync files push <src> [dest]` | Upload file to phone via `scp` |
| `android-sync service install` | Install macOS background LaunchAgent for 24/7 sync |
| `android-sync service status` | Check background daemon status |
| `android-sync service stop` | Stop background daemon |
| `android-sync logs [-f]` | View or tail bridge logs |

---

## 📦 Distribution Packages

Pre-built standalone distribution packages can be generated using the scripts in `scripts/pkg/`:

```bash
# Build macOS distribution archive (.tar.gz)
./scripts/pkg/build-mac-pkg.sh

# Build Android Termux distribution archive (.tar.gz)
./scripts/pkg/build-android-pkg.sh
```

Packages are placed in `dist/packages/`:
- `android-sync-mac-v0.1.0.tar.gz`
- `android-sync-termux-v0.1.0.tar.gz`

---

## 🧪 Testing

Run the automated test suites:

```bash
# Unit tests (protocol, store, filters)
npm test

# Full End-to-End Mock Integration Test
./scripts/test-e2e-mock.sh
```

---

## 🔒 Security

- **No Passwords**: Authenticates strictly via Ed25519 SSH keys.
- **Host Verification**: Scans and verifies host key fingerprints (`SHA256:...`) during pairing.
- **Isolated Storage**: Keys, configuration, and logs are isolated in `~/.android-sync/` with `0700` / `0600` permissions.
- **Zero Telemetry**: No cloud dependencies or third-party servers.
