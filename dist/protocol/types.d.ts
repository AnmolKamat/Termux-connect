/**
 * Protocol Types for Android ↔ macOS Bridge
 * Version 1 specification as outlined in PRD §13, §20, §30
 */
export type MessageType = 'event' | 'request' | 'response' | 'error' | 'ping' | 'pong';
export type CapabilityType = 'notifications' | 'device' | 'clipboard' | 'files' | 'screen' | 'media';
export type ConnectionState = 'disconnected' | 'discovering' | 'connecting' | 'authenticating' | 'connected' | 'reconnecting';
export interface ProtocolMessage<T = unknown> {
    version: number;
    id?: string;
    type: MessageType;
    capability?: CapabilityType;
    event?: string;
    action?: string;
    payload?: T;
    error?: string;
    timestamp?: number;
}
export type NotificationEventType = 'notification.created' | 'notification.updated' | 'notification.removed';
export interface NotificationPayload {
    event: NotificationEventType;
    deviceId: string;
    package: string;
    app: string;
    title: string;
    body: string;
    timestamp: number;
    notificationId: string;
}
export interface DeviceInfoPayload {
    deviceId: string;
    name: string;
    model: string;
    manufacturer: string;
    androidVersion: string;
    batteryLevel?: number;
    isCharging?: boolean;
    batteryHealth?: string;
    wifiSsid?: string;
    storageFreeGb?: number;
    storageTotalGb?: number;
    capabilities: CapabilityType[];
    uptimeSeconds?: number;
    ip?: string;
    port?: number;
}
export interface BatteryInfoPayload {
    level: number;
    plugged: boolean;
    status: string;
    temperature?: number;
    health?: string;
}
export interface ClipboardPayload {
    text: string;
    timestamp: number;
    sourceId: string;
}
export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modifiedTime: number;
}
export interface FileListPayload {
    path: string;
    entries: FileEntry[];
}
export interface DiscoveryBeacon {
    id: string;
    name: string;
    model: string;
    ip: string;
    port: number;
    capabilities: CapabilityType[];
    version: number;
    timestamp: number;
}
export interface DeviceRecord {
    id: string;
    name: string;
    model?: string;
    host: string;
    port: number;
    user?: string;
    capabilities: CapabilityType[];
    pairedAt: string;
    lastSeen?: string;
    fingerprint?: string;
    status?: ConnectionState;
    notificationFilter?: {
        enabled: boolean;
        whitelist?: string[];
        blacklist?: string[];
    };
}
export interface ConfigRecord {
    defaultDeviceId?: string;
    autoConnect: boolean;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    discoveryTimeoutSeconds: number;
    heartbeatIntervalMs: number;
}
//# sourceMappingURL=types.d.ts.map