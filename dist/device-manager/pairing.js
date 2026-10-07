import { KeyManager } from './keys.js';
import { DeviceStore } from './store.js';
import { runCommand } from '../shared/exec.js';
import { Logger } from '../shared/logger.js';
import { PathManager } from '../shared/config.js';
import { DEFAULT_PAIRING_PORT } from '../protocol/constants.js';
export class PairingManager {
    static async pairDevice(options) {
        const host = options.host.trim();
        const port = options.port ?? 8022;
        let user = options.user;
        Logger.info(`Initiating pairing with ${host}:${port}...`);
        // 1. Ensure local SSH keys
        const { privateKeyPath, publicKeyContent } = await KeyManager.ensureKeyPair();
        // 2. Scan remote host fingerprint
        let fingerprint = 'SHA256:unknown';
        try {
            const scanResult = await KeyManager.scanHostFingerprint(host, port);
            fingerprint = scanResult.fingerprint;
            KeyManager.recordKnownHost(scanResult.rawKey);
            Logger.debug(`Host fingerprint: ${fingerprint}`);
        }
        catch (err) {
            Logger.warn(`Could not pre-scan host key: ${err.message}. Will accept on first connection.`);
        }
        // 3. User verification of fingerprint if callback provided
        if (options.onFingerprintPrompt) {
            const accepted = await options.onFingerprintPrompt(fingerprint, host);
            if (!accepted) {
                throw new Error('Pairing aborted by user: host fingerprint rejected.');
            }
        }
        // 4. Try key-based connection first (in case key was already installed)
        const getTestArgs = (u) => [
            '-i', privateKeyPath,
            '-o', `UserKnownHostsFile=${PathManager.getKnownHostsFile()}`,
            '-o', 'StrictHostKeyChecking=accept-new',
            '-o', 'BatchMode=yes',
            '-o', 'ConnectTimeout=5',
            '-p', String(port),
            ...(u ? [`${u}@${host}`] : [host]),
            'echo ANDROID_SYNC_OK',
        ];
        let probeResult = await runCommand('ssh', getTestArgs(user));
        let keyInstalled = probeResult.stdout.includes('ANDROID_SYNC_OK');
        if (!keyInstalled) {
            // 4b. Try seamless local HTTP pairing via android-sync-bridge
            try {
                Logger.info(`Attempting seamless local key pairing via bridge (${host}:${DEFAULT_PAIRING_PORT})...`);
                const pairUrl = `http://${host}:${DEFAULT_PAIRING_PORT}/pair`;
                const res = await fetch(pairUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publicKey: publicKeyContent }),
                    signal: AbortSignal.timeout(2500),
                });
                if (res.ok) {
                    const resData = (await res.json());
                    if (resData.success) {
                        keyInstalled = true;
                        if (resData.user && !user) {
                            user = resData.user;
                        }
                        Logger.success(`SSH key installed seamlessly on Android (user: ${user || 'default'})!`);
                    }
                }
            }
            catch {
                Logger.debug('Local HTTP bridge endpoint not reachable, trying standard SSH install...');
            }
        }
        if (!keyInstalled) {
            // 5. Try installing key via ssh-copy-id
            Logger.info(`Installing SSH key on ${host}:${port}...`);
            const copyIdArgs = [
                '-i', PathManager.getPublicKeyFile(),
                '-p', String(port),
                '-o', `UserKnownHostsFile=${PathManager.getKnownHostsFile()}`,
                '-o', 'StrictHostKeyChecking=accept-new',
                ...(user ? [`${user}@${host}`] : [host]),
            ];
            const copyResult = await runCommand('ssh-copy-id', copyIdArgs, { timeout: 30000 });
            if (copyResult.code === 0) {
                keyInstalled = true;
            }
            else {
                // If ssh-copy-id failed (e.g. requires interactive password or Termux setup)
                if (options.onManualKeyPrompt) {
                    const proceed = await options.onManualKeyPrompt(publicKeyContent, host, port);
                    if (!proceed) {
                        throw new Error('Key installation cancelled.');
                    }
                }
            }
        }
        // Re-probe after key installation
        probeResult = await runCommand('ssh', getTestArgs(user));
        if (!probeResult.stdout.includes('ANDROID_SYNC_OK')) {
            throw new Error(`SSH key authentication failed for ${host}:${port}. Please verify that the Mac public key is in ~/.ssh/authorized_keys on Termux.`);
        }
        // 6. Query device details
        let deviceModel = 'Android Device';
        let deviceName = options.name || '';
        try {
            const modelCmd = await runCommand('ssh', [
                '-i', privateKeyPath,
                '-o', `UserKnownHostsFile=${PathManager.getKnownHostsFile()}`,
                '-p', String(port),
                ...(user ? [`${user}@${host}`] : [host]),
                'getprop ro.product.model 2>/dev/null || uname -n',
            ]);
            if (modelCmd.code === 0 && modelCmd.stdout.trim()) {
                deviceModel = modelCmd.stdout.trim();
            }
        }
        catch {
            // Ignore
        }
        if (!deviceName) {
            deviceName = deviceModel;
        }
        const deviceId = deviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `android-${Date.now()}`;
        const capabilities = ['notifications', 'device', 'clipboard', 'files'];
        const deviceRecord = {
            id: deviceId,
            name: deviceName,
            model: deviceModel,
            host,
            port,
            user,
            capabilities,
            pairedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            fingerprint,
            status: 'connected',
            notificationFilter: {
                enabled: true,
            },
        };
        DeviceStore.saveDevice(deviceRecord);
        Logger.success(`Device paired successfully: ${deviceName} (${host}:${port})`);
        return deviceRecord;
    }
}
//# sourceMappingURL=pairing.js.map