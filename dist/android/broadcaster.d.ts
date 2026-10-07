export declare class AndroidBroadcaster {
    private socket;
    private beaconTimer;
    private mdnsProc;
    private isRunning;
    private port;
    constructor(sshPort?: number);
    private getLocalIp;
    start(): Promise<void>;
    private startMdns;
    stop(): void;
}
//# sourceMappingURL=broadcaster.d.ts.map