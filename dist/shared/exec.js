import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
/**
 * Executes a file/command with arguments and returns stdout/stderr.
 */
export async function runCommand(file, args = [], options = {}) {
    try {
        const { stdout, stderr } = await execFileAsync(file, args, {
            encoding: 'utf-8',
            timeout: options.timeout ?? 15000,
            ...options,
        });
        return {
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            code: 0,
        };
    }
    catch (err) {
        const error = err;
        return {
            stdout: error.stdout ? error.stdout.toString() : '',
            stderr: error.stderr ? error.stderr.toString() : (error.message || String(err)),
            code: typeof error.code === 'number' ? error.code : 1,
        };
    }
}
/**
 * Checks if an executable command exists in PATH.
 */
export async function commandExists(command) {
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    const result = await runCommand(checkCmd, [command], { timeout: 3000 });
    return result.code === 0 && result.stdout.trim().length > 0;
}
//# sourceMappingURL=exec.js.map