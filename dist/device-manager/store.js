import * as fs from 'node:fs';
import { PathManager, DEFAULT_CONFIG } from '../shared/config.js';
import { Logger } from '../shared/logger.js';
export class DeviceStore {
    static listDevices() {
        PathManager.initialize();
        const filePath = PathManager.getDevicesFile();
        try {
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (err) {
            Logger.error('Failed to read devices.json', err);
            return [];
        }
    }
    static getDevice(id) {
        const devices = this.listDevices();
        return devices.find((d) => d.id === id || d.host === id || d.name.toLowerCase() === id.toLowerCase());
    }
    static saveDevice(device) {
        PathManager.initialize();
        const devices = this.listDevices();
        const index = devices.findIndex((d) => d.id === device.id);
        if (index >= 0) {
            devices[index] = { ...devices[index], ...device };
        }
        else {
            devices.push(device);
        }
        const filePath = PathManager.getDevicesFile();
        fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf-8');
        Logger.debug(`Saved device ${device.name} (${device.id})`);
    }
    static removeDevice(id) {
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
    static updateDeviceStatus(id, status, lastSeen = new Date().toISOString()) {
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
    static getConfig() {
        PathManager.initialize();
        const filePath = PathManager.getConfigFile();
        try {
            if (!fs.existsSync(filePath)) {
                return DEFAULT_CONFIG;
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
        }
        catch {
            return DEFAULT_CONFIG;
        }
    }
    static updateConfig(partial) {
        const current = this.getConfig();
        const updated = { ...current, ...partial };
        fs.writeFileSync(PathManager.getConfigFile(), JSON.stringify(updated, null, 2), 'utf-8');
        return updated;
    }
}
//# sourceMappingURL=store.js.map