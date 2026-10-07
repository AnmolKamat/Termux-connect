import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { DEFAULT_CONFIG_DIR_NAME } from '../protocol/constants.js';
import type { ConfigRecord } from '../protocol/types.js';

export const DEFAULT_CONFIG: ConfigRecord = {
  autoConnect: true,
  notificationsEnabled: true,
  soundEnabled: true,
  logLevel: 'info',
  discoveryTimeoutSeconds: 4,
  heartbeatIntervalMs: 10000,
};

export class PathManager {
  private static overrideBaseDir: string | null = null;

  public static setBaseDir(dir: string): void {
    this.overrideBaseDir = dir;
  }

  public static getBaseDir(): string {
    if (this.overrideBaseDir) {
      return this.overrideBaseDir;
    }
    // Allow environment override
    if (process.env.ANDROID_SYNC_DIR) {
      return process.env.ANDROID_SYNC_DIR;
    }
    return path.join(os.homedir(), DEFAULT_CONFIG_DIR_NAME);
  }

  public static ensureDir(dirPath: string): string {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
    }
    return dirPath;
  }

  public static getConfigFile(): string {
    return path.join(this.getBaseDir(), 'config.json');
  }

  public static getDevicesFile(): string {
    return path.join(this.getBaseDir(), 'devices.json');
  }

  public static getKnownHostsFile(): string {
    return path.join(this.getBaseDir(), 'known_hosts');
  }

  public static getPrivateKeyFile(): string {
    return path.join(this.getBaseDir(), 'id_ed25519');
  }

  public static getPublicKeyFile(): string {
    return path.join(this.getBaseDir(), 'id_ed25519.pub');
  }

  public static getLogsDir(): string {
    const dir = path.join(this.getBaseDir(), 'logs');
    return this.ensureDir(dir);
  }

  public static getLogFile(): string {
    return path.join(this.getLogsDir(), 'android-sync.log');
  }

  public static initialize(): void {
    this.ensureDir(this.getBaseDir());
    this.ensureDir(this.getLogsDir());

    const knownHosts = this.getKnownHostsFile();
    if (!fs.existsSync(knownHosts)) {
      fs.writeFileSync(knownHosts, '', { mode: 0o600 });
    }

    const configFile = this.getConfigFile();
    if (!fs.existsSync(configFile)) {
      fs.writeFileSync(configFile, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    }

    const devicesFile = this.getDevicesFile();
    if (!fs.existsSync(devicesFile)) {
      fs.writeFileSync(devicesFile, JSON.stringify([], null, 2), 'utf-8');
    }
  }
}
