import { EventEmitter } from 'node:events';
export declare class AndroidNotificationWatcher extends EventEmitter {
    private isWatching;
    private pollIntervalMs;
    private timer;
    private knownNotifications;
    private initialScan;
    constructor(pollIntervalMs?: number);
    start(): Promise<void>;
    private formatAppName;
    pollOnce(): Promise<void>;
    stop(): void;
}
//# sourceMappingURL=notifications.d.ts.map