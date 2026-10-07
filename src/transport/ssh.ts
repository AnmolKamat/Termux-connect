import { spawn, ChildProcess } from 'node:child_process';
import { PathManager } from '../shared/config.js';
import { runCommand, type ExecResult } from '../shared/exec.js';
import type { DeviceRecord } from '../protocol/types.js';

export class SshClient {
  private device: DeviceRecord;

  constructor(device: DeviceRecord) {
    this.device = device;
  }

  private getCommonArgs(): string[] {
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

  private getTarget(): string {
    if (this.device.user) {
      return `${this.device.user}@${this.device.host}`;
    }
    return this.device.host;
  }

  /**
   * Runs a one-off command over SSH.
   */
  public async exec(command: string, timeoutMs = 15000): Promise<ExecResult> {
    const args = [...this.getCommonArgs(), this.getTarget(), command];
    return runCommand('ssh', args, { timeout: timeoutMs });
  }

  /**
   * Spawns a persistent SSH process running a remote command with piped stdin/stdout.
   */
  public spawnStream(remoteCommand: string): ChildProcess {
    const args = [...this.getCommonArgs(), this.getTarget(), remoteCommand];
    return spawn('ssh', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }
}
