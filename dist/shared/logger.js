import * as fs from 'node:fs';
import { PathManager } from './config.js';
import { dim, red, yellow, green, cyan } from './ansi.js';
const LEVEL_WEIGHT = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
export class Logger {
    static minLevel = 'info';
    static quiet = false;
    static setLevel(level) {
        this.minLevel = level;
    }
    static setQuiet(quiet) {
        this.quiet = quiet;
    }
    static formatTime() {
        return new Date().toISOString();
    }
    static appendToFile(level, message, meta) {
        try {
            PathManager.initialize();
            const logFile = PathManager.getLogFile();
            const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
            const line = `[${this.formatTime()}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
            fs.appendFileSync(logFile, line, 'utf-8');
        }
        catch {
            // Ignore file write errors so logger never crashes app
        }
    }
    static debug(message, meta) {
        this.appendToFile('debug', message, meta);
        if (!this.quiet && LEVEL_WEIGHT[this.minLevel] <= LEVEL_WEIGHT.debug) {
            console.log(`${dim(`[${this.formatTime().slice(11, 19)}]`)} ${dim('DEBUG')} ${message}`);
        }
    }
    static info(message, meta) {
        this.appendToFile('info', message, meta);
        if (!this.quiet && LEVEL_WEIGHT[this.minLevel] <= LEVEL_WEIGHT.info) {
            console.log(`${dim(`[${this.formatTime().slice(11, 19)}]`)} ${cyan('INFO')}  ${message}`);
        }
    }
    static success(message, meta) {
        this.appendToFile('info', message, meta);
        if (!this.quiet) {
            console.log(`${green('✓')} ${message}`);
        }
    }
    static warn(message, meta) {
        this.appendToFile('warn', message, meta);
        if (!this.quiet && LEVEL_WEIGHT[this.minLevel] <= LEVEL_WEIGHT.warn) {
            console.warn(`${dim(`[${this.formatTime().slice(11, 19)}]`)} ${yellow('WARN')}  ${message}`);
        }
    }
    static error(message, meta) {
        this.appendToFile('error', message, meta);
        if (!this.quiet && LEVEL_WEIGHT[this.minLevel] <= LEVEL_WEIGHT.error) {
            console.error(`${dim(`[${this.formatTime().slice(11, 19)}]`)} ${red('ERROR')} ${message}`);
        }
    }
    static getRecentLogs(linesCount = 50) {
        try {
            const logFile = PathManager.getLogFile();
            if (!fs.existsSync(logFile)) {
                return [];
            }
            const content = fs.readFileSync(logFile, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            return lines.slice(-linesCount);
        }
        catch {
            return [];
        }
    }
}
//# sourceMappingURL=logger.js.map