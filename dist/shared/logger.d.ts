export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare class Logger {
    private static minLevel;
    private static quiet;
    static setLevel(level: LogLevel): void;
    static setQuiet(quiet: boolean): void;
    private static formatTime;
    private static appendToFile;
    static debug(message: string, meta?: unknown): void;
    static info(message: string, meta?: unknown): void;
    static success(message: string, meta?: unknown): void;
    static warn(message: string, meta?: unknown): void;
    static error(message: string, meta?: unknown): void;
    static getRecentLogs(linesCount?: number): string[];
}
//# sourceMappingURL=logger.d.ts.map