import { ExecFileOptions } from 'node:child_process';
export interface ExecResult {
    stdout: string;
    stderr: string;
    code: number;
}
/**
 * Executes a file/command with arguments and returns stdout/stderr.
 */
export declare function runCommand(file: string, args?: string[], options?: ExecFileOptions): Promise<ExecResult>;
/**
 * Checks if an executable command exists in PATH.
 */
export declare function commandExists(command: string): Promise<boolean>;
//# sourceMappingURL=exec.d.ts.map