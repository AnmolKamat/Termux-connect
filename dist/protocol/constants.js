/**
 * Protocol constants for Android ↔ macOS Bridge
 */
export const PROTOCOL_VERSION = 1;
export const DEFAULT_SSH_PORT = 8022;
export const DEFAULT_UDP_PORT = 8765;
export const MDNS_SERVICE_NAME = '_android-sync._tcp';
export const DEFAULT_CONFIG_DIR_NAME = '.android-sync';
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 10000;
export const DEFAULT_HEARTBEAT_TIMEOUT_MS = 5000;
export const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]; // exponential backoff in ms
//# sourceMappingURL=constants.js.map