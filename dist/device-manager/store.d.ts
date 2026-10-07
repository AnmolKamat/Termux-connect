import type { DeviceRecord, ConfigRecord } from '../protocol/types.js';
export declare class DeviceStore {
    static listDevices(): DeviceRecord[];
    static getDevice(id: string): DeviceRecord | undefined;
    static saveDevice(device: DeviceRecord): void;
    static removeDevice(id: string): boolean;
    static updateDeviceStatus(id: string, status: DeviceRecord['status'], lastSeen?: string): void;
}
export declare class ConfigStore {
    static getConfig(): ConfigRecord;
    static updateConfig(partial: Partial<ConfigRecord>): ConfigRecord;
}
//# sourceMappingURL=store.d.ts.map