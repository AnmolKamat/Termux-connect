import { execFile, spawn, ExecFileOptions, ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

/**
 * Executes a file/command with arguments and returns stdout/stderr.
 */
export async function runCommand(
  file: string,
  args: string[] = [],
  options: ExecFileOptions = {}
): Promise<ExecResult> {
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
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; code?: number; message?: string };
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
export async function commandExists(command: string): Promise<boolean> {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = await runCommand(checkCmd, [command], { timeout: 3000 });
  return result.code === 0 && result.stdout.trim().length > 0;
}
