import { ConnectionManager } from '../transport/connection.js';
import type { DeviceInfoPayload, BatteryInfoPayload, FileListPayload, DeviceRecord } from '../protocol/types.js';
export declare class CapabilityManager {
    static getDeviceInfo(conn: ConnectionManager): Promise<DeviceInfoPayload>;
    static getBatteryStatus(conn: ConnectionManager): Promise<BatteryInfoPayload>;
    static getClipboard(conn: ConnectionManager): Promise<string>;
    static setClipboard(conn: ConnectionManager, text: string): Promise<boolean>;
    static listFiles(conn: ConnectionManager, remotePath?: string): Promise<FileListPayload>;
    /**
     * Pulls a file from Android using scp
     */
    static pullFile(device: DeviceRecord, remotePath: string, localPath: string): Promise<boolean>;
    /**
     * Pushes a file to Android using scp
     */
    static pushFile(device: DeviceRecord, localPath: string, remotePath: string): Promise<boolean>;
}
//# sourceMappingURL=manager.d.ts.map