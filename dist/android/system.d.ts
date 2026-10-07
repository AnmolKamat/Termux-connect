import type { DeviceInfoPayload, BatteryInfoPayload, ClipboardPayload, FileListPayload } from '../protocol/types.js';
export declare class AndroidSystem {
    private static cachedDeviceId;
    private static cachedDeviceName;
    static getModel(): Promise<string>;
    static getManufacturer(): Promise<string>;
    static getAndroidVersion(): Promise<string>;
    static getDeviceId(): Promise<string>;
    static getDeviceName(): Promise<string>;
    static getBattery(): Promise<BatteryInfoPayload>;
    static getDeviceInfo(): Promise<DeviceInfoPayload>;
    static getClipboard(): Promise<ClipboardPayload>;
    static setClipboard(text: string): Promise<boolean>;
    static listFiles(dirPath?: string): Promise<FileListPayload>;
}
//# sourceMappingURL=system.d.ts.map