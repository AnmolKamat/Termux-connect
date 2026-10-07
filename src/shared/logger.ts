import * as fs from 'node:fs';
import { PathManager } from './config.js';
import { colors, dim, red, yellow, green, cyan } from './ansi.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private static minLevel: LogLevel = 'info';
  private static quiet = false;

  public static setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public static setQuiet(quiet: boolean): void {
    this.quiet = quiet;
  }

  private static formatTime(): string {
    return new Date().toISOString();
  }

  private static appendToFile(level: LogLevel, message: string, meta?: unknown): void {
    try {
      PathManager.initialize();
      const logFile = PathManager.getLogFile();
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      const line = `[${this.formatTime()}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
      fs.appendFileSync(logFile, line, 'utf-8');
    } catch {
      // Ignore file write errors so logger never crashes app
    }
  }

  public static debug(message: string, meta?: unknown): void {
    this.appendToFile('debug', message, meta);
    if (!this.quiet && LEVEL_WEIGHT[this.minLevel] <= LEVEL_WEIGHT.debug) {
      console.log(`${dim(`[${this.formatTime().slice(11, 19)}]`)} ${dim('DEBUG')} ${message}`);
    }
  }

  public static info(message: string, meta?: unknown): void {
    this.appendToFile('info', message, meta);
    if (!this.quiet && LEVEL_WEIGHT[this.minLevel] <= LEVEL_WEIGHT.info) {
      console.log(`${dim(`[${this.formatTime().slice(11, 19)}]`)} ${cyan('INFO')}  ${message}`);
    }
  }

  public static success(message: string, meta?: unknown): void {
    this.appendToFile('info', message, meta);
    if (!this.quiet) {
      console.log(`${green('✓')} ${message}`);
    }
  }

  public static warn(message: string, meta?: unknown): void {
    this.appendToFile('warn', message, meta);
    if (!this.quiet && LEVEL_WEIGHT[this.minLevel] <= LEVEL_WEIGHT.warn) {
      console.warn(`${dim(`[${this.formatTime().slice(11, 19)}]`)} ${yellow('WARN')}  ${message}`);
    }
  }

  public static error(message: string, meta?: unknown): void {
    this.appendToFile('error', message, meta);
    if (!this.quiet && LEVEL_WEIGHT[this.minLevel] <= LEVEL_WEIGHT.error) {
      console.error(`${dim(`[${this.formatTime().slice(11, 19)}]`)} ${red('ERROR')} ${message}`);
    }
  }

  public static getRecentLogs(linesCount = 50): string[] {
    try {
      const logFile = PathManager.getLogFile();
      if (!fs.existsSync(logFile)) {
        return [];
      }
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.slice(-linesCount);
    } catch {
      return [];
    }
  }
}
