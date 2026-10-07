import * as fs from 'node:fs';
import { Logger } from '../../shared/logger.js';
import { PathManager } from '../../shared/config.js';
import { bold, dim, yellow } from '../../shared/ansi.js';

export async function logsCommand(options: { follow?: boolean; lines?: number } = {}): Promise<void> {
  const count = options.lines || 50;
  const logFile = PathManager.getLogFile();

  if (!fs.existsSync(logFile)) {
    console.log(dim(`No log file found at ${logFile}`));
    return;
  }

  const logs = Logger.getRecentLogs(count);
  console.log(`\n${bold('Recent Logs')} (${dim(logFile)})\n`);
  for (const line of logs) {
    console.log(line);
  }

  if (options.follow) {
    console.log(`\n${yellow('Following logs... Press Ctrl+C to exit.')}\n`);
    let curSize = fs.statSync(logFile).size;

    const interval = setInterval(() => {
      try {
        const newSize = fs.statSync(logFile).size;
        if (newSize > curSize) {
          const stream = fs.createReadStream(logFile, { start: curSize, end: newSize });
          stream.on('data', (chunk) => {
            process.stdout.write(chunk.toString('utf-8'));
          });
          curSize = newSize;
        }
      } catch {
        // Ignore
      }
    }, 500);

    process.on('SIGINT', () => {
      clearInterval(interval);
      process.exit(0);
    });
  }
}
