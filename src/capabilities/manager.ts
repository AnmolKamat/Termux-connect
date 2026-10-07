import { ConnectionManager } from '../transport/connection.js';
import { runCommand } from '../shared/exec.js';
import { PathManager } from '../shared/config.js';
import { Logger } from '../shared/logger.js';
import type {
  DeviceInfoPayload,
  BatteryInfoPayload,
  ClipboardPayload,
  FileListPayload,
  DeviceRecord,
} from '../protocol/types.js';

export class CapabilityManager {
  public static async getDeviceInfo(conn: ConnectionManager): Promise<DeviceInfoPayload> {
    return conn.request<DeviceInfoPayload>('device', 'get_info');
  }

  public static async getBatteryStatus(conn: ConnectionManager): Promise<BatteryInfoPayload> {
    return conn.request<BatteryInfoPayload>('device', 'get_battery');
  }

  public static async getClipboard(conn: ConnectionManager): Promise<string> {
    const res = await conn.request<ClipboardPayload>('clipboard', 'get');
    return res.text;
  }

  public static async setClipboard(conn: ConnectionManager, text: string): Promise<boolean> {
    await conn.request('clipboard', 'set', { text });
    return true;
  }

  public static async listFiles(conn: ConnectionManager, remotePath = '/sdcard'): Promise<FileListPayload> {
    return conn.request<FileListPayload>('files', 'list', { path: remotePath });
  }

  /**
   * Pulls a file from Android using scp
   */
  public static async pullFile(device: DeviceRecord, remotePath: string, localPath: string): Promise<boolean> {
    const privKey = PathManager.getPrivateKeyFile();
    const knownHosts = PathManager.getKnownHostsFile();
    const userTarget = device.user ? `${device.user}@${device.host}` : device.host;

    const args = [
      '-i', privKey,
      '-P', String(device.port || 8022),
      '-o', `UserKnownHostsFile=${knownHosts}`,
      '-o', 'StrictHostKeyChecking=accept-new',
      `${userTarget}:${remotePath}`,
      localPath,
    ];

    Logger.info(`Pulling file from ${remotePath} to ${localPath}...`);
    const res = await runCommand('scp', args, { timeout: 60000 });
    if (res.code !== 0) {
      throw new Error(`Failed to pull file: ${res.stderr}`);
    }
    return true;
  }

  /**
   * Pushes a file to Android using scp
   */
  public static async pushFile(device: DeviceRecord, localPath: string, remotePath: string): Promise<boolean> {
    const privKey = PathManager.getPrivateKeyFile();
    const knownHosts = PathManager.getKnownHostsFile();
    const userTarget = device.user ? `${device.user}@${device.host}` : device.host;

    const args = [
      '-i', privKey,
      '-P', String(device.port || 8022),
      '-o', `UserKnownHostsFile=${knownHosts}`,
      '-o', 'StrictHostKeyChecking=accept-new',
      localPath,
      `${userTarget}:${remotePath}`,
    ];

    Logger.info(`Pushing file from ${localPath} to ${remotePath}...`);
    const res = await runCommand('scp', args, { timeout: 60000 });
    if (res.code !== 0) {
      throw new Error(`Failed to push file: ${res.stderr}`);
    }
    return true;
  }
}
