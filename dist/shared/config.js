import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { DEFAULT_CONFIG_DIR_NAME } from '../protocol/constants.js';
export const DEFAULT_CONFIG = {
    autoConnect: true,
    notificationsEnabled: true,
    soundEnabled: true,
    logLevel: 'info',
    discoveryTimeoutSeconds: 4,
    heartbeatIntervalMs: 10000,
};
export class PathManager {
    static overrideBaseDir = null;
    static setBaseDir(dir) {
        this.overrideBaseDir = dir;
    }
    static getBaseDir() {
        if (this.overrideBaseDir) {
            return this.overrideBaseDir;
        }
        // Allow environment override
        if (process.env.ANDROID_SYNC_DIR) {
            return process.env.ANDROID_SYNC_DIR;
        }
        return path.join(os.homedir(), DEFAULT_CONFIG_DIR_NAME);
    }
    static ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
        }
        return dirPath;
    }
    static getConfigFile() {
        return path.join(this.getBaseDir(), 'config.json');
    }
    static getDevicesFile() {
        return path.join(this.getBaseDir(), 'devices.json');
    }
    static getKnownHostsFile() {
        return path.join(this.getBaseDir(), 'known_hosts');
    }
    static getPrivateKeyFile() {
        return path.join(this.getBaseDir(), 'id_ed25519');
    }
    static getPublicKeyFile() {
        return path.join(this.getBaseDir(), 'id_ed25519.pub');
    }
    static getLogsDir() {
        const dir = path.join(this.getBaseDir(), 'logs');
        return this.ensureDir(dir);
    }
    static getLogFile() {
        return path.join(this.getLogsDir(), 'android-sync.log');
    }
    static initialize() {
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
//# sourceMappingURL=config.js.map