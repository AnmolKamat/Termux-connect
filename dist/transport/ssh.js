import { spawn } from 'node:child_process';
import { PathManager } from '../shared/config.js';
import { runCommand } from '../shared/exec.js';
export class SshClient {
    device;
    constructor(device) {
        this.device = device;
    }
    getCommonArgs() {
        const knownHosts = PathManager.getKnownHostsFile();
        const privKey = PathManager.getPrivateKeyFile();
        return [
            '-i', privKey,
            '-p', String(this.device.port || 8022),
            '-o', `UserKnownHostsFile=${knownHosts}`,
            '-o', 'StrictHostKeyChecking=accept-new',
            '-o', 'ConnectTimeout=6',
            '-o', 'ServerAliveInterval=10',
            '-o', 'ServerAliveCountMax=3',
            '-o', 'TCPKeepAlive=yes',
        ];
    }
    getTarget() {
        if (this.device.user) {
            return `${this.device.user}@${this.device.host}`;
        }
        return this.device.host;
    }
    /**
     * Runs a one-off command over SSH.
     */
    async exec(command, timeoutMs = 15000) {
        const args = [...this.getCommonArgs(), this.getTarget(), command];
        return runCommand('ssh', args, { timeout: timeoutMs });
    }
    /**
     * Spawns a persistent SSH process running a remote command with piped stdin/stdout.
     */
    spawnStream(remoteCommand) {
        const args = [...this.getCommonArgs(), this.getTarget(), remoteCommand];
        return spawn('ssh', args, {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
    }
}
//# sourceMappingURL=ssh.js.map