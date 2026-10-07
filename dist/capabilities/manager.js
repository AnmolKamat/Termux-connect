import { runCommand } from '../shared/exec.js';
import { PathManager } from '../shared/config.js';
import { Logger } from '../shared/logger.js';
export class CapabilityManager {
    static async getDeviceInfo(conn) {
        return conn.request('device', 'get_info');
    }
    static async getBatteryStatus(conn) {
        return conn.request('device', 'get_battery');
    }
    static async getClipboard(conn) {
        const res = await conn.request('clipboard', 'get');
        return res.text;
    }
    static async setClipboard(conn, text) {
        await conn.request('clipboard', 'set', { text });
        return true;
    }
    static async listFiles(conn, remotePath = '/sdcard') {
        return conn.request('files', 'list', { path: remotePath });
    }
    /**
     * Pulls a file from Android using scp
     */
    static async pullFile(device, remotePath, localPath) {
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
    static async pushFile(device, localPath, remotePath) {
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
//# sourceMappingURL=manager.js.map