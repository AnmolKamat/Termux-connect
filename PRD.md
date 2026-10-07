# Android ↔ macOS Bridge

**Status:** Draft
**Version:** 0.1
**Target Platforms:** macOS + Android
**Primary Interface:** macOS CLI
**Initial Transport:** SSH over local network
**Primary Initial Feature:** Android notification sync to macOS
**Future Direction:** General-purpose Android ↔ macOS device bridge

---

## 1. Overview

Android ↔ macOS Bridge is a lightweight, self-hosted utility that connects Android devices to a Mac over the local network using SSH.

The initial goal is to synchronize Android notifications to macOS without relying on cloud services or existing synchronization applications such as Pushbullet, KDE Connect, AirDroid, etc.

The project should be designed as a **general device bridge**, where notification synchronization is only the first capability.

Future capabilities may include:

- Android screen mirroring
- Remote screen control
- Using an Android phone as a Mac webcam
- Clipboard synchronization
- File transfer
- Media control
- Device information
- Battery/status monitoring
- Android command execution
- Camera streaming
- Audio streaming
- Remote input
- Phone-to-Mac and Mac-to-phone automation

The architecture must therefore separate the **device connection layer** from individual features.

---

# 2. Goals

## 2.1 Primary Goals

1. Connect Android devices to macOS over a local network.
2. Discover Android devices automatically.
3. Provide an interactive CLI for selecting and connecting devices.
4. Pair devices securely using SSH keys.
5. Synchronize Android notifications to macOS.
6. Avoid cloud infrastructure.
7. Avoid third-party synchronization services.
8. Support multiple Android devices.
9. Automatically reconnect when a device temporarily disconnects.
10. Provide a reusable transport layer for future device capabilities.

---

# 3. Non-Goals for MVP

The first release will NOT attempt to implement:

- Full remote desktop
- High-quality screen streaming
- Webcam virtualization
- Internet-based remote access
- Cloud synchronization
- Account/login systems
- Cross-platform desktop support
- iOS support

These may be considered later.

---

# 4. Core Design Principle

The system should not be built as a "notification sync application."

Instead, it should be built as:

> **A local Android device bridge with notification synchronization as its first capability.**

Conceptually:

```text
                    Android Bridge
                         │
             ┌───────────┴───────────┐
             │                       │
        Connection Layer         Capability Layer
             │                       │
        SSH / discovery       ┌──────┼──────┐
             │                │      │      │
        Authentication    Notifications Files Screen
             │                       │      │      │
             └───────────────────────┴──────┴───────
```

This separation is critical for future features.

---

# 5. System Architecture

```text
┌──────────────────────────── Mac ────────────────────────────┐
│                                                             │
│  android-sync CLI                                           │
│       │                                                     │
│       ├── Device Discovery                                  │
│       ├── Device Manager                                    │
│       ├── Pairing                                           │
│       ├── Connection Manager                                │
│       ├── Capability Manager                                │
│       └── Notification Renderer                             │
│                         │                                   │
│                    SSH Transport                            │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                     Local Network
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                         │ Android                           │
│                    SSH / Termux                             │
│                         │                                   │
│              Android Bridge Service                         │
│                         │                                   │
│       ┌─────────────────┼─────────────────┐                 │
│       │                 │                 │                 │
│ Notifications       Screen/ADB        Device APIs          │
│       │                 │                 │                 │
└───────┴─────────────────┴─────────────────┴─────────────────┘
```

---

# 6. Components

## 6.1 macOS CLI

Primary user-facing interface.

Proposed command:

```bash
android-sync
```

The CLI should provide an interactive terminal interface.

Possible commands:

```bash
android-sync
android-sync devices
android-sync devices discover
android-sync devices pair
android-sync connect
android-sync status
android-sync notifications
android-sync logs
```

Future commands:

```bash
android-sync screen
android-sync webcam
android-sync files
android-sync clipboard
android-sync media
```

---

# 7. Interactive Device Discovery

Running:

```bash
android-sync
```

should discover available Android devices.

Example:

```text
╭────────────────────────────────────╮
│        Android Bridge              │
╰────────────────────────────────────╯

  Devices

  ❯ 📱 Pixel 9 Pro
      192.168.1.42
      Connected

    📱 Samsung S24
      192.168.1.51
      Available

  ↑/↓ Navigate   Enter Select   q Quit
```

The interface should support:

- Arrow-key navigation
- Enter to select
- Escape to go back
- `q` to quit
- Search/filter where appropriate
- Device status indicators
- Connection status
- Battery status where available

---

# 8. Device Discovery

Preferred discovery mechanism:

### Primary

mDNS / Bonjour.

Android devices advertise a service such as:

```text
_android-sync._tcp
```

The Mac searches for these services.

### Fallback

UDP discovery over the local network.

### Last resort

Manual IP/hostname entry.

Example:

```bash
android-sync devices add 192.168.1.42
```

The user should normally never need to manually enter an IP.

---

# 9. Device Pairing

First-time connection should use an explicit pairing process.

Example:

```text
Found Android device:

  Pixel 9 Pro
  192.168.1.42

Connect and pair?

  ❯ Yes
    No
```

The CLI should display the SSH fingerprint:

```text
SSH fingerprint:

SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Accept this device?

  ❯ Yes
    No
```

After successful pairing:

```text
✓ Device authenticated
✓ SSH key installed
✓ Connection verified
✓ Device saved
```

---

# 10. Device Storage

Paired devices should be stored locally.

Suggested location:

```text
~/.android-sync/
```

Example:

```text
~/.android-sync/
├── config.json
├── devices.json
├── known_hosts
└── logs/
```

No cloud account should be required.

---

# 11. SSH Architecture

SSH is the initial transport mechanism.

The project should support:

- SSH public/private keys
- Known-host verification
- Persistent connections
- Connection health checks
- Automatic reconnect
- Configurable SSH port
- Multiple devices
- Connection timeout
- Graceful disconnection

The Android side should preferably expose SSH through Termux.

---

# 12. Notification Synchronization

## 12.1 Initial Feature

Android notifications should be forwarded to macOS.

Pipeline:

```text
Android App
     ↓
Android Notification System
     ↓
Notification Listener
     ↓
Android Bridge
     ↓
SSH
     ↓
Mac Bridge
     ↓
macOS Notification Center
```

---

# 13. Notification Data Model

Notifications should be normalized into a common format.

Example:

```json
{
  "event": "notification.created",
  "deviceId": "pixel-9-pro",
  "package": "com.whatsapp",
  "app": "WhatsApp",
  "title": "John",
  "body": "Hey, are you free?",
  "timestamp": 1791343200000,
  "notificationId": "..."
}
```

Supported events:

```text
notification.created
notification.updated
notification.removed
```

This event model should remain independent of the underlying transport.

---

# 14. macOS Notification Rendering

The Mac should convert incoming notification events into native macOS notifications.

Initial implementation may use:

```bash
osascript
```

Example:

```bash
osascript \
  -e 'display notification "Hey, are you free?" with title "WhatsApp — John"'
```

Later versions may use a native macOS application for richer functionality.

---

# 15. Notification Controls

Users should eventually be able to configure:

### Global

```text
Notifications
  ✓ Enabled
```

### Per application

```text
WhatsApp       ✓
Telegram       ✓
Gmail          ✓
Instagram      ✗
YouTube        ✗
```

### Per device

```text
Pixel 9 Pro
  Notifications ✓

Samsung S24
  Notifications ✗
```

---

# 16. Connection Management

The connection manager should maintain:

```text
Disconnected
     ↓
Discovering
     ↓
Connecting
     ↓
Authenticating
     ↓
Connected
     ↓
Reconnecting
```

The CLI should show status:

```text
● Pixel 9 Pro
  Connected
  Notifications: ON
```

If disconnected:

```text
○ Pixel 9 Pro
  Disconnected
  Reconnecting...
```

---

# 17. Automatic Reconnection

The bridge should automatically recover from:

- Wi-Fi changes
- Phone sleep
- Mac sleep
- Temporary SSH failure
- Android Termux restart
- IP address changes
- Network interruptions

Reconnect strategy should use exponential backoff.

Example:

```text
1 sec
2 sec
4 sec
8 sec
16 sec
30 sec
```

with a configurable maximum.

---

# 18. Security

The project should prioritize local-first security.

Requirements:

- SSH key authentication
- No password storage
- Host fingerprint verification
- No cloud authentication
- No external telemetry
- No notification contents sent to third-party servers
- Local-only communication by default
- Explicit device pairing
- Ability to remove/revoke a paired device

Command:

```bash
android-sync devices remove
```

---

# 19. Multiple Device Support

The architecture must support multiple Android devices.

Example:

```text
Devices

❯ Pixel 9 Pro
  Connected
  Notifications ON

  Samsung S24
  Connected
  Notifications OFF

  Nothing Phone
  Disconnected
```

The user should be able to enable different capabilities per device.

---

# 20. Capability System

The bridge should expose capabilities rather than hard-code functionality into the connection layer.

Example:

```json
{
  "deviceId": "pixel-9-pro",
  "capabilities": [
    "notifications",
    "clipboard",
    "files",
    "screen",
    "camera",
    "media"
  ]
}
```

The Mac can query:

```text
Device capabilities:

✓ Notifications
✓ Clipboard
✓ Files
✓ Media
✓ Screen
✗ Webcam
```

This allows future Android functionality to be added without redesigning device pairing or connection management.

---

# 21. Future Capability: Screen Mirroring

Potential future command:

```bash
android-sync screen
```

Expected UX:

```text
Select device:

❯ Pixel 9 Pro
  Samsung S24
```

Then:

```text
Connecting to Pixel 9 Pro...

✓ Screen stream started
```

Potential functionality:

- Screen viewing
- Adjustable resolution
- FPS control
- Fullscreen mode
- Screenshot
- Recording
- Input forwarding

---

# 22. Future Capability: Remote Screen Control

The bridge should eventually support:

```text
Mouse
Keyboard
Touch
Back
Home
Recent Apps
Volume
Power
```

Possible CLI:

```bash
android-sync screen --control
```

This capability should reuse the existing device connection.

---

# 23. Future Capability: Android as Mac Webcam

Potential command:

```bash
android-sync webcam
```

Architecture:

```text
Android Camera
      ↓
Video Encoder
      ↓
Local Network
      ↓
Mac Receiver
      ↓
Virtual Camera
      ↓
Zoom / Meet / Teams / OBS
```

Requirements:

- Low latency
- Configurable resolution
- Configurable FPS
- Front/rear camera selection
- Camera switching
- Microphone support as a future extension

This feature should be treated as a separate streaming capability rather than tightly coupling it to notifications.

---

# 24. Future Capability: Clipboard Sync

Example:

```text
Mac clipboard
     ↓
Bridge
     ↓
Android clipboard
```

And:

```text
Android clipboard
     ↓
Bridge
     ↓
Mac clipboard
```

Must include loop prevention.

---

# 25. Future Capability: File Transfer

Potential commands:

```bash
android-sync files
```

or:

```bash
android-sync push file.pdf
android-sync pull photo.jpg
```

Interactive interface:

```text
Pixel 9 Pro

Files

  📁 DCIM
  📁 Downloads
  📁 Documents
  📄 notes.txt
```

---

# 26. Future Capability: Media Control

The Mac could control Android playback:

```text
▶ Play
⏸ Pause
⏭ Next
⏮ Previous
🔊 Volume
```

And Android media events could be exposed to macOS.

---

# 27. Future Capability: Device Status

The CLI should eventually show:

```text
Pixel 9 Pro

Battery       78%
Charging      No
Wi-Fi         Home Wi-Fi
Signal        Strong
Storage       84 GB / 256 GB
Android       16
Connection    SSH
Latency       12 ms
```

---

# 28. CLI Technology

Preferred implementation:

```text
Node.js
TypeScript
```

The CLI should provide a polished interactive terminal experience similar to modern developer CLIs.

Potential components:

- Interactive prompts
- Select menus
- Spinners
- Tables
- Colored status indicators
- Progress bars
- Keyboard shortcuts

The CLI should remain usable non-interactively for scripting.

Example:

```bash
android-sync devices --json
```

```bash
android-sync status --json
```

---

# 29. Proposed Project Structure

```text
android-sync/
│
├── apps/
│   ├── cli/
│   └── android/
│
├── packages/
│   ├── protocol/
│   ├── transport/
│   ├── discovery/
│   ├── device-manager/
│   ├── notifications/
│   ├── screen/
│   ├── webcam/
│   └── shared/
│
├── docs/
│
├── scripts/
│
├── package.json
└── README.md
```

The exact structure can change during implementation.

The important requirement is that:

```text
Transport
   ≠
Capabilities
```

---

# 30. Protocol Layer

Even though SSH is the initial transport, messages should use a structured protocol.

Example:

```json
{
  "version": 1,
  "type": "event",
  "capability": "notifications",
  "event": "notification.created",
  "payload": {}
}
```

This allows the transport to evolve later.

Potential future transports:

```text
SSH
WebSocket
QUIC
USB
Bluetooth
```

without changing capability implementations.

---

# 31. Offline / Network Requirements

The system should work entirely on a local network.

Internet access should not be required after installation.

Example:

```text
Mac ←──── Wi-Fi ────→ Android
```

No:

```text
Mac → Cloud → Android
```

should be required.

---

# 32. MVP

The MVP is considered complete when a user can:

1. Install the required Android components.
2. Install the CLI on macOS.
3. Run:

```bash
android-sync
```

4. Automatically discover their Android phone.
5. Select it interactively.
6. Pair it using SSH.
7. Establish a persistent connection.
8. Enable notification synchronization.
9. Receive Android notifications in macOS Notification Center.
10. Disconnect and reconnect automatically.

---

# 33. MVP CLI

The initial interface should support:

```text
android-sync

┌──────────────────────────────────┐
│       Android Bridge             │
└──────────────────────────────────┘

Devices

❯ Pixel 9 Pro
  ● Connected

  Samsung S24
  ○ Available

Actions

  Connect
  Notifications
  Device Info
  Settings
  Quit
```

---

# 34. Development Phases

## Phase 1 — SSH Foundation

- Configure Mac SSH
- Configure Termux SSH
- Generate SSH keys
- Establish Android → Mac connection
- Verify key authentication

## Phase 2 — Device Discovery

- Implement mDNS discovery
- Implement fallback discovery
- Create device model
- Build interactive device selector
- Store paired devices

## Phase 3 — Connection Manager

- Persistent SSH connection
- Health checks
- Reconnection
- Connection state
- Multiple devices

## Phase 4 — Notification Sync

- Android notification listener
- Notification event model
- SSH transport
- Mac notification renderer
- Notification filtering

## Phase 5 — Background Operation

- Mac background service
- Android background handling
- Automatic startup
- Automatic reconnect
- Logging

## Phase 6 — CLI Polish

- Interactive menus
- Device management
- Status screen
- Logs
- Configuration
- JSON output
- Shell completion

## Phase 7 — Extended Capabilities

Potential order:

1. Clipboard
2. File transfer
3. Media control
4. Device status
5. Screen mirroring
6. Screen control
7. Webcam
8. Camera streaming
9. Audio streaming

The order can change based on technical feasibility.

---

# 35. Success Metrics

### MVP

- Device discovery completes within a few seconds.
- Pairing requires minimal manual configuration.
- Notifications arrive on Mac with low latency.
- Connection automatically recovers after network interruption.
- No external service is required.
- Multiple Android devices can coexist.

### Long-term

The project becomes a general-purpose Android ↔ macOS bridge where adding a new capability does not require rewriting:

- Discovery
- Pairing
- Authentication
- Connection management
- Device management
- CLI infrastructure

---

# 36. Guiding Principle

The project should feel like:

> **"My Android phone is a peripheral of my Mac."**

Rather than:

> **"I installed an app that forwards notifications."**

Notifications are simply the first feature that proves the bridge works.

The long-term architecture should make it possible to add:

```text
Android
   │
   ├── Notifications
   ├── Clipboard
   ├── Files
   ├── Media
   ├── Screen
   ├── Input
   ├── Camera
   ├── Webcam
   ├── Audio
   └── Device Control
          │
          ▼
         Mac
```

without changing the fundamental pairing and connectivity system.
