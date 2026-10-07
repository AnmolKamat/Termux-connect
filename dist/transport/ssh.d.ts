import { ChildProcess } from 'node:child_process';
import { type ExecResult } from '../shared/exec.js';
import type { DeviceRecord } from '../protocol/types.js';
export declare class SshClient {
    private device;
    constructor(device: DeviceRecord);
    private getCommonArgs;
    private getTarget;
    /**
     * Runs a one-off command over SSH.
     */
    exec(command: string, timeoutMs?: number): Promise<ExecResult>;
    /**
     * Spawns a persistent SSH process running a remote command with piped stdin/stdout.
     */
    spawnStream(remoteCommand: string): ChildProcess;
}
//# sourceMappingURL=ssh.d.ts.map