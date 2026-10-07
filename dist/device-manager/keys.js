import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import { PathManager } from '../shared/config.js';
import { runCommand } from '../shared/exec.js';
import { Logger } from '../shared/logger.js';
export class KeyManager {
    /**
     * Ensures an Ed25519 keypair exists in the ~/.android-sync directory.
     */
    static async ensureKeyPair() {
        PathManager.initialize();
        const privateKeyPath = PathManager.getPrivateKeyFile();
        const publicKeyPath = PathManager.getPublicKeyFile();
        if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
            Logger.info('Generating new Ed25519 SSH keypair for android-sync...');
            const result = await runCommand('ssh-keygen', [
                '-t', 'ed25519',
                '-N', '',
                '-f', privateKeyPath,
                '-C', 'android-sync@macos',
            ]);
            if (result.code !== 0) {
                throw new Error(`Failed to generate SSH keypair: ${result.stderr}`);
            }
            // Ensure proper permissions
            try {
                fs.chmodSync(privateKeyPath, 0o600);
                fs.chmodSync(publicKeyPath, 0o644);
            }
            catch {
                // Ignore chmod issues on non-POSIX filesystems
            }
            Logger.success('Generated Ed25519 SSH keypair');
        }
        const publicKeyContent = fs.readFileSync(publicKeyPath, 'utf-8').trim();
        return {
            privateKeyPath,
            publicKeyPath,
            publicKeyContent,
        };
    }
    /**
     * Fetches remote host public key and computes its SHA256 fingerprint.
     */
    static async scanHostFingerprint(host, port = 8022) {
        const result = await runCommand('ssh-keyscan', ['-p', String(port), '-T', '5', host]);
        if (result.code !== 0 || !result.stdout.trim()) {
            throw new Error(`Could not scan host key from ${host}:${port}`);
        }
        const lines = result.stdout.trim().split('\n').filter((l) => !l.startsWith('#') && l.trim().length > 0);
        if (lines.length === 0) {
            throw new Error(`No host key returned by ${host}:${port}`);
        }
        const rawKeyLine = lines[0]; // e.g., "[192.168.1.42]:8022 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA..."
        const parts = rawKeyLine.split(' ');
        let base64Key = '';
        if (parts.length >= 3) {
            base64Key = parts[2];
        }
        else if (parts.length === 2) {
            base64Key = parts[1];
        }
        let fingerprint = 'SHA256:unknown';
        if (base64Key) {
            try {
                const keyBuffer = Buffer.from(base64Key, 'base64');
                const hash = crypto.createHash('sha256').update(keyBuffer).digest('base64').replace(/=+$/, '');
                fingerprint = `SHA256:${hash}`;
            }
            catch {
                fingerprint = 'SHA256:unavailable';
            }
        }
        return {
            rawKey: rawKeyLine,
            fingerprint,
        };
    }
    /**
     * Adds the scanned host key to ~/.android-sync/known_hosts.
     */
    static recordKnownHost(rawKeyLine) {
        PathManager.initialize();
        const knownHostsPath = PathManager.getKnownHostsFile();
        fs.appendFileSync(knownHostsPath, `${rawKeyLine.trim()}\n`, 'utf-8');
    }
}
//# sourceMappingURL=keys.js.map