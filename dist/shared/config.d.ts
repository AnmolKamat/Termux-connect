import type { ConfigRecord } from '../protocol/types.js';
export declare const DEFAULT_CONFIG: ConfigRecord;
export declare class PathManager {
    private static overrideBaseDir;
    static setBaseDir(dir: string): void;
    static getBaseDir(): string;
    static ensureDir(dirPath: string): string;
    static getConfigFile(): string;
    static getDevicesFile(): string;
    static getKnownHostsFile(): string;
    static getPrivateKeyFile(): string;
    static getPublicKeyFile(): string;
    static getLogsDir(): string;
    static getLogFile(): string;
    static initialize(): void;
}
//# sourceMappingURL=config.d.ts.map