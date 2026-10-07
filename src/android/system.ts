import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCommand } from '../shared/exec.js';
import type {
  DeviceInfoPayload,
  BatteryInfoPayload,
  ClipboardPayload,
  FileListPayload,
  FileEntry,
} from '../protocol/types.js';

export class AndroidSystem {
  private static cachedDeviceId: string | null = null;
  private static cachedDeviceName: string | null = null;

  public static async getModel(): Promise<string> {
    const res = await runCommand('getprop', ['ro.product.model']);
    if (res.code === 0 && res.stdout.trim()) {
      return res.stdout.trim();
    }
    return os.hostname() || 'Android Device';
  }

  public static async getManufacturer(): Promise<string> {
    const res = await runCommand('getprop', ['ro.product.manufacturer']);
    if (res.code === 0 && res.stdout.trim()) {
      return res.stdout.trim();
    }
    return 'Android';
  }

  public static async getAndroidVersion(): Promise<string> {
    const res = await runCommand('getprop', ['ro.build.version.release']);
    if (res.code === 0 && res.stdout.trim()) {
      return res.stdout.trim();
    }
    return '14+';
  }

  public static async getDeviceId(): Promise<string> {
    if (this.cachedDeviceId) {
      return this.cachedDeviceId;
    }
    const model = await this.getModel();
    const id = model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'android-device';
    this.cachedDeviceId = id;
    return id;
  }

  public static async getDeviceName(): Promise<string> {
    if (this.cachedDeviceName) {
      return this.cachedDeviceName;
    }
    const model = await this.getModel();
    this.cachedDeviceName = model;
    return model;
  }

  public static async getBattery(): Promise<BatteryInfoPayload> {
    const res = await runCommand('termux-battery-status', [], { timeout: 3000 });
    if (res.code === 0 && res.stdout.trim()) {
      try {
        const data = JSON.parse(res.stdout);
        return {
          level: data.percentage ?? 100,
          plugged: data.plugged === 'PLUGGED_AC' || data.plugged === 'PLUGGED_USB' || !!data.plugged,
          status: data.status ?? 'UNKNOWN',
          temperature: data.temperature,
          health: data.health,
        };
      } catch {
        // Fallback
      }
    }
    return {
      level: 100,
      plugged: false,
      status: 'UNAVAILABLE',
    };
  }

  public static async getDeviceInfo(): Promise<DeviceInfoPayload> {
    const model = await this.getModel();
    const manufacturer = await this.getManufacturer();
    const androidVersion = await this.getAndroidVersion();
    const deviceId = await this.getDeviceId();
    const battery = await this.getBattery();

    return {
      deviceId,
      name: model,
      model,
      manufacturer,
      androidVersion,
      batteryLevel: battery.level,
      isCharging: battery.plugged,
      batteryHealth: battery.health,
      capabilities: ['notifications', 'device', 'clipboard', 'files'],
      uptimeSeconds: os.uptime(),
    };
  }

  public static async getClipboard(): Promise<ClipboardPayload> {
    const res = await runCommand('termux-clipboard-get', [], { timeout: 3000 });
    const text = res.code === 0 ? res.stdout : '';
    const deviceId = await this.getDeviceId();
    return {
      text,
      timestamp: Date.now(),
      sourceId: deviceId,
    };
  }

  public static async setClipboard(text: string): Promise<boolean> {
    const res = await runCommand('termux-clipboard-set', [text], { timeout: 3000 });
    return res.code === 0;
  }

  public static async listFiles(dirPath = '/sdcard'): Promise<FileListPayload> {
    const resolvedPath = path.resolve(dirPath);
    const entries: FileEntry[] = [];

    try {
      const items = fs.readdirSync(resolvedPath);
      for (const item of items) {
        if (item.startsWith('.')) continue; // ignore hidden files
        try {
          const itemPath = path.join(resolvedPath, item);
          const stat = fs.statSync(itemPath);
          entries.push({
            name: item,
            path: itemPath,
            isDirectory: stat.isDirectory(),
            size: stat.size,
            modifiedTime: stat.mtimeMs,
          });
        } catch {
          // Ignore permission denied or broken links
        }
      }
    } catch {
      // Return empty if directory not accessible
    }

    return {
      path: resolvedPath,
      entries,
    };
  }
}
