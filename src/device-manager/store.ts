import * as fs from 'node:fs';
import { PathManager, DEFAULT_CONFIG } from '../shared/config.js';
import type { DeviceRecord, ConfigRecord } from '../protocol/types.js';
import { Logger } from '../shared/logger.js';

export class DeviceStore {
  public static listDevices(): DeviceRecord[] {
    PathManager.initialize();
    const filePath = PathManager.getDevicesFile();
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as DeviceRecord[];
    } catch (err) {
      Logger.error('Failed to read devices.json', err);
      return [];
    }
  }

  public static getDevice(id: string): DeviceRecord | undefined {
    const devices = this.listDevices();
    return devices.find((d) => d.id === id || d.host === id || d.name.toLowerCase() === id.toLowerCase());
  }

  public static saveDevice(device: DeviceRecord): void {
    PathManager.initialize();
    const devices = this.listDevices();
    const index = devices.findIndex((d) => d.id === device.id);

    if (index >= 0) {
      devices[index] = { ...devices[index], ...device };
    } else {
      devices.push(device);
    }

    const filePath = PathManager.getDevicesFile();
    fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf-8');
    Logger.debug(`Saved device ${device.name} (${device.id})`);
  }

  public static removeDevice(id: string): boolean {
    PathManager.initialize();
    const devices = this.listDevices();
    const filtered = devices.filter((d) => d.id !== id && d.host !== id);

    if (filtered.length !== devices.length) {
      fs.writeFileSync(PathManager.getDevicesFile(), JSON.stringify(filtered, null, 2), 'utf-8');
      Logger.debug(`Removed device ${id}`);
      return true;
    }
    return false;
  }

  public static updateDeviceStatus(id: string, status: DeviceRecord['status'], lastSeen = new Date().toISOString()): void {
    const devices = this.listDevices();
    const dev = devices.find((d) => d.id === id || d.host === id);
    if (dev) {
      dev.status = status;
      dev.lastSeen = lastSeen;
      fs.writeFileSync(PathManager.getDevicesFile(), JSON.stringify(devices, null, 2), 'utf-8');
    }
  }
}

export class ConfigStore {
  public static getConfig(): ConfigRecord {
    PathManager.initialize();
    const filePath = PathManager.getConfigFile();
    try {
      if (!fs.existsSync(filePath)) {
        return DEFAULT_CONFIG;
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  public static updateConfig(partial: Partial<ConfigRecord>): ConfigRecord {
    const current = this.getConfig();
    const updated = { ...current, ...partial };
    fs.writeFileSync(PathManager.getConfigFile(), JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }
}
